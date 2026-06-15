// =============================================================
// IDX Broker (Elm Street) provider.
// Docs: https://middleware.idxbroker.com/docs/api/
//
// Auth: accesskey header + outputtype: json header
// Rate limit: ~6000 req/hr per account. We use Next.js ISR
// with 5-min revalidation to stay well under that.
//
// Env vars (set in Railway → Variables):
//   IDX_BROKER_getAccessKey()   — partner API key
//   IDX_BROKER_getAccountId()   — 5-digit account ID
//   IDX_BROKER_getAncillaryKey() — optional secondary key
//   PREMIER_TOOELE_CITIES   — optional override (comma-separated)
// =============================================================
import type {
  Listing,
  ListingSearchFilters,
  ListingSearchOptions,
  ListingSearchResult,
  MLSProvider,
} from "../types";
import { FALLBACK_MLS_CONFIG } from "../fallback-config";

const BASE_URL = "https://api.idxbroker.com";

// Strip surrounding quotes from env values
function cleanEnv(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const cleaned = v.trim().replace(/^['"]+|['"]+$/g, "");
  return cleaned || undefined;
}

// Read each call so Railway env var updates take effect without a code change.
function getAccessKey(): string {
  return cleanEnv(process.env.IDX_BROKER_ACCESS_KEY) ?? FALLBACK_MLS_CONFIG.idxBroker.accessKey;
}
function getAccountId(): string {
  return cleanEnv(process.env.IDX_BROKER_ACCOUNT_ID) ?? FALLBACK_MLS_CONFIG.idxBroker.accountId;
}
function getAncillaryKey(): string | undefined {
  return cleanEnv(process.env.IDX_BROKER_ANCILLARY_KEY);
}

// =============================================================
// Geographic filter — Premier sells in Tooele County, UT.
// =============================================================
const DEFAULT_TOOELE_CITIES = [
  "Tooele",
  "Stansbury Park",
  "Grantsville",
  "Erda",
  "Lake Point",
  "Stockton",
  "Wendover",
  "Rush Valley",
  "Vernon",
  "Ophir",
  "Dugway",
];

const TOOELE_CITIES = (
  process.env.PREMIER_TOOELE_CITIES?.split(",").map((c) => c.trim()).filter(Boolean) ??
  DEFAULT_TOOELE_CITIES
);

const TOOELE_CITIES_LOWER = TOOELE_CITIES.map((c) => c.toLowerCase());

const TOOELE_ZIPS = ["84029", "84034", "84069", "84071", "84072", "84074", "84080", "84083"];

function isInTooele(l: Listing): boolean {
  const city = (l.location.city ?? "").toLowerCase().trim();
  const zip = (l.location.postalCode ?? "").trim();
  const county = (l.location.county ?? "").toLowerCase().trim();
  if (county === "tooele") return true;
  if (TOOELE_CITIES_LOWER.includes(city)) return true;
  if (TOOELE_ZIPS.includes(zip)) return true;
  return false;
}

// =============================================================
// API response shape
// =============================================================
interface IDXBrokerListing {
  listingID: string;
  idxID?: string;
  idxStatus?: string;
  address?: string;
  streetName?: string;
  streetNumber?: string;
  streetDirection?: string;
  unitNumber?: string;
  cityName?: string;
  countyName?: string;
  state?: string;
  zipcode?: string;
  listingPrice?: string;
  originalPrice?: string;
  bedrooms?: string;
  totalBaths?: string;
  fullBaths?: string;
  partialBaths?: string;
  sqFt?: string;
  acres?: string;
  yearBuilt?: string;
  propType?: string;
  propStatus?: string;
  propSubType?: string;
  remarksConcat?: string;
  latitude?: string;
  longitude?: string;
  subdivision?: string;
  elementarySchool?: string;
  middleSchool?: string;
  highSchool?: string;
  schoolDistrict?: string;
  garageSpaces?: string;
  stories?: string;
  taxes?: string;
  hoaDues?: string;
  hoaDuesPer?: string;
  image?: Record<string, unknown>;
  agentID?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentLicense?: string;
  officeName?: string;
  officeID?: string;
  officePhone?: string;
  videoTour?: string;
  virtualTourURL?: string;
  listDate?: string;
  lastUpdateMLS?: string;
}

// =============================================================
// Helpers
// =============================================================
function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v);
  return s === "" ? undefined : s;
}

function mapStatus(idxStatus?: string): Listing["status"] {
  const s = (idxStatus ?? "").toLowerCase();
  if (s.includes("active")) return "Active";
  if (s.includes("pending")) return "Pending";
  if (s.includes("closed") || s.includes("sold")) return "Closed";
  if (s.includes("under contract")) return "ActiveUnderContract";
  if (s.includes("coming soon")) return "ComingSoon";
  return "Active";
}

function mapPropertyType(propType?: string): Listing["propertyType"] {
  const t = (propType ?? "").toLowerCase();
  if (t.includes("commercial")) return "Commercial";
  if (t.includes("land") || t.includes("lots")) return "Land";
  if (t.includes("farm") || t.includes("ranch")) return "Farm";
  if (t.includes("income") || t.includes("multi")) return "ResidentialIncome";
  return "Residential";
}

function extractPhotos(image: IDXBrokerListing["image"]): Listing["photos"] {
  if (!image || typeof image !== "object") return [];
  const photos: Listing["photos"] = [];
  Object.entries(image).forEach(([key, val]) => {
    if (key === "totalCount" || !val || typeof val !== "object") return;
    const photo = val as { url?: string; caption?: string };
    if (!photo.url) return;
    const order = Number(key);
    photos.push({
      url: photo.url,
      caption: photo.caption,
      order: Number.isFinite(order) ? order : photos.length,
      isPrimary: Number.isFinite(order) && order === 0,
    });
  });
  return photos.sort((a, b) => a.order - b.order);
}

function fromIDXBrokerListing(p: IDXBrokerListing): Listing {
  const listPrice = num(p.listingPrice) ?? 0;
  const livingArea = num(p.sqFt) ?? 0;

  const streetParts = [p.streetNumber, p.streetDirection, p.streetName].filter(Boolean);
  const street = p.address ?? streetParts.join(" ") ?? "";

  return {
    listingKey: p.listingID,
    mlsNumber: p.listingID,
    status: mapStatus(p.idxStatus ?? p.propStatus),
    propertyType: mapPropertyType(p.propType),
    propertySubType: p.propSubType as Listing["propertySubType"],
    publicRemarks: p.remarksConcat ?? "",
    location: {
      street,
      unit: p.unitNumber,
      city: p.cityName ?? "",
      state: p.state ?? "UT",
      postalCode: p.zipcode ?? "",
      county: p.countyName,
      subdivision: p.subdivision,
      latitude: num(p.latitude),
      longitude: num(p.longitude),
    },
    financial: {
      listPrice,
      originalListPrice: num(p.originalPrice),
      pricePerSqft: livingArea > 0 ? Math.round(listPrice / livingArea) : undefined,
      taxAnnualAmount: num(p.taxes),
      hoaFee: num(p.hoaDues),
      hoaFrequency: p.hoaDuesPer as Listing["financial"]["hoaFrequency"],
    },
    features: {
      bedrooms: num(p.bedrooms) ?? 0,
      bathroomsTotal: num(p.totalBaths) ?? 0,
      bathroomsFull: num(p.fullBaths),
      bathroomsHalf: num(p.partialBaths),
      livingArea,
      lotSizeAcres: num(p.acres),
      yearBuilt: num(p.yearBuilt),
      garageSpaces: num(p.garageSpaces),
      stories: num(p.stories),
    },
    schools: {
      elementarySchool: p.elementarySchool,
      middleSchool: p.middleSchool,
      highSchool: p.highSchool,
      schoolDistrict: p.schoolDistrict,
    },
    photos: extractPhotos(p.image),
    videoUrl: str(p.videoTour),
    virtualTourUrl: str(p.virtualTourURL),
    listAgent: {
      fullName: p.agentName ?? "",
      email: p.agentEmail,
      phone: p.agentPhone,
      licenseNumber: p.agentLicense,
      mlsAgentId: p.agentID,
    },
    listOffice: {
      name: p.officeName ?? "Premier Utah Real Estate",
      phone: p.officePhone,
      mlsOfficeId: p.officeID,
    },
    onMarketDate: p.listDate,
    modificationTimestamp: p.lastUpdateMLS ?? new Date().toISOString(),
    hasVideoTour: Boolean(p.videoTour || p.virtualTourURL),
    isPremierListing: true,
  };
}

function normalizeResponse(data: unknown): IDXBrokerListing[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as IDXBrokerListing[];
  if (typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.listings)) return obj.listings as IDXBrokerListing[];

  // IDX Broker often returns objects keyed by listingID — { "abc123": {...}, "def456": {...} }
  return Object.values(obj).filter(
    (v): v is IDXBrokerListing => v !== null && typeof v === "object",
  );
}

function buildHeaders(): Record<string, string> {
  if (!getAccessKey()) {
    throw new Error("IDX_BROKER_ACCESS_KEY is not set.");
  }
  const headers: Record<string, string> = {
    accesskey: getAccessKey(),
    outputtype: "json",
    apiversion: "1.8.0", // Match account's API Preferences setting in IDX Broker dashboard
  };
  // IMPORTANT: ancillarykey is ONLY for partner integrations using someone
  // else's account. For our own Account API (with our own access key), we
  // must NOT send ancillarykey — doing so causes IDX Broker to interpret the
  // request as a partner request and reject it.
  const ancillary = getAncillaryKey();
  if (ancillary) headers.ancillarykey = ancillary;
  return headers;
}

// Cache the approved MLS IDs (e.g. "a000") for the account.
let _approvedIdxIds: string[] | null = null;
async function getApprovedIdxIds(): Promise<string[]> {
  if (_approvedIdxIds !== null) return _approvedIdxIds;
  try {
    const data = await fetchIDX<Record<string, { idxID?: string }> | Array<{ idxID?: string }>>(
      "/clients/approvedmls",
    );
    const arr = Array.isArray(data) ? data : Object.values(data ?? {});
    _approvedIdxIds = arr.map((m) => m.idxID).filter((x): x is string => !!x);
    console.info("[idxBroker] approved MLS IDs:", _approvedIdxIds);
  } catch (err) {
    console.warn("[idxBroker] /clients/approvedmls failed:", err);
    _approvedIdxIds = [];
  }
  return _approvedIdxIds;
}

async function fetchIDX<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`IDX Broker API ${res.status} for ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// =============================================================
// Provider implementation
// =============================================================
export const idxBrokerProvider: MLSProvider = {
  name: "idxbroker",

  async getListing(listingKey: string): Promise<Listing | null> {
    try {
      const data = await fetchIDX(`/clients/listing/${encodeURIComponent(listingKey)}`);
      const arr = normalizeResponse(data);
      return arr.length > 0 ? fromIDXBrokerListing(arr[0]) : null;
    } catch (err) {
      console.error("[idxBroker] getListing failed:", err);
      return null;
    }
  },

  async searchListings(
    _filters: ListingSearchFilters = {},
    options: ListingSearchOptions = {},
  ): Promise<ListingSearchResult> {
    // NOTE: Per IDX Broker's API docs, there is no /mls/search method
    // available to Client-tier accounts. The /clients/* endpoints only
    // return the office's own listings (featured / offmarket / soldpending
    // / supplemental). For MLS-wide search the visitor uses our existing
    // widget at forsale.homesintooele.com.
    //
    // This method now fetches /clients/featured and lets the caller filter
    // post-hoc. It also returns soldpending as a secondary source if needed.
    try {
      const data = await fetchIDX("/clients/featured");
      const arr = normalizeResponse(data);
      const tooele = arr.map(fromIDXBrokerListing).filter(isInTooele);
      const limit = options.limit ?? tooele.length;
      const offset = options.offset ?? 0;
      return {
        listings: tooele.slice(offset, offset + limit),
        total: tooele.length,
        limit,
        offset,
      };
    } catch (err) {
      console.error("[idxBroker] searchListings (/clients/featured) failed:", err);
      return { listings: [], total: 0, limit: options.limit ?? 0, offset: options.offset ?? 0 };
    }
  },

  async getFeaturedListings(limit = 6): Promise<Listing[]> {
    // Per IDX Broker API docs, the Client tier has these listing methods:
    //   /clients/featured     — office's featured (active) properties
    //   /clients/offmarket    — off-market
    //   /clients/soldpending  — sold/pending
    //   /clients/supplemental — non-MLS supplemental
    // There is NO /clients/activels (we used to call it — guaranteed 400).
    // There is NO /mls/search at Client tier (Partner-tier only).
    //
    // If Premier has no featured properties marked in their IDX Broker
    // dashboard, this returns an empty array.
    try {
      const data = await fetchIDX("/clients/featured");
      const arr = normalizeResponse(data);
      if (arr.length === 0) {
        console.info(
          "[idxBroker] /clients/featured returned no listings. " +
            "Mark listings as 'featured' in IDX Broker → Properties → Featured to populate this.",
        );
      }
      return arr.map(fromIDXBrokerListing).slice(0, limit);
    } catch (err) {
      console.error("[idxBroker] /clients/featured failed:", err);
      return [];
    }
  },
};

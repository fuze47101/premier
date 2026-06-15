// =============================================================
// IDX Broker (Elm Street) provider.
// Docs: https://middleware.idxbroker.com/docs/api/
//
// Auth: accesskey header + outputtype: json header
// Rate limit: ~6000 req/hr per account. We use Next.js ISR
// with 5-min revalidation to stay well under that.
//
// Env vars (set in Railway → Variables):
//   IDX_BROKER_ACCESS_KEY   — partner API key
//   IDX_BROKER_ACCOUNT_ID   — 5-digit account ID
//   IDX_BROKER_ANCILLARY_KEY — optional secondary key
//   PREMIER_TOOELE_CITIES   — optional override (comma-separated)
// =============================================================
import type {
  Listing,
  ListingSearchFilters,
  ListingSearchOptions,
  ListingSearchResult,
  MLSProvider,
} from "../types";

const BASE_URL = "https://api.idxbroker.com";
const ACCESS_KEY = process.env.IDX_BROKER_ACCESS_KEY;
const ACCOUNT_ID = process.env.IDX_BROKER_ACCOUNT_ID;
const ANCILLARY_KEY = process.env.IDX_BROKER_ANCILLARY_KEY;

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
  if (!ACCESS_KEY) {
    throw new Error(
      "IDX_BROKER_ACCESS_KEY is not set. Configure it in Railway → Variables and locally in .env.local.",
    );
  }
  const headers: Record<string, string> = {
    accesskey: ACCESS_KEY,
    outputtype: "json",
    apiversion: "1.8.0",
  };
  if (ANCILLARY_KEY) headers.ancillarykey = ANCILLARY_KEY;
  return headers;
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
    filters: ListingSearchFilters = {},
    options: ListingSearchOptions = {},
  ): Promise<ListingSearchResult> {
    const useMLSSearch = !filters.isPremierListing;
    const path = useMLSSearch ? `/mls/search/${ACCOUNT_ID ?? ""}` : "/clients/activels";

    const params = new URLSearchParams();
    if (filters.minPrice) params.set("lp", String(filters.minPrice));
    if (filters.maxPrice) params.set("hp", String(filters.maxPrice));
    if (filters.minBedrooms) params.set("bd", String(filters.minBedrooms));
    if (filters.minBathrooms) params.set("ba", String(filters.minBathrooms));
    if (filters.minLivingArea) params.set("sqft", String(filters.minLivingArea));

    if (filters.city) {
      const cities = Array.isArray(filters.city) ? filters.city : [filters.city];
      params.set("city", cities.join(","));
    } else {
      params.set("city", TOOELE_CITIES.join(","));
    }

    if (options.limit) params.set("per", String(Math.max(options.limit, 50)));
    if (options.offset) params.set("start", String(options.offset));

    const qs = params.toString();
    try {
      const data = await fetchIDX(`${path}${qs ? `?${qs}` : ""}`);
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
      console.error("[idxBroker] searchListings failed:", err);
      return { listings: [], total: 0, limit: options.limit ?? 0, offset: options.offset ?? 0 };
    }
  },

  async getFeaturedListings(limit = 6): Promise<Listing[]> {
    const tryEndpoint = async (path: string): Promise<Listing[]> => {
      try {
        const data = await fetchIDX(path);
        const arr = normalizeResponse(data);
        return arr.map(fromIDXBrokerListing).filter(isInTooele);
      } catch (err) {
        console.warn(`[idxBroker] ${path} unavailable:`, err);
        return [];
      }
    };

    let listings = await tryEndpoint("/clients/featured");
    if (listings.length === 0) listings = await tryEndpoint("/clients/activels");

    if (listings.length === 0) {
      console.info("[idxBroker] falling back to /mls/search for Tooele");
      const result = await idxBrokerProvider.searchListings(
        { status: "Active" },
        { limit: 50, orderBy: "ModificationTimestamp" },
      );
      listings = result.listings;
    }

    return listings.slice(0, limit);
  },
};

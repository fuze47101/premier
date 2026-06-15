// =============================================================
// IDX Broker (Elm Street) provider.
// Docs: https://middleware.idxbroker.com/docs/api/
//
// Auth: accesskey header + outputtype: json header
// Rate limit: ~6000 req/hr per account. We use Next.js ISR
// with 5-min revalidation to stay well under that.
//
// Env vars required (set in Railway → Variables):
//   IDX_BROKER_ACCESS_KEY   — partner API key
//   IDX_BROKER_ACCOUNT_ID   — 5-digit account ID (e.g., 58276)
//   IDX_BROKER_ANCILLARY_KEY — optional secondary key (some accounts)
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

// IDX Broker returns slightly different shapes per endpoint.
// This shape covers /clients/featured and /clients/listing/{id}.
interface IDXBrokerListing {
  listingID: string;
  idxID?: string;
  idxStatus?: string;
  address: string;
  streetName?: string;
  streetNumber?: string;
  streetDirection?: string;
  unitNumber?: string;
  cityName: string;
  countyName?: string;
  state: string;
  zipcode: string;
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
  image?: {
    [index: string]: { url: string; caption?: string };
  } & { totalCount?: number };
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

// Map IDX Broker status strings to our internal RESO-style enum.
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

function num(v?: string): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function fromIDXBrokerListing(p: IDXBrokerListing): Listing {
  // IDX Broker returns images as { 0: {url, caption}, 1: {...}, totalCount: N }
  const photos: Listing["photos"] = [];
  if (p.image) {
    const { totalCount: _ignore, ...indexedPhotos } = p.image;
    Object.entries(indexedPhotos).forEach(([idx, photo]) => {
      if (photo && typeof photo === "object" && "url" in photo) {
        photos.push({
          url: (photo as { url: string }).url,
          caption: (photo as { caption?: string }).caption,
          order: Number(idx),
          isPrimary: Number(idx) === 0,
        });
      }
    });
  }

  const listPrice = num(p.listingPrice) ?? 0;
  const livingArea = num(p.sqFt) ?? 0;

  return {
    listingKey: p.listingID,
    mlsNumber: p.listingID,
    status: mapStatus(p.idxStatus ?? p.propStatus),
    propertyType: mapPropertyType(p.propType),
    propertySubType: p.propSubType as Listing["propertySubType"],
    publicRemarks: p.remarksConcat ?? "",
    location: {
      street: p.address || [p.streetNumber, p.streetDirection, p.streetName].filter(Boolean).join(" "),
      unit: p.unitNumber,
      city: p.cityName,
      state: p.state,
      postalCode: p.zipcode,
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
      hoaFrequency: (p.hoaDuesPer as Listing["financial"]["hoaFrequency"]) || undefined,
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
    photos,
    videoUrl: p.videoTour,
    virtualTourUrl: p.virtualTourURL,
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
    isPremierListing: true, // assume listings from our account
  };
}

function buildHeaders(): HeadersInit {
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

async function fetchIDX<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: buildHeaders(),
    next: { revalidate: 300 }, // 5-min ISR cache
  });
  if (!res.ok) {
    throw new Error(`IDX Broker API ${res.status} for ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const idxBrokerProvider: MLSProvider = {
  name: "idxbroker",

  async getListing(listingKey) {
    // IDX Broker requires the idxID along with listingID for some accounts.
    // We try the simpler form first; pass idxID if account requires it.
    try {
      const data = await fetchIDX<IDXBrokerListing | IDXBrokerListing[]>(
        `/clients/listing/${encodeURIComponent(listingKey)}`,
      );
      const listing = Array.isArray(data) ? data[0] : data;
      return listing ? fromIDXBrokerListing(listing) : null;
    } catch (err) {
      console.error("[idxBroker] getListing failed:", err);
      return null;
    }
  },

  async searchListings(filters = {}, options = {}) {
    // /clients/activels returns active listings owned by your account
    // /mls/search returns full MLS-wide search (IDX-permitted)
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
    }
    if (options.limit) params.set("per", String(options.limit));
    if (options.offset) params.set("start", String(options.offset));

    const qs = params.toString();
    try {
      const data = await fetchIDX<IDXBrokerListing[] | { listings: IDXBrokerListing[] }>(
        `${path}${qs ? `?${qs}` : ""}`,
      );
      const arr = Array.isArray(data) ? data : (data.listings ?? []);
      const listings = arr.map(fromIDXBrokerListing);
      return {
        listings,
        total: listings.length, // IDX Broker doesn't return a total count consistently
        limit: options.limit ?? listings.length,
        offset: options.offset ?? 0,
      } satisfies ListingSearchResult;
    } catch (err) {
      console.error("[idxBroker] searchListings failed:", err);
      return { listings: [], total: 0, limit: options.limit ?? 0, offset: options.offset ?? 0 };
    }
  },

  async getFeaturedListings(limit = 6) {
    // Strategy: try /clients/featured first (curated by broker), fall back to
    // /clients/activels (all active listings owned by the account) so the
    // homepage always has something to show.
    try {
      const featured = await fetchIDX<IDXBrokerListing[] | Record<string, IDXBrokerListing>>(
        "/clients/featured",
      );
      const featuredArr = Array.isArray(featured) ? featured : Object.values(featured ?? {});
      if (featuredArr.length > 0) {
        return featuredArr.slice(0, limit).map(fromIDXBrokerListing);
      }
    } catch (err) {
      console.warn("[idxBroker] /clients/featured returned no usable data:", err);
    }
    try {
      const active = await fetchIDX<IDXBrokerListing[] | Record<string, IDXBrokerListing>>(
        "/clients/activels",
      );
      const activeArr = Array.isArray(active) ? active : Object.values(active ?? {});
      return activeArr.slice(0, limit).map(fromIDXBrokerListing);
    } catch (err) {
      console.error("[idxBroker] getFeaturedListings fallback failed:", err);
      return [];
    }
  },
};

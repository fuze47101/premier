// =============================================================
// Bridge Interactive provider (Zillow Group's RESO Web API).
// Most likely WFRMLS aggregator. Implementation pending real
// credentials and the WFRMLS data dictionary.
//
// When credentials arrive:
//   1. Set MLS_PROVIDER=bridge in Railway env
//   2. Set BRIDGE_SERVER_TOKEN
//   3. Set BRIDGE_DATASET (e.g., "test", or the production dataset name WFRMLS assigns)
//   4. Verify field mapping in fromBridgeProperty() matches the data dictionary
// =============================================================
import type {
  Listing,
  ListingSearchFilters,
  ListingSearchOptions,
  ListingSearchResult,
  MLSProvider,
} from "../types";

const BASE_URL = "https://api.bridgedataoutput.com/api/v2";
const TOKEN = process.env.BRIDGE_SERVER_TOKEN;
const DATASET = process.env.BRIDGE_DATASET ?? "test";

interface BridgeProperty {
  ListingKey: string;
  ListingId: string;
  StandardStatus: string;
  PropertyType: string;
  PropertySubType?: string;
  PublicRemarks?: string;
  ListPrice: number;
  OriginalListPrice?: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea: number;
  LotSizeSquareFeet?: number;
  LotSizeAcres?: number;
  YearBuilt?: number;
  GarageSpaces?: number;
  StoriesTotal?: number;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  CountyOrParish?: string;
  SubdivisionName?: string;
  Latitude?: number;
  Longitude?: number;
  TaxAnnualAmount?: number;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;
  ElementarySchool?: string;
  MiddleOrJuniorSchool?: string;
  HighSchool?: string;
  SchoolDistrict?: string;
  ListAgentFullName?: string;
  ListAgentEmail?: string;
  ListAgentDirectPhone?: string;
  ListAgentMlsId?: string;
  ListOfficeName?: string;
  ListOfficePhone?: string;
  ListOfficeMlsId?: string;
  Media?: Array<{ MediaURL: string; Order: number; PreferredPhotoYN?: boolean; LongDescription?: string }>;
  VideosCount?: number;
  VirtualTourURLUnbranded?: string;
  ModificationTimestamp: string;
  OnMarketDate?: string;
  ListingContractDate?: string;
  CloseDate?: string;
}

function fromBridgeProperty(p: BridgeProperty): Listing {
  return {
    listingKey: p.ListingKey,
    mlsNumber: p.ListingId,
    status: p.StandardStatus as Listing["status"],
    propertyType: p.PropertyType as Listing["propertyType"],
    propertySubType: p.PropertySubType as Listing["propertySubType"],
    publicRemarks: p.PublicRemarks ?? "",
    location: {
      street: [p.StreetNumber, p.StreetName, p.StreetSuffix].filter(Boolean).join(" "),
      unit: p.UnitNumber,
      city: p.City,
      state: p.StateOrProvince,
      postalCode: p.PostalCode,
      county: p.CountyOrParish,
      subdivision: p.SubdivisionName,
      latitude: p.Latitude,
      longitude: p.Longitude,
    },
    financial: {
      listPrice: p.ListPrice,
      originalListPrice: p.OriginalListPrice,
      pricePerSqft: p.LivingArea > 0 ? Math.round(p.ListPrice / p.LivingArea) : undefined,
      taxAnnualAmount: p.TaxAnnualAmount,
      hoaFee: p.AssociationFee,
      hoaFrequency: p.AssociationFeeFrequency as Listing["financial"]["hoaFrequency"],
    },
    features: {
      bedrooms: p.BedroomsTotal,
      bathroomsTotal: p.BathroomsTotalInteger,
      bathroomsFull: p.BathroomsFull,
      bathroomsHalf: p.BathroomsHalf,
      livingArea: p.LivingArea,
      lotSizeSqft: p.LotSizeSquareFeet,
      lotSizeAcres: p.LotSizeAcres,
      yearBuilt: p.YearBuilt,
      garageSpaces: p.GarageSpaces,
      stories: p.StoriesTotal,
    },
    schools: {
      elementarySchool: p.ElementarySchool,
      middleSchool: p.MiddleOrJuniorSchool,
      highSchool: p.HighSchool,
      schoolDistrict: p.SchoolDistrict,
    },
    photos: (p.Media ?? [])
      .sort((a, b) => a.Order - b.Order)
      .map((m) => ({
        url: m.MediaURL,
        caption: m.LongDescription,
        order: m.Order,
        isPrimary: m.PreferredPhotoYN,
      })),
    virtualTourUrl: p.VirtualTourURLUnbranded,
    listAgent: {
      fullName: p.ListAgentFullName ?? "",
      email: p.ListAgentEmail,
      phone: p.ListAgentDirectPhone,
      mlsAgentId: p.ListAgentMlsId,
    },
    listOffice: {
      name: p.ListOfficeName ?? "",
      phone: p.ListOfficePhone,
      mlsOfficeId: p.ListOfficeMlsId,
    },
    listingContractDate: p.ListingContractDate,
    onMarketDate: p.OnMarketDate,
    closeDate: p.CloseDate,
    modificationTimestamp: p.ModificationTimestamp,
    isPremierListing: p.ListOfficeMlsId === "PUR001", // adjust to Premier's real office MLS ID
  };
}

function buildODataQuery(filters: ListingSearchFilters = {}, options: ListingSearchOptions = {}): string {
  const conditions: string[] = [];

  if (filters.minPrice) conditions.push(`ListPrice ge ${filters.minPrice}`);
  if (filters.maxPrice) conditions.push(`ListPrice le ${filters.maxPrice}`);
  if (filters.minBedrooms) conditions.push(`BedroomsTotal ge ${filters.minBedrooms}`);
  if (filters.minBathrooms) conditions.push(`BathroomsTotalInteger ge ${filters.minBathrooms}`);
  if (filters.minLivingArea) conditions.push(`LivingArea ge ${filters.minLivingArea}`);
  if (filters.maxLivingArea) conditions.push(`LivingArea le ${filters.maxLivingArea}`);
  if (filters.minYearBuilt) conditions.push(`YearBuilt ge ${filters.minYearBuilt}`);

  if (filters.city) {
    const cities = Array.isArray(filters.city) ? filters.city : [filters.city];
    conditions.push(`(${cities.map((c) => `City eq '${c}'`).join(" or ")})`);
  }
  if (filters.county) conditions.push(`CountyOrParish eq '${filters.county}'`);
  if (filters.postalCode) conditions.push(`PostalCode eq '${filters.postalCode}'`);
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    conditions.push(`(${statuses.map((s) => `StandardStatus eq '${s}'`).join(" or ")})`);
  }
  if (filters.propertyType) {
    const types = Array.isArray(filters.propertyType) ? filters.propertyType : [filters.propertyType];
    conditions.push(`(${types.map((t) => `PropertyType eq '${t}'`).join(" or ")})`);
  }

  const params = new URLSearchParams({
    access_token: TOKEN ?? "",
    $top: String(options.limit ?? 24),
    $skip: String(options.offset ?? 0),
    $count: "true",
  });

  if (conditions.length > 0) params.set("$filter", conditions.join(" and "));

  const orderMap: Record<string, string> = {
    ListPrice: "ListPrice asc",
    ListPriceDesc: "ListPrice desc",
    ModificationTimestamp: "ModificationTimestamp desc",
    OnMarketDate: "OnMarketDate desc",
    BedroomsTotal: "BedroomsTotal desc",
  };
  params.set("$orderby", orderMap[options.orderBy ?? "ModificationTimestamp"] ?? "ModificationTimestamp desc");

  return params.toString();
}

async function fetchBridge<T>(path: string): Promise<T> {
  if (!TOKEN) {
    throw new Error(
      "BRIDGE_SERVER_TOKEN is not set. Configure it in .env.local (dev) or Railway Variables (prod).",
    );
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: 300 }, // 5-min ISR cache, MLS-friendly
  });
  if (!res.ok) {
    throw new Error(`Bridge API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const bridgeProvider: MLSProvider = {
  name: "bridge",

  async getListing(listingKey) {
    const data = await fetchBridge<{ bundle?: BridgeProperty }>(
      `/OData/${DATASET}/Property('${encodeURIComponent(listingKey)}')?access_token=${TOKEN}`,
    );
    return data.bundle ? fromBridgeProperty(data.bundle) : null;
  },

  async searchListings(filters, options) {
    const q = buildODataQuery(filters, options);
    const data = await fetchBridge<{ value: BridgeProperty[]; "@odata.count"?: number }>(
      `/OData/${DATASET}/Property?${q}`,
    );
    return {
      listings: (data.value ?? []).map(fromBridgeProperty),
      total: data["@odata.count"] ?? data.value?.length ?? 0,
      limit: options?.limit ?? 24,
      offset: options?.offset ?? 0,
    };
  },

  async getFeaturedListings(limit = 6) {
    const result = await this.searchListings(
      { status: "Active" },
      { limit, orderBy: "ModificationTimestamp" },
    );
    return result.listings;
  },
};

// =============================================================
// MLS / IDX Listing Types
// Built around the RESO Data Dictionary so we map cleanly to
// Bridge Interactive, Trestle, Spark, or a direct WFRMLS feed.
// =============================================================

export type ListingStatus =
  | "Active"
  | "ActiveUnderContract"
  | "Pending"
  | "Closed"
  | "ComingSoon"
  | "Withdrawn"
  | "Expired"
  | "Canceled";

export type PropertyType =
  | "Residential"
  | "ResidentialIncome"
  | "Land"
  | "Commercial"
  | "BusinessOpportunity"
  | "Farm"
  | "ManufacturedInPark";

export type PropertySubType =
  | "SingleFamilyResidence"
  | "Townhouse"
  | "Condominium"
  | "Apartment"
  | "ManufacturedHome"
  | "Cabin"
  | "Duplex"
  | "Triplex"
  | "Quadruplex"
  | "MultiFamily"
  | "Land"
  | "Office"
  | "Retail"
  | "Industrial"
  | "MixedUse"
  | "Warehouse";

export interface ListingPhoto {
  url: string;
  caption?: string;
  order: number;
  isPrimary?: boolean;
}

export interface ListingAgent {
  fullName: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  mlsAgentId?: string;
}

export interface ListingOffice {
  name: string;
  phone?: string;
  mlsOfficeId?: string;
}

export interface ListingLocation {
  street: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  county?: string;
  subdivision?: string;
  latitude?: number;
  longitude?: number;
}

export interface ListingFinancial {
  listPrice: number;
  originalListPrice?: number;
  pricePerSqft?: number;
  taxAnnualAmount?: number;
  hoaFee?: number;
  hoaFrequency?: "Monthly" | "Quarterly" | "Annually";
}

export interface ListingFeatures {
  bedrooms: number;
  bathroomsTotal: number;
  bathroomsFull?: number;
  bathroomsHalf?: number;
  livingArea: number; // sqft
  lotSizeSqft?: number;
  lotSizeAcres?: number;
  yearBuilt?: number;
  garageSpaces?: number;
  stories?: number;
  pool?: boolean;
  fireplace?: boolean;
  hasView?: boolean;
  viewType?: string[]; // ["Mountain", "Lake", "Valley"]
  appliances?: string[];
  heating?: string[];
  cooling?: string[];
  flooring?: string[];
}

export interface ListingSchool {
  elementarySchool?: string;
  middleSchool?: string;
  highSchool?: string;
  schoolDistrict?: string;
}

export interface Listing {
  // RESO core
  listingKey: string; // unique MLS ID
  mlsNumber: string; // display MLS number
  status: ListingStatus;
  propertyType: PropertyType;
  propertySubType?: PropertySubType;

  // Display
  publicRemarks: string;
  marketingRemarks?: string;

  // Hierarchical attributes
  location: ListingLocation;
  financial: ListingFinancial;
  features: ListingFeatures;
  schools?: ListingSchool;

  // Media
  photos: ListingPhoto[];
  videoUrl?: string;
  virtualTourUrl?: string;
  threeDimensionalUrl?: string;

  // Representation
  listAgent: ListingAgent;
  listOffice: ListingOffice;
  coListAgent?: ListingAgent;

  // Dates
  listingContractDate?: string; // ISO
  onMarketDate?: string;
  closeDate?: string;
  modificationTimestamp: string;

  // Custom flags we'll set in the app
  isPremierListing?: boolean; // listed by a Premier agent
  isUpDwellNewBuild?: boolean; // UpDwell Highland Community
  hasVideoTour?: boolean;
  hasOpenHouse?: boolean;
  nextOpenHouse?: { start: string; end: string };
}

// =============================================================
// Search / query types
// =============================================================

export interface ListingSearchFilters {
  city?: string | string[];
  county?: string;
  postalCode?: string;
  status?: ListingStatus | ListingStatus[];
  propertyType?: PropertyType | PropertyType[];
  propertySubType?: PropertySubType | PropertySubType[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minLivingArea?: number;
  maxLivingArea?: number;
  minLotAcres?: number;
  minYearBuilt?: number;
  features?: string[]; // lifestyle filters: "acreage", "lake-view", "new-build", "equestrian"
  isUpDwellNewBuild?: boolean;
  isPremierListing?: boolean;
  hasOpenHouse?: boolean;
  hasVideoTour?: boolean;
}

export interface ListingSearchOptions {
  limit?: number;
  offset?: number;
  orderBy?:
    | "ListPrice"
    | "ListPriceDesc"
    | "ModificationTimestamp"
    | "OnMarketDate"
    | "BedroomsTotal";
}

export interface ListingSearchResult {
  listings: Listing[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================
// Provider interface — every MLS adapter implements this
// =============================================================

export interface MLSProvider {
  readonly name: string;
  /** Fetch a single listing by its RESO ListingKey. */
  getListing(listingKey: string): Promise<Listing | null>;
  /** Run a filtered search and return paginated results. */
  searchListings(
    filters?: ListingSearchFilters,
    options?: ListingSearchOptions,
  ): Promise<ListingSearchResult>;
  /** Get the most recent N listings — typically used on the homepage. */
  getFeaturedListings(limit?: number): Promise<Listing[]>;
}

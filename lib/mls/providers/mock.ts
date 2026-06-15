// =============================================================
// Mock MLS provider — uses local seed data so the site renders
// fully before real Bridge / Trestle credentials are wired in.
// =============================================================
import type {
  Listing,
  ListingSearchFilters,
  ListingSearchOptions,
  ListingSearchResult,
  MLSProvider,
} from "../types";
import { MOCK_LISTINGS } from "../mock-data";

function applyFilters(listings: Listing[], filters: ListingSearchFilters = {}): Listing[] {
  return listings.filter((l) => {
    if (filters.minPrice && l.financial.listPrice < filters.minPrice) return false;
    if (filters.maxPrice && l.financial.listPrice > filters.maxPrice) return false;
    if (filters.minBedrooms && l.features.bedrooms < filters.minBedrooms) return false;
    if (filters.minBathrooms && l.features.bathroomsTotal < filters.minBathrooms) return false;
    if (filters.minLivingArea && l.features.livingArea < filters.minLivingArea) return false;
    if (filters.minLotAcres && (l.features.lotSizeAcres ?? 0) < filters.minLotAcres) return false;
    if (filters.minYearBuilt && (l.features.yearBuilt ?? 0) < filters.minYearBuilt) return false;
    if (filters.isUpDwellNewBuild && !l.isUpDwellNewBuild) return false;
    if (filters.hasOpenHouse && !l.hasOpenHouse) return false;
    if (filters.hasVideoTour && !l.hasVideoTour) return false;

    if (filters.city) {
      const cities = Array.isArray(filters.city) ? filters.city : [filters.city];
      if (!cities.includes(l.location.city)) return false;
    }
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      if (!statuses.includes(l.status)) return false;
    }
    if (filters.propertyType) {
      const types = Array.isArray(filters.propertyType) ? filters.propertyType : [filters.propertyType];
      if (!types.includes(l.propertyType)) return false;
    }
    return true;
  });
}

function applyOrder(listings: Listing[], order: ListingSearchOptions["orderBy"]): Listing[] {
  const sorted = [...listings];
  switch (order) {
    case "ListPrice":
      sorted.sort((a, b) => a.financial.listPrice - b.financial.listPrice);
      break;
    case "ListPriceDesc":
      sorted.sort((a, b) => b.financial.listPrice - a.financial.listPrice);
      break;
    case "BedroomsTotal":
      sorted.sort((a, b) => b.features.bedrooms - a.features.bedrooms);
      break;
    case "OnMarketDate":
      sorted.sort((a, b) => (b.onMarketDate ?? "").localeCompare(a.onMarketDate ?? ""));
      break;
    case "ModificationTimestamp":
    default:
      sorted.sort((a, b) => b.modificationTimestamp.localeCompare(a.modificationTimestamp));
  }
  return sorted;
}

export const mockProvider: MLSProvider = {
  name: "mock",

  async getListing(listingKey) {
    return MOCK_LISTINGS.find((l) => l.listingKey === listingKey) ?? null;
  },

  async searchListings(filters = {}, options = {}) {
    const filtered = applyFilters(MOCK_LISTINGS, filters);
    const sorted = applyOrder(filtered, options.orderBy ?? "ModificationTimestamp");
    const limit = options.limit ?? 24;
    const offset = options.offset ?? 0;
    return {
      listings: sorted.slice(offset, offset + limit),
      total: sorted.length,
      limit,
      offset,
    } satisfies ListingSearchResult;
  },

  async getFeaturedListings(limit = 6) {
    const sorted = applyOrder(MOCK_LISTINGS, "ModificationTimestamp");
    return sorted.slice(0, limit);
  },
};

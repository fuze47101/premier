// =============================================================
// MLS client — picks the right provider based on env config.
// Default: mock data so the site works without credentials.
// Set MLS_PROVIDER=bridge in Railway when credentials arrive.
// =============================================================
import type { MLSProvider } from "./types";
import { mockProvider } from "./providers/mock";
import { bridgeProvider } from "./providers/bridge";
import { idxBrokerProvider } from "./providers/idxbroker";

type ProviderName = "mock" | "idxbroker" | "bridge" | "trestle" | "spark";

function selectProvider(): MLSProvider {
  const requested = (process.env.MLS_PROVIDER ?? "mock").toLowerCase() as ProviderName;
  switch (requested) {
    case "idxbroker":
      return idxBrokerProvider;
    case "bridge":
      return bridgeProvider;
    // case "trestle":  return trestleProvider; // TODO when credentials arrive
    // case "spark":    return sparkProvider;   // TODO when credentials arrive
    case "mock":
    default:
      return mockProvider;
  }
}

export const mls: MLSProvider = selectProvider();

// Re-export for convenience
export type {
  Listing,
  ListingPhoto,
  ListingSearchFilters,
  ListingSearchOptions,
  ListingSearchResult,
  ListingStatus,
  PropertyType,
  PropertySubType,
} from "./types";

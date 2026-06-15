// =============================================================
// MLS client — picks the right provider based on env config.
// Resolution is LAZY (per-request) so Railway env vars added
// after first build still take effect on the next request.
// Default: mock data so the site renders without credentials.
// =============================================================
import type {
  MLSProvider,
  ListingSearchFilters,
  ListingSearchOptions,
} from "./types";
import { mockProvider } from "./providers/mock";
import { bridgeProvider } from "./providers/bridge";
import { idxBrokerProvider } from "./providers/idxbroker";
import { FALLBACK_MLS_CONFIG } from "./fallback-config";

type ProviderName = "mock" | "idxbroker" | "bridge" | "trestle" | "spark";

let _loggedOnce = false;

// Strip surrounding quotes — defends against env vars like MLS_PROVIDER="idxbroker"
// where some hosts include the quotes literally in the value.
function cleanEnv(v: string | undefined): string {
  if (!v) return "";
  return v.trim().replace(/^['"]+|['"]+$/g, "");
}

function resolveProvider(): MLSProvider {
  // Prefer env var. Fall back to the in-repo config so the site works even when
  // Railway hasn't injected variables into the runtime container.
  const rawEnv = cleanEnv(process.env.MLS_PROVIDER);
  const raw = rawEnv || FALLBACK_MLS_CONFIG.provider;
  const requested = raw.toLowerCase() as ProviderName;

  if (!_loggedOnce) {
    console.info(
      `[MLS] provider="${requested}" (raw env="${process.env.MLS_PROVIDER ?? "<unset>"}", ` +
        `idx_key=${process.env.IDX_BROKER_ACCESS_KEY ? "present" : "MISSING"}, ` +
        `idx_account=${process.env.IDX_BROKER_ACCOUNT_ID ?? "<unset>"})`,
    );
    _loggedOnce = true;
  }

  switch (requested) {
    case "idxbroker":
      return idxBrokerProvider;
    case "bridge":
      return bridgeProvider;
    // case "trestle":  return trestleProvider;
    // case "spark":    return sparkProvider;
    case "mock":
    default:
      return mockProvider;
  }
}

// Lazy proxy — every call reads the current env (runtime not build-time)
export const mls: MLSProvider = {
  get name() {
    return resolveProvider().name;
  },
  async getListing(listingKey: string) {
    return resolveProvider().getListing(listingKey);
  },
  async searchListings(filters?: ListingSearchFilters, options?: ListingSearchOptions) {
    return resolveProvider().searchListings(filters, options);
  },
  async getFeaturedListings(limit?: number) {
    return resolveProvider().getFeaturedListings(limit);
  },
};

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

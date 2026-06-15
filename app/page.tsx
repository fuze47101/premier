// Homepage — Server Component
// Fetches featured listings from the IDX Broker feed at request time
// (or from the mock provider when MLS_PROVIDER=mock / unset).
// Cached for 5 minutes via the underlying provider's revalidate option.

import HomePageClient from "./_components/HomePageClient";
import { mls } from "@/lib/mls/client";

// Force runtime rendering so Railway env vars (MLS_PROVIDER, IDX_BROKER_*) are
// always read at request time, not baked in at build. Listing data is cached
// for 5 minutes by the underlying fetch (revalidate: 300 in the provider).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Pull featured + a count of active in parallel so the hero + market widget can show live numbers
  const [featuredListings, allActive] = await Promise.all([
    mls.getFeaturedListings(6).catch((err) => {
      console.error("Homepage: featured fetch failed:", err);
      return [];
    }),
    mls.searchListings({ status: "Active" }, { limit: 250 }).catch(() => ({ listings: [], total: 0, limit: 0, offset: 0 })),
  ]);

  return (
    <HomePageClient
      featuredListings={featuredListings}
      activeListingsCount={allActive.total || allActive.listings.length}
    />
  );
}

// =============================================================
// Listing display formatters — keep the same look-and-feel
// across the homepage, listing detail, and search pages.
// =============================================================
import type { Listing } from "./types";

export function formatPrice(price: number, withCurrency = true): string {
  const formatted = new Intl.NumberFormat("en-US").format(price);
  return withCurrency ? `$${formatted}` : formatted;
}

export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

export function formatSqft(sqft: number): string {
  return new Intl.NumberFormat("en-US").format(sqft);
}

export function formatAddress(l: Listing, mode: "full" | "short" = "short"): string {
  const { street, city, state, postalCode } = l.location;
  if (mode === "full") return `${street}, ${city}, ${state} ${postalCode}`;
  return `${street}, ${city}`;
}

export function getPrimaryPhoto(l: Listing): string {
  const primary = l.photos.find((p) => p.isPrimary) ?? l.photos[0];
  return (
    primary?.url ??
    `https://placehold.co/800x600/0F1B2D/C9A776?text=${encodeURIComponent(l.location.city)}`
  );
}

export function getListingBadge(l: Listing): { label: string; tone: "default" | "sand" | "alert" } {
  if (l.isUpDwellNewBuild) return { label: "New Build", tone: "sand" };
  if (l.hasOpenHouse) return { label: "Open House", tone: "default" };
  if (l.financial.originalListPrice && l.financial.originalListPrice > l.financial.listPrice) {
    return { label: "Price Drop", tone: "alert" };
  }
  if (l.propertyType === "Commercial") return { label: "Commercial", tone: "default" };
  if ((l.features.lotSizeAcres ?? 0) >= 1) return { label: "Acreage", tone: "default" };
  // Default: "Just Listed" if on market within 14 days
  if (l.onMarketDate) {
    const days = (Date.now() - new Date(l.onMarketDate).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 14) return { label: "Just Listed", tone: "default" };
  }
  return { label: l.status, tone: "default" };
}

export function getListingSlug(l: Listing): string {
  const slug = `${l.location.street}-${l.location.city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${l.listingKey}/${slug}`;
}

export function listingUrl(l: Listing): string {
  return `/listing/${getListingSlug(l)}`;
}

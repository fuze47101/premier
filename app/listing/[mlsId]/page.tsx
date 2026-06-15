// Listing Detail page — /listing/[mlsId]/[optional-slug]
// Server Component — SEO-friendly, structured data emitted as JSON-LD.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mls } from "@/lib/mls/client";
import {
  formatPrice,
  formatSqft,
  formatAddress,
  getPrimaryPhoto,
} from "@/lib/mls/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ mlsId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mlsId } = await params;
  const listing = await mls.getListing(mlsId);
  if (!listing) return { title: "Listing not found · Premier Utah Real Estate" };
  return {
    title: `${formatAddress(listing)} · ${formatPrice(listing.financial.listPrice)} · Premier`,
    description: listing.publicRemarks?.slice(0, 160),
    openGraph: {
      title: `${formatAddress(listing)} · ${formatPrice(listing.financial.listPrice)}`,
      description: listing.publicRemarks?.slice(0, 200),
      images: [getPrimaryPhoto(listing)],
      type: "website",
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { mlsId } = await params;
  const listing = await mls.getListing(mlsId);
  if (!listing) notFound();

  const photos = listing.photos.length > 0 ? listing.photos : [{ url: getPrimaryPhoto(listing), order: 0, isPrimary: true }];
  const heroPhoto = photos[0];
  const gridPhotos = photos.slice(1, 5);

  return (
    <>
      <header style={{ position: "relative", padding: "24px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <nav className="nav" style={{ color: "var(--ink)" }}>
            <a href="/" aria-label="Premier Utah Real Estate home">
              <img src="/premier-logo.png" alt="Premier Utah Real Estate" className="logo-img" style={{ filter: "none" }} />
            </a>
            <ul style={{ color: "var(--ink)" }}>
              <li><a href="/#search">Search</a></li>
              <li><a href="/#lifecycle">Lifecycle</a></li>
              <li><a href="/#new-construction">New Construction</a></li>
              <li><a href="/#neighborhoods">Communities</a></li>
              <li><a href="/#agents">Team</a></li>
              <li><a href="/#contact">Contact</a></li>
            </ul>
            <div className="nav-right" style={{ color: "var(--ink)" }}>
              <span className="nav-phone">435-249-7172</span>
              <button className="btn btn-ghost">Save</button>
            </div>
          </nav>
        </div>
      </header>

      <section style={{ padding: "40px 0 0", background: "var(--bone)" }}>
        <div className="container">
          <div style={{ fontSize: ".85rem", color: "var(--muted)", marginBottom: 20 }}>
            <a href="/" style={{ color: "var(--muted)" }}>Home</a> · <a href="/search" style={{ color: "var(--muted)" }}>Search</a> · {listing.location.city}
          </div>

          {/* Photo gallery */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, height: 520, borderRadius: 6, overflow: "hidden", marginBottom: 40 }}>
            <div style={{
              gridRow: "1 / 3", gridColumn: "1",
              backgroundImage: `url(${heroPhoto.url})`,
              backgroundSize: "cover", backgroundPosition: "center",
            }} />
            {gridPhotos.map((p, i) => (
              <div key={i} style={{
                backgroundImage: `url(${p.url})`, backgroundSize: "cover", backgroundPosition: "center",
              }} />
            ))}
            {gridPhotos.length < 4 && Array.from({ length: 4 - gridPhotos.length }).map((_, i) => (
              <div key={`fill-${i}`} style={{ background: "var(--bone-2)" }} />
            ))}
          </div>

          {/* Two-column body */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 48, paddingBottom: 80 }}>
            <div>
              <div className="eyebrow">{listing.status} · MLS {listing.mlsNumber}</div>
              <h1 style={{ fontSize: "3rem", color: "var(--navy)", marginBottom: 12 }}>
                {formatPrice(listing.financial.listPrice)}
              </h1>
              <div style={{ fontSize: "1.2rem", color: "var(--ink)", marginBottom: 32 }}>
                {formatAddress(listing, "full")}
              </div>

              <div style={{ display: "flex", gap: 40, padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 32 }}>
                {listing.features.bedrooms > 0 && (
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--navy)", fontWeight: 600 }}>{listing.features.bedrooms}</div>
                    <div style={{ fontSize: ".78rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>Beds</div>
                  </div>
                )}
                {listing.features.bathroomsTotal > 0 && (
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--navy)", fontWeight: 600 }}>{listing.features.bathroomsTotal}</div>
                    <div style={{ fontSize: ".78rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>Baths</div>
                  </div>
                )}
                {listing.features.livingArea > 0 && (
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--navy)", fontWeight: 600 }}>{formatSqft(listing.features.livingArea)}</div>
                    <div style={{ fontSize: ".78rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>Sq Ft</div>
                  </div>
                )}
                {listing.features.lotSizeAcres && (
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--navy)", fontWeight: 600 }}>{listing.features.lotSizeAcres}</div>
                    <div style={{ fontSize: ".78rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>Acres</div>
                  </div>
                )}
                {listing.features.yearBuilt && (
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--navy)", fontWeight: 600 }}>{listing.features.yearBuilt}</div>
                    <div style={{ fontSize: ".78rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>Built</div>
                  </div>
                )}
              </div>

              <h3 style={{ color: "var(--navy)", marginBottom: 16 }}>About this property</h3>
              <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--ink)", marginBottom: 40, whiteSpace: "pre-line" }}>
                {listing.publicRemarks || "Listing details coming soon."}
              </p>

              {listing.schools && (listing.schools.elementarySchool || listing.schools.highSchool) && (
                <>
                  <h3 style={{ color: "var(--navy)", marginBottom: 16 }}>Schools</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
                    {listing.schools.elementarySchool && (
                      <div><strong style={{ display: "block", fontSize: ".85rem", color: "var(--muted)" }}>Elementary</strong>{listing.schools.elementarySchool}</div>
                    )}
                    {listing.schools.middleSchool && (
                      <div><strong style={{ display: "block", fontSize: ".85rem", color: "var(--muted)" }}>Middle</strong>{listing.schools.middleSchool}</div>
                    )}
                    {listing.schools.highSchool && (
                      <div><strong style={{ display: "block", fontSize: ".85rem", color: "var(--muted)" }}>High School</strong>{listing.schools.highSchool}</div>
                    )}
                    {listing.schools.schoolDistrict && (
                      <div><strong style={{ display: "block", fontSize: ".85rem", color: "var(--muted)" }}>District</strong>{listing.schools.schoolDistrict}</div>
                    )}
                  </div>
                </>
              )}

              <h3 style={{ color: "var(--navy)", marginBottom: 16 }}>Property facts</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 32px", fontSize: ".95rem", marginBottom: 40 }}>
                <div><strong style={{ color: "var(--muted)" }}>Property type:</strong> {listing.propertyType}</div>
                {listing.propertySubType && <div><strong style={{ color: "var(--muted)" }}>Sub-type:</strong> {listing.propertySubType}</div>}
                {listing.features.garageSpaces && <div><strong style={{ color: "var(--muted)" }}>Garage:</strong> {listing.features.garageSpaces} spaces</div>}
                {listing.features.stories && <div><strong style={{ color: "var(--muted)" }}>Stories:</strong> {listing.features.stories}</div>}
                {listing.location.subdivision && <div><strong style={{ color: "var(--muted)" }}>Subdivision:</strong> {listing.location.subdivision}</div>}
                {listing.location.county && <div><strong style={{ color: "var(--muted)" }}>County:</strong> {listing.location.county}</div>}
                {listing.financial.pricePerSqft && <div><strong style={{ color: "var(--muted)" }}>Price/sqft:</strong> ${listing.financial.pricePerSqft}</div>}
                {listing.financial.taxAnnualAmount && <div><strong style={{ color: "var(--muted)" }}>Annual tax:</strong> ${formatSqft(listing.financial.taxAnnualAmount)}</div>}
                {listing.financial.hoaFee && <div><strong style={{ color: "var(--muted)" }}>HOA:</strong> ${listing.financial.hoaFee}/{listing.financial.hoaFrequency?.toLowerCase()}</div>}
                <div><strong style={{ color: "var(--muted)" }}>MLS#:</strong> {listing.mlsNumber}</div>
              </div>
            </div>

            {/* Agent sidebar */}
            <div>
              <div style={{ position: "sticky", top: 100, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 6, padding: 32, boxShadow: "var(--shadow)" }}>
                <div className="eyebrow">Listing Agent</div>
                <h3 style={{ color: "var(--navy)", marginBottom: 8 }}>{listing.listAgent.fullName || "Premier Agent"}</h3>
                <div style={{ fontSize: ".9rem", color: "var(--muted)", marginBottom: 24 }}>
                  {listing.listOffice.name}
                </div>
                {listing.listAgent.phone && (
                  <a href={`tel:${listing.listAgent.phone}`} className="btn btn-primary" style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: 12, textDecoration: "none" }}>
                    Call {listing.listAgent.phone}
                  </a>
                )}
                {listing.listAgent.email && (
                  <a href={`mailto:${listing.listAgent.email}?subject=Question about ${formatAddress(listing)}`} className="btn btn-ghost" style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: 24, textDecoration: "none" }}>
                    Email agent
                  </a>
                )}
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", background: "var(--sand)", color: "var(--navy)", marginBottom: 8 }}>
                  Schedule a tour
                </button>
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
                  Save to collection
                </button>

                <div style={{ marginTop: 32, padding: "20px 0 0", borderTop: "1px solid var(--line)", fontSize: ".82rem", color: "var(--muted)" }}>
                  Listing data © {new Date().getFullYear()} {listing.listOffice.name}. Information deemed reliable but not guaranteed.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured data for SEO — Schema.org RealEstateListing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Residence",
            name: formatAddress(listing),
            description: listing.publicRemarks,
            address: {
              "@type": "PostalAddress",
              streetAddress: listing.location.street,
              addressLocality: listing.location.city,
              addressRegion: listing.location.state,
              postalCode: listing.location.postalCode,
              addressCountry: "US",
            },
            numberOfRooms: listing.features.bedrooms,
            floorSize: {
              "@type": "QuantitativeValue",
              value: listing.features.livingArea,
              unitCode: "FTK",
            },
            image: getPrimaryPhoto(listing),
            offers: {
              "@type": "Offer",
              price: listing.financial.listPrice,
              priceCurrency: "USD",
            },
          }),
        }}
      />

      <footer style={{ background: "var(--navy)", color: "rgba(255,255,255,.7)", padding: "60px 0", textAlign: "center", fontSize: ".9rem" }}>
        <div className="container">
          © 2026 Premier Utah Real Estate · 205 N Main St, Tooele UT · 435-249-7172
        </div>
      </footer>
    </>
  );
}

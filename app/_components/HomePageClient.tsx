"use client";

import { useState } from "react";
import type { Listing } from "@/lib/mls/types";
import {
  formatPrice,
  formatSqft,
  formatAddress,
  getPrimaryPhoto,
  getListingBadge,
  listingUrl,
} from "@/lib/mls/format";

const searchTabs = ["Buy", "Rent", "Build New", "Sell / Value"];
const listingFilters = ["All", "Resale", "New Build", "Land", "Commercial"];
const chipSuggestions = [
  "Acreage in Erda",
  "Stansbury lake-view",
  "New construction Grantsville",
  "Commuter to SLC under $500k",
  "Equestrian property",
];

const pillars = [
  { num: "01", title: "Residential Sales", body: "Resale homes across all nine Tooele County communities. Buyer representation, seller marketing, full-service from first showing to closing.", cta: "Explore listings" },
  { num: "02", title: "New Construction", body: "Exclusive partner for UpDwell Homes at Highland Community in Grantsville. Floor plans, lot selection, builder warranty — done in-house.", cta: "Tour Highland" },
  { num: "03", title: "Commercial", body: "Retail, office, industrial, and land. Steve Griffith leads our commercial division — 30 years of Tooele County dealmaking.", cta: "View commercial" },
  { num: "04", title: "Rentals", body: "Single-family homes, townhomes, and apartments in Tooele, Stansbury, and Grantsville. Pet-friendly options.", cta: "Find a rental" },
  { num: "05", title: "Property Management", body: "Tenant vetting, rent collection, maintenance, financial reporting, and inspections. Built for owners who want passive income, not phone calls.", cta: "Owner services" },
  { num: "06", title: "Land & Development", body: "Acreage, subdivision lots, and undeveloped parcels across Tooele County and the West Desert. Investment and homestead opportunities.", cta: "See land" },
];

const stages = [
  { num: 1, letter: "R", title: "Rent", body: "Your first Tooele apartment or starter home through Premier-managed rentals." },
  { num: 2, letter: "B", title: "Buy", body: "Step up to ownership with the team that already knows your neighborhood." },
  { num: 3, letter: "B", title: "Build", body: "Move up to new construction at Highland — our exclusive UpDwell community." },
  { num: 4, letter: "I", title: "Invest", body: "Buy your second property as a rental. Resale or build — we'll find the right one." },
  { num: 5, letter: "M", title: "Manage", body: "Tenant placement, maintenance, financials — our PM team runs your portfolio." },
];

const agents = [
  { name: "Tammy Griffith", role: "Associate Broker", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80" },
  { name: "Steve Griffith", role: "Broker · Commercial", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80" },
  { name: "Ariana Connors", role: "Realtor", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80" },
  { name: "Andy Stetz", role: "Realtor", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80" },
];

const neighborhoods = [
  { name: "Stansbury Park", sub: "Population 8,800 · Median $612K", img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80", big: true, body: "Lakeside living with golf, marinas, and the fastest-growing master-planned community in the county." },
  { name: "Tooele", sub: "Median $478K", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80" },
  { name: "Grantsville", sub: "Median $539K", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80" },
  { name: "Erda", sub: "Acreage country", img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80" },
  { name: "Lake Point", sub: "Commuter hub", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80" },
  { name: "Stockton", sub: "Historic mountain town", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80" },
  { name: "Rush Valley · Vernon", sub: "Rural retreat", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80" },
];

const testimonials = [
  { initials: "JM", quote: "Tammy sold us our first house in 2018, helped us buy a Highland new build in 2024, and now Premier manages our old place as a rental. Same team, every step.", name: "Jared & Mara C.", meta: "Stansbury Park · Three transactions" },
  { initials: "DR", quote: "I commute to SLC daily. Ariana knew exactly which Tooele neighborhoods would give me 35-minute mornings versus 50-minute mornings. That kind of local detail you don't get from Zillow.", name: "Daniel R.", meta: "Lake Point · Buyer 2026" },
  { initials: "LP", quote: "Steve handled our commercial lease at the Tooele Plaza building like a chess master. Closing happened two weeks faster than my attorney thought possible.", name: "Linda P.", meta: "Commercial tenant · Downtown Tooele" },
];

const chartData = [62, 58, 65, 70, 68, 75, 82, 78, 85, 88, 84, 95];
const chartLabels = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

interface HomePageClientProps {
  featuredListings: Listing[];
  activeListingsCount?: number;
}

export default function HomePageClient({ featuredListings, activeListingsCount }: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState("Buy");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchValue, setSearchValue] = useState("");

  const filteredListings = featuredListings.filter((l) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Resale") return l.propertyType === "Residential" && !l.isUpDwellNewBuild;
    if (activeFilter === "New Build") return l.isUpDwellNewBuild || (l.features.yearBuilt ?? 0) >= 2025;
    if (activeFilter === "Land") return l.propertyType === "Land";
    if (activeFilter === "Commercial") return l.propertyType === "Commercial";
    return true;
  });

  const tone = (t: string) => (t === "sand" ? { background: "rgba(201,167,118,.95)", color: "var(--navy)" } : undefined);

  return (
    <>
      <header>
        <div className="container">
          <nav className="nav">
            <a href="/" aria-label="Premier Utah Real Estate home">
              <img src="/premier-logo.png" alt="Premier Utah Real Estate" className="logo-img" />
            </a>
            <ul>
              <li><a href="#search">Search</a></li>
              <li><a href="#lifecycle">Lifecycle</a></li>
              <li><a href="#new-construction">New Construction</a></li>
              <li><a href="#neighborhoods">Communities</a></li>
              <li><a href="#agents">Team</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
            <div className="nav-right">
              <span className="nav-phone">435-249-7172</span>
              <button className="btn btn-light">Sign In</button>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero" id="search">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="eyebrow" style={{ color: "var(--sand)" }}>From First Lease to Legacy</div>
              <h1>The only Tooele team for <em>every stage</em> of homeownership.</h1>
              <p className="hero-sub">
                Rent your first place. Buy your forever home. Build new with our exclusive UpDwell partnership.
                Invest in income property — and let us manage it. One trusted team. Thirty years in Tooele County.
              </p>

              <div className="search-card">
                <div className="search-tabs">
                  {searchTabs.map((tab) => (
                    <button
                      key={tab}
                      className={tab === activeTab ? "active" : ""}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="search-prompt">
                  <input
                    type="text"
                    placeholder='Ask anything — "4-bed under $600k near good Tooele schools"'
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <button>Search</button>
                </div>
                <div className="search-suggestions">
                  {chipSuggestions.map((chip) => (
                    <span key={chip} className="chip" onClick={() => setSearchValue(chip)}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hero-stats">
                <div><div className="num">30+</div><div className="lbl">Years in Tooele</div></div>
                <div><div className="num">15</div><div className="lbl">Agents on team</div></div>
                <div><div className="num">$2.4B</div><div className="lbl">Lifetime volume</div></div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-card hc-1">
                {featuredListings[0] && (
                  <div className="hc-tag">
                    <strong>{featuredListings[0].location.street}</strong>
                    {featuredListings[0].location.city} · {formatPrice(featuredListings[0].financial.listPrice)}
                  </div>
                )}
              </div>
              <div className="hero-card hc-2">
                {featuredListings[1] && (
                  <div className="hc-tag">
                    <strong>{featuredListings[1].location.city}</strong>
                    {featuredListings[1].isUpDwellNewBuild ? "New build · " : ""}From {formatPrice(featuredListings[1].financial.listPrice)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lifecycle" id="lifecycle">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">The Lifecycle Account</div>
            <h2>One company. <em>Five stages.</em> A relationship that compounds.</h2>
            <p>
              Most realtors sell you a house, hand off the keys, and you never hear from them again.
              We built Premier the opposite way — every step of homeownership in Tooele County,
              under one roof, in one account.
            </p>
          </div>
          <div className="lifecycle-flow">
            {stages.map((s) => (
              <div key={s.num} className="stage">
                <div className="stage-dot">
                  <span className="stage-num">{s.num}</span>
                  {s.letter}
                </div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
          <div className="lifecycle-cta">
            <p>&ldquo;The team that started your journey is still here at the finish line.&rdquo;</p>
            <button className="btn btn-primary">Start Your Lifecycle Account</button>
          </div>
        </div>
      </section>

      <section className="pillars">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Six Pillars, One Team</div>
            <h2>Everything you need from a Tooele real estate company.</h2>
          </div>
          <div className="pillar-grid">
            {pillars.map((p) => (
              <div key={p.num} className="pillar">
                <div className="pillar-num">{p.num}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <a className="pillar-link">{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="listings">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Every Active Home in Tooele County</div>
            <h2>The full Tooele <em>MLS, live.</em></h2>
            <p>
              Every active listing across Tooele, Stansbury Park, Grantsville, Erda, and the rest
              of the county &mdash; updated continuously from the MLS. Search by neighborhood,
              price, beds, baths, or lot size.
            </p>
          </div>

          {/* Live IDX widget embed — real Tooele listings from forsale.homesintooele.com */}
          <div style={{
            marginTop: 40,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--line)",
            background: "var(--white)",
            boxShadow: "var(--shadow)",
          }}>
            <iframe
              src="https://forsale.homesintooele.com/idx/search/advanced"
              title="Search active Tooele County listings"
              style={{
                width: "100%",
                height: "1100px",
                border: 0,
                display: "block",
              }}
              loading="lazy"
            />
          </div>

          <div style={{
            textAlign: "center",
            marginTop: 40,
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            <a
              href="https://forsale.homesintooele.com/idx/search/advanced"
              target="_blank"
              rel="noopener"
              className="btn btn-primary"
              style={{ textDecoration: "none", padding: "18px 36px", fontSize: ".95rem" }}
            >
              Open Full Search &rarr;
            </a>
            <a
              href="https://forsale.homesintooele.com/idx/map/mapsearch"
              target="_blank"
              rel="noopener"
              className="btn btn-ghost"
              style={{ textDecoration: "none", padding: "18px 36px", fontSize: ".95rem" }}
            >
              Map Search
            </a>
          </div>
        </div>
      </section>

      <section className="neighborhoods" id="neighborhoods">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Tooele County Communities</div>
            <h2>From <em>Stansbury</em> to <em>Wendover.</em></h2>
            <p>
              Every Tooele town has its own character — its own price point, its own commute,
              its own reason to call it home. We&rsquo;ve sold houses in all of them for three decades.
            </p>
          </div>
          <div className="neighborhood-grid">
            {neighborhoods.map((n) => (
              <div
                key={n.name}
                className={`neighborhood${n.big ? " nh-large" : ""}`}
                style={{ backgroundImage: `url(${n.img})` }}
              >
                <div className="neighborhood-content">
                  <small>{n.sub}</small>
                  <h4>{n.name}</h4>
                  {n.body && <p style={{ color: "rgba(255,255,255,.85)", fontSize: ".95rem" }}>{n.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="market" id="new-construction">
        <div className="container">
          <div className="market-grid">
            <div>
              <div className="eyebrow" style={{ color: "var(--sand)" }}>May 2026 Tooele Market Report</div>
              <h2>The numbers <em>nobody else</em> publishes about Tooele.</h2>
              <p>
                National sites give you Salt Lake County data and call it close enough.
                We publish the Tooele-only report every month — median price, days on market,
                inventory, builder activity. Free, no email needed to view, full PDF for download.
              </p>
              <div className="market-stats">
                <div className="market-stat">
                  <div className="num">$524K</div>
                  <div className="lbl">Median Sale Price</div>
                  <div className="chg">▲ 3.2% YoY</div>
                </div>
                <div className="market-stat">
                  <div className="num">28</div>
                  <div className="lbl">Avg Days on Market</div>
                  <div className="chg down">▼ 11 days vs 2025</div>
                </div>
                <div className="market-stat">
                  <div className="num">{activeListingsCount ?? "—"}</div>
                  <div className="lbl">Active Listings</div>
                  <div className="chg">Live from MLS</div>
                </div>
                <div className="market-stat">
                  <div className="num">98.4%</div>
                  <div className="lbl">List-to-Sale Ratio</div>
                  <div className="chg">Strong seller market</div>
                </div>
              </div>
              <div className="cta-buttons" style={{ justifyContent: "flex-start" }}>
                <button className="btn btn-primary" style={{ background: "var(--sand)", color: "var(--navy)" }}>
                  Download May Report (PDF)
                </button>
                <button className="btn btn-light">Subscribe Monthly</button>
              </div>
            </div>
            <div className="market-chart">
              <div className="chart-head">
                <h4>Tooele County Median Sale Price · Last 12 Months</h4>
                <small>USD K</small>
              </div>
              <div className="chart">
                {chartData.map((h, i) => (
                  <div key={i} className="chart-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="chart-labels">
                {chartLabels.map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="agents" id="agents">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Your Team</div>
            <h2>Fifteen agents. <em>One ZIP code.</em></h2>
            <p>
              We don&rsquo;t have offices in five counties. We have one office, in Tooele,
              full of people who&rsquo;ve lived here for years and sold houses in every neighborhood
              between Lake Point and Wendover.
            </p>
          </div>
          <div className="agent-grid">
            {agents.map((a) => (
              <div key={a.name} className="agent">
                <div className="agent-photo" style={{ backgroundImage: `url(${a.photo})` }} />
                <h4>{a.name}</h4>
                <small>{a.role}</small>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <button className="btn btn-ghost">Meet the Whole Team</button>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Real Reviews · 5.0 ★ Across 247 Sales</div>
            <h2>What Tooele <em>says about us.</em></h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <div key={t.initials} className="testimonial">
                <div className="testimonial-quote">&ldquo;{t.quote}&rdquo;</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-meta">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta" id="contact">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--sand)" }}>Start Your Tooele Journey</div>
          <h2>Whatever stage you&rsquo;re in, <em>we&rsquo;ve already been there.</em></h2>
          <p>
            Open a Lifecycle Account and we&rsquo;ll match you with the right agent, set up your search,
            and stay with you for the next thirty years if you&rsquo;ll have us.
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary" style={{ background: "var(--sand)", color: "var(--navy)" }}>
              Open My Lifecycle Account
            </button>
            <button className="btn btn-light">Call 435-249-7172</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/premier-logo.png" alt="Premier Utah Real Estate" className="logo-img" />
              <p>
                The only vertically integrated real estate company in Tooele County.
                Buy, sell, build, rent, invest, manage — one team, every stage.
              </p>
              <div className="footer-contact">
                <strong>Visit us</strong>
                205 N Main St<br />
                Tooele, UT 84074<br />
                <span style={{ color: "var(--sand)" }}>435-249-7172</span>
              </div>
            </div>
            <div>
              <h5>Buy</h5>
              <ul>
                <li><a>Search Homes</a></li>
                <li><a>Conversational Search</a></li>
                <li><a>First-Time Buyers</a></li>
                <li><a>Pre-Qualification</a></li>
                <li><a>Buyer Collections</a></li>
              </ul>
            </div>
            <div>
              <h5>Sell &amp; Build</h5>
              <ul>
                <li><a>Instant Valuation</a></li>
                <li><a>Sellers Guide</a></li>
                <li><a>UpDwell Homes</a></li>
                <li><a>Highland Community</a></li>
                <li><a>Market Reports</a></li>
              </ul>
            </div>
            <div>
              <h5>Invest &amp; Manage</h5>
              <ul>
                <li><a>Rental Search</a></li>
                <li><a>Owner Services</a></li>
                <li><a>Tenant Vetting</a></li>
                <li><a>Commercial</a></li>
                <li><a>Land &amp; Development</a></li>
              </ul>
            </div>
            <div>
              <h5>Company</h5>
              <ul>
                <li><a>About Premier</a></li>
                <li><a>Our Team</a></li>
                <li><a>Blog</a></li>
                <li><a>Careers</a></li>
                <li><a>Ver En Español</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 Premier Utah Real Estate · All rights reserved</div>
            <div><a>Privacy</a> · <a>Terms</a> · <a>Accessibility</a> · <a>Anti-Discrimination</a></div>
          </div>
        </div>
      </footer>
    </>
  );
}

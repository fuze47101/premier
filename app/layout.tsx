import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Premier Utah Real Estate — From First Lease to Legacy",
  description:
    "Tooele County's only vertically integrated real estate company. Rent, buy, build, invest, and manage — every stage of homeownership, one trusted team.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://homesintooele.com"),
  openGraph: {
    title: "Premier Utah Real Estate — From First Lease to Legacy",
    description:
      "Tooele's vertically integrated real estate company. Rent · Buy · Build · Invest · Manage.",
    type: "website",
    locale: "en_US",
    siteName: "Premier Utah Real Estate",
  },
  twitter: {
    card: "summary_large_image",
    site: "@PremierUtah",
    title: "Premier Utah Real Estate",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}

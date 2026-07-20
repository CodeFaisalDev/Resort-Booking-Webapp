import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevents FOIT (Flash of Invisible Text)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#141414',
};

export const metadata: Metadata = {
  title: {
    default: "Luxury Horizon — Premium Resort Booking",
    template: "%s | Luxury Horizon",
  },
  description:
    "Discover and book world-class luxury resorts. From tropical overwater villas to alpine retreats, experience the finest hospitality at Luxury Horizon.",
  keywords: [
    "luxury resort",
    "resort booking",
    "hotel booking",
    "overwater villa",
    "tropical getaway",
    "premium hospitality",
  ],
  authors: [{ name: "Luxury Horizon" }],
  openGraph: {
    title: "Luxury Horizon — Premium Resort Booking",
    description:
      "Discover and book world-class luxury resorts with Luxury Horizon.",
    type: "website",
    locale: "en_US",
    siteName: "Luxury Horizon",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Horizon — Premium Resort Booking",
    description:
      "Discover and book world-class luxury resorts with Luxury Horizon.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        
        {/* Preconnect for critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProviderWrapper>
          <SmoothScroll />
          <Navbar />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

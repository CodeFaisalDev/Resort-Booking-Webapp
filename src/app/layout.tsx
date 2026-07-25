import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    default: "bookme.com — Premium Resort Booking",
    template: "%s | bookme.com",
  },
  description:
    "Discover and book world-class luxury resorts. From tropical overwater villas to alpine retreats, experience the finest hospitality at bookme.com.",
  keywords: [
    "luxury resort",
    "resort booking",
    "hotel booking",
    "overwater villa",
    "tropical getaway",
    "premium hospitality",
  ],
  authors: [{ name: "bookme.com" }],
  openGraph: {
    title: "bookme.com — Premium Resort Booking",
    description:
      "Discover and book world-class luxury resorts with bookme.com.",
    type: "website",
    locale: "en_US",
    siteName: "bookme.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "bookme.com — Premium Resort Booking",
    description:
      "Discover and book world-class luxury resorts with bookme.com.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect & DNS prefetch for maps and images */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body className={`${geistSans.className} min-h-full flex flex-col overflow-x-hidden`} suppressHydrationWarning>
        <SessionProviderWrapper>
          <SmoothScroll />
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

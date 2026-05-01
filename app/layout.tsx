import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Cormorant_Garamond,
  Poppins,
  Playfair_Display,
  Bebas_Neue,
  Pacifico,
  Orbitron,
  Cinzel,
} from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: ["400"] });
const pacifico = Pacifico({ variable: "--font-pacifico", subsets: ["latin"], weight: ["400"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://dinelinks.com'),
  title: {
    default: 'DineLinks — Digital QR Code Menus for Restaurants',
    template: '%s | DineLinks',
  },
  description: 'DineLinks creates beautiful QR code menus for restaurants. Customers scan to view your menu in 10 languages. No reprinting menus — update in seconds. Built for cafes, bistros, food trucks, and independent restaurants.',
  keywords: [
    'digital menu', 'QR code menu', 'QR menu', 'restaurant menu app',
    'online menu builder', 'multilingual menu', 'contactless menu',
    'restaurant menu software', 'digital restaurant menu',
    'menu management system', 'QR code menu generator',
    'restaurant menu maker', 'translated menu app',
    'menu in 10 languages', 'paperless restaurant menu',
    'cafe menu app', 'food truck menu', 'bistro menu software',
    'mobile restaurant menu', 'scan to view menu',
    'restaurant QR code', 'no reprint menu',
  ],
  authors: [{ name: 'DineLinks' }],
  creator: 'DineLinks',
  publisher: 'DineLinks',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://dinelinks.com',
    title: 'DineLinks — Digital QR Code Menus for Restaurants',
    description: 'Beautiful QR code menus in 10 languages. No reprinting. Update in seconds. Built for independent restaurants.',
    siteName: 'DineLinks',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'DineLinks — QR Code Menus for Restaurants',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DineLinks — Digital QR Code Menus for Restaurants',
    description: 'QR code menus in 10 languages. No reprinting. Update in seconds.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://dinelinks.com' },
  category: 'technology',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${poppins.variable} ${playfair.variable} ${bebasNeue.variable} ${pacifico.variable} ${orbitron.variable} ${cinzel.variable} antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

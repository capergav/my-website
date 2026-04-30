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
  title: "DineLinks — Digital Menus for Restaurants",
  description: "Beautiful digital menus for independent restaurants. Customers scan a QR code to see your menu in 10 languages. No reprinting. Update in seconds. Free 2-month trial.",
  keywords: ["digital menu", "restaurant menu", "QR code menu", "multilingual menu", "restaurant software", "menu management"],
  authors: [{ name: "DineLinks" }],
  creator: "DineLinks",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://dinelinks.com",
    title: "DineLinks — Digital Menus for Restaurants",
    description: "Beautiful digital menus for independent restaurants. Scan a QR code, see the menu in 10 languages.",
    siteName: "DineLinks",
  },
  twitter: {
    card: "summary_large_image",
    title: "DineLinks — Digital Menus for Restaurants",
    description: "QR code menus in 10 languages. No reprinting ever. Free 2-month trial.",
  },
  metadataBase: new URL("https://dinelinks.com"),
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

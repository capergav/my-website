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
import { createSupabaseClient, type Restaurant } from "./lib/supabase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: ["400"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Menu | Restaurant",
  description: "Our restaurant menu — appetizers, mains, sides, desserts & drinks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let themeStyle: string | null = null;
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID;
  if (restaurantId) {
    try {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from("restaurants")
        .select("main_color, accent_color, background_color, font_family, font_color")
        .eq("id", restaurantId)
        .maybeSingle<Restaurant>();
      if (data?.main_color && data?.accent_color) {
        const main = data.main_color.replace(/"/g, "&quot;");
        const accent = data.accent_color.replace(/"/g, "&quot;");
        const textColor =
          data.font_color != null && data.font_color !== ""
            ? data.font_color.replace(/"/g, "&quot;")
            : main;
        const bgColor =
          data.background_color != null && data.background_color !== ""
            ? data.background_color.replace(/"/g, "&quot;")
            : "#faf8f5";

        let fontVar = "";
        switch (data.font_family) {
          case "serif":
            fontVar = "--font-body:var(--font-cormorant);";
            break;
          case "mono":
            fontVar = "--font-body:var(--font-geist-mono);";
            break;
          case "poppins":
            fontVar = "--font-body:var(--font-poppins);";
            break;
          case "playfair":
            fontVar = "--font-body:var(--font-playfair);";
            break;
          case "bebas":
            fontVar = "--font-body:var(--font-bebas);";
            break;
          case "pacifico":
            fontVar = "--font-body:var(--font-pacifico);";
            break;
          case "orbitron":
            fontVar = "--font-body:var(--font-orbitron);";
            break;
          case "cinzel":
            fontVar = "--font-body:var(--font-cinzel);";
            break;
          case "sans":
          default:
            fontVar = "--font-body:var(--font-geist-sans);";
            break;
        }

        themeStyle = `:root{--foreground:${textColor};--accent:${accent};--background:${bgColor};${fontVar}} body{color:var(--foreground);font-family:var(--font-body,var(--font-geist-sans)),system-ui,sans-serif}`;
      }
    } catch {
      // ignore
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${poppins.variable} ${playfair.variable} ${bebasNeue.variable} ${pacifico.variable} ${orbitron.variable} ${cinzel.variable} antialiased`}
      >
        {themeStyle && (
          <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        )}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

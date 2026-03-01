import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
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
        .select("main_color, accent_color, font_family, font_color")
        .eq("id", restaurantId)
        .maybeSingle<Restaurant>();
      if (data?.main_color && data?.accent_color) {
        const main = data.main_color.replace(/"/g, "&quot;");
        const accent = data.accent_color.replace(/"/g, "&quot;");
        const textColor =
          data.font_color != null && data.font_color !== ""
            ? data.font_color.replace(/"/g, "&quot;")
            : main;

        let fontVar = "";
        if (data.font_family === "serif") {
          fontVar = "--font-body:var(--font-cormorant);";
        } else if (data.font_family === "mono") {
          fontVar = "--font-body:var(--font-geist-mono);";
        } else if (data.font_family === "sans") {
          fontVar = "--font-body:var(--font-geist-sans);";
        }

        themeStyle = `:root{--foreground:${textColor};--accent:${accent};${fontVar}} body{color:var(--foreground);font-family:var(--font-body,var(--font-geist-sans)),system-ui,sans-serif}`;
      }
    } catch {
      // ignore
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
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

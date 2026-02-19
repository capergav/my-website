import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import { createSupabaseClient } from "./lib/supabase";

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
  try {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from("site_settings")
      .select("main_color, accent_color")
      .limit(1)
      .maybeSingle();
    if (data?.main_color && data?.accent_color) {
      const main = data.main_color.replace(/"/g, "&quot;");
      const accent = data.accent_color.replace(/"/g, "&quot;");
      themeStyle = `:root{--foreground:${main};--accent:${accent};}`;
    }
  } catch {
    // ignore
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

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMapOwner, menuLanguages } from "@/lib/mapAccess";
import { MapView, type MapPin } from "./MapView";

export const metadata: Metadata = {
  title: "Find a menu",
  description: "Discover restaurants with multilingual DineLinks menus near you.",
  robots: { index: false, follow: false },
};

function ComingSoon() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#faf8f5]">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <p className="text-xs font-bold tracking-[0.2em] text-[#8b6914] uppercase mb-3">Coming soon</p>
        <h1 className="text-3xl font-serif font-semibold text-[#2c2a26] mb-3">Find a menu</h1>
        <p className="text-[#6b6560] leading-relaxed mb-8">
          We&apos;re building a map of restaurants with multilingual DineLinks menus, so diners
          can find places that speak their language. Check back soon.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl px-5 py-2.5 text-sm font-medium bg-[#8b6914] text-white hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

export default async function MapPage() {
  // SERVER-SIDE gate. A non-owner never gets past this — the map data and
  // markup below are only ever fetched/rendered for the founder session.
  const owner = await getMapOwner();
  if (!owner) return <ComingSoon />;

  const { data: rows } = await supabaseAdmin
    .from("restaurants")
    .select("slug, name, map_name, map_notes, latitude, longitude, allow_auto_translate, default_language")
    .eq("approved_for_map", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const pins: MapPin[] = (rows ?? [])
    .filter((r) => r.slug && typeof r.latitude === "number" && typeof r.longitude === "number")
    .map((r) => ({
      slug: r.slug as string,
      name: (r.map_name as string) || (r.name as string) || "Restaurant",
      lat: r.latitude as number,
      lng: r.longitude as number,
      notes: (r.map_notes as string) ?? null,
      languages: menuLanguages(r).map((l) => ({ flag: l.flag, label: l.label })),
    }));

  return (
    <main className="h-[100dvh] flex flex-col bg-[#faf8f5]">
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#e8e4dd] bg-white">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-lg">
            <span style={{ fontFamily: "Georgia, serif", color: "#2c2a26", fontWeight: 400 }}>Dine</span>
            <span style={{ fontFamily: "Georgia, serif", color: "#8b6914", fontWeight: 700 }}>Links</span>
          </span>
          <span className="text-sm text-[#6b6560] font-medium">· Find a menu</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#a39d94]">{pins.length} restaurant{pins.length === 1 ? "" : "s"}</span>
          <Link href="/map/admin" className="text-xs font-medium text-[#8b6914] hover:underline">
            Manage
          </Link>
        </div>
      </header>
      <div className="flex-1 relative">
        {pins.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <p className="text-[#6b6560]">
              No approved restaurants with coordinates yet.{" "}
              <Link href="/map/admin" className="text-[#8b6914] font-medium hover:underline">
                Add some in Manage.
              </Link>
            </p>
          </div>
        ) : (
          <MapView pins={pins} />
        )}
      </div>
    </main>
  );
}

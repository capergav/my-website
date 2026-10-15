export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMapOwner, menuLanguages } from "@/lib/mapAccess";
import { type MapPin } from "./MapView";
import { MapClient } from "./MapClient";
import { MapComingSoon } from "./MapComingSoon";

export const metadata: Metadata = {
  title: "Find a menu",
  description: "Discover restaurants with multilingual DineLinks menus near you.",
  robots: { index: false, follow: false },
};

// Build a single readable street address from the location parts.
function formatAddress(r: Record<string, unknown>): string {
  return [r.address, r.city, r.province, r.country]
    .map((v) => (v == null ? "" : String(v).trim()))
    .filter(Boolean)
    .join(", ");
}

export default async function MapPage() {
  // SERVER-SIDE gate. A non-owner never gets past this — the map data and
  // markup below are only ever fetched/rendered for the founder session.
  const owner = await getMapOwner();
  if (!owner) return <MapComingSoon />;

  const { data: rows } = await supabaseAdmin
    .from("restaurants")
    .select(
      "slug, name, map_name, map_notes, address, city, province, country, latitude, longitude, allow_auto_translate, default_language"
    )
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
      address: formatAddress(r as Record<string, unknown>),
      notes: (r.map_notes as string) ?? null,
      // Native-script language names only — flags removed across the feature.
      languages: menuLanguages(r).map((l) => l.label),
    }));

  return <MapClient pins={pins} />;
}

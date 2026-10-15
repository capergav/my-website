export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMapOwner } from "@/lib/mapAccess";
import { MapAdminClient, type AdminRow } from "./MapAdminClient";

export const metadata: Metadata = {
  title: "Map admin",
  robots: { index: false, follow: false },
};

export default async function MapAdminPage() {
  // Same server-side gate as the map itself.
  const owner = await getMapOwner();
  if (!owner) redirect("/");

  const { data: rows } = await supabaseAdmin
    .from("restaurants")
    .select(
      "id, slug, name, map_name, address, city, province, country, latitude, longitude, map_notes, approved_for_map"
    )
    .order("name", { ascending: true });

  const restaurants: AdminRow[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    slug: (r.slug as string) ?? "",
    name: (r.name as string) ?? "Untitled",
    fields: {
      map_name: (r.map_name as string) ?? "",
      address: (r.address as string) ?? "",
      city: (r.city as string) ?? "",
      province: (r.province as string) ?? "",
      country: (r.country as string) ?? "",
      latitude: r.latitude == null ? "" : String(r.latitude),
      longitude: r.longitude == null ? "" : String(r.longitude),
      map_notes: (r.map_notes as string) ?? "",
      approved_for_map: !!r.approved_for_map,
    },
  }));

  return <MapAdminClient restaurants={restaurants} />;
}

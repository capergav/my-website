export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/app/lib/supabase";

// Called once from the signup flow with the new restaurant's address. Identity
// comes from the freshly-authenticated session cookie (never trusted from the
// body), so only the owner can set their own location. Geocodes the address to
// lat/lng via free OpenStreetMap Nominatim and stores both on the restaurant
// row. approved_for_map stays false — the founder approves from the email.

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { address } = (await req.json().catch(() => ({}))) as { address?: string };
  const clean = (address ?? "").trim();
  if (!clean) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  try {
    const res = await fetch(`${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(clean)}`, {
      headers: {
        "User-Agent": "DineLinks/1.0 (https://dinelinks.com; hello@dinelinks.com)",
        "Accept-Language": "en",
      },
    });
    if (res.ok) {
      const results = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (results.length) {
        latitude = Number(results[0].lat);
        longitude = Number(results[0].lon);
      }
    }
  } catch {
    // Geocoding is best-effort — never block signup. Founder can fix coords
    // later from the map admin.
  }

  // Scope the write to this owner's restaurant via the service-role client.
  await supabaseAdmin
    .from("restaurants")
    .update({ address: clean, latitude, longitude })
    .eq("owner_id", user.id);

  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { verifyToken } from "@/lib/mapTokens";

// Free address → lat/lng lookup via OpenStreetMap Nominatim. No API key, no
// billing. Nominatim's usage policy requires an identifying User-Agent and
// caps throughput at ~1 req/sec, which is fine at signup volume.
//
// Guard: must be a logged-in user (the new signup or the founder) OR carry a
// valid map edit token (the logged-out approve-from-email flow). This stops
// the endpoint being used as an open geocoding proxy.

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { address, city, province, country, token } = body as {
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    token?: string;
  };

  let authorized = false;
  if (token && verifyToken(token, "edit")) {
    authorized = true;
  } else {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorized = !!user;
  }
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const query = [address, city, province, country].map((p) => (p ?? "").trim()).filter(Boolean).join(", ");
  if (!query) {
    return NextResponse.json({ error: "Enter an address first." }, { status: 400 });
  }

  try {
    const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "DineLinks/1.0 (https://dinelinks.com; hello@dinelinks.com)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable." }, { status: 502 });
    }
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) {
      return NextResponse.json({ error: "No match for that address." }, { status: 404 });
    }
    return NextResponse.json({
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed." }, { status: 502 });
  }
}

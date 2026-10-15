export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMapOwner } from "@/lib/mapAccess";
import { verifyToken } from "@/lib/mapTokens";

// Saves a restaurant's map info. Authorized EITHER by the founder session
// (the admin list) OR by a valid, unexpired edit token scoped to that exact
// restaurant (the logged-out approve-from-email flow). Writes go through the
// service-role client so they bypass RLS.

type IncomingFields = {
  map_name: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  map_notes: string | null;
  approved_for_map: boolean;
};

function clean(fields: Partial<IncomingFields>) {
  const out: Record<string, unknown> = {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
  out.map_name = str(fields.map_name);
  out.address = str(fields.address);
  out.city = str(fields.city);
  out.province = str(fields.province);
  out.country = str(fields.country);
  out.map_notes = str(fields.map_notes);
  out.approved_for_map = !!fields.approved_for_map;

  const lat = fields.latitude;
  const lng = fields.longitude;
  out.latitude = typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : null;
  out.longitude = typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : null;
  return out;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { restaurantId, token, fields } = body as {
    restaurantId?: string;
    token?: string;
    fields?: Partial<IncomingFields>;
  };

  if (!restaurantId || !fields) {
    return NextResponse.json({ error: "Missing data." }, { status: 400 });
  }

  // Authorize: founder session, or an edit token scoped to this restaurant.
  let authorized = false;
  if (token) {
    const payload = verifyToken(token, "edit");
    if (payload && payload.rid === restaurantId) authorized = true;
  }
  if (!authorized) {
    const owner = await getMapOwner();
    if (owner) authorized = true;
  }
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update(clean(fields))
    .eq("id", restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

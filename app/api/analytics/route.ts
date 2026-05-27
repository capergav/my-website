import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "item_click",
  "language_change",
  "language_use",
  "category_view",
  "session_start",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      restaurant_id,
      event_type,
      item_id,
      category,
      language,
      session_id,
      device_type,
      user_agent,
      referrer,
      visitor_id,
    } = body;

    // Validate required fields
    if (!restaurant_id || !event_type || !session_id) {
      return NextResponse.json({ ok: true }); // silent
    }

    if (!ALLOWED_EVENTS.has(event_type)) {
      return NextResponse.json({ ok: true }); // silent
    }

    const supabase = getSupabaseAdmin();

    // Rate limit: max 200 events per session_id per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("menu_analytics")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session_id)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 200) {
      return NextResponse.json({ ok: true }); // rate limited, silent
    }

    await supabase.from("menu_analytics").insert({
      restaurant_id,
      event_type,
      item_id: item_id ?? null,
      category: category ?? null,
      language: language ?? null,
      session_id,
      device_type: device_type ?? "desktop",
      user_agent: user_agent ?? "",
      referrer: referrer ?? "",
      visitor_id: visitor_id ?? null,
    });
  } catch {
    // always silent
  }

  return NextResponse.json({ ok: true });
}

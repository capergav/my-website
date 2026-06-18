import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// In-memory rate limiting: Map<"ip:restaurantId", { count, resetAt }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string, restaurantId: string): boolean {
  const key = `${ip}:${restaurantId}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, rating, categories, comment, visitType, language, website } = body;

    // Honeypot: if "website" field is filled, silently reject
    if (website) {
      return NextResponse.json({ success: true });
    }

    // Validate required fields
    if (!restaurantId || typeof restaurantId !== "string") {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip, restaurantId)) {
      return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
    }

    // Check if feedback is enabled for this restaurant
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("feedback_enabled")
      .eq("id", restaurantId)
      .maybeSingle();

    if (!restaurant || restaurant.feedback_enabled === false) {
      return NextResponse.json({ error: "Feedback not enabled" }, { status: 403 });
    }

    // Insert feedback
    const { error } = await supabaseAdmin.from("guest_feedback").insert({
      restaurant_id: restaurantId,
      rating,
      categories: Array.isArray(categories) ? categories : null,
      comment: typeof comment === "string" ? comment.slice(0, 300) : null,
      visit_type: typeof visitType === "string" ? visitType : null,
      language: typeof language === "string" ? language : null,
    });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

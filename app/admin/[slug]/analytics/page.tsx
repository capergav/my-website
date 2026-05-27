export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { AnalyticsClient } from "./AnalyticsClient";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ range?: string }> };

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { range: rangeParam } = await searchParams;
  const days = rangeParam === "90" ? 90 : rangeParam === "30" ? 30 : 7;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant || restaurant.owner_id !== user.id) redirect("/admin");

  const admin = getSupabaseAdmin();

  // Guard: analytics requires an active subscription (same as the admin editor)
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, trial_end')
    .eq('user_id', user.id)
    .maybeSingle();
  const subIsActive = sub && (
    sub.status === 'active' ||
    (sub.status === 'trialing' && (!sub.trial_end || new Date(sub.trial_end) > new Date()))
  );
  if (!subIsActive) redirect(`/admin/${slug}`);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const prevSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all events in range + prev period
  const [{ data: events }, { data: prevEvents }, { data: menuItems }] = await Promise.all([
    admin.from("menu_analytics").select("*").eq("restaurant_id", restaurant.id).gte("created_at", since),
    admin.from("menu_analytics").select("event_type, session_id, visitor_id").eq("restaurant_id", restaurant.id).gte("created_at", prevSince).lt("created_at", since),
    admin.from("menu_items").select("id, name, category").eq("restaurant_id", restaurant.id),
  ]);

  const allEvents = (events ?? []) as AnalyticsEvent[];
  const allPrev = (prevEvents ?? []) as { event_type: string; session_id: string; visitor_id: string | null }[];
  const items = (menuItems ?? []) as { id: string; name: string; category: string | null }[];

  // ── Aggregations (JS, fine until 100k+ events) ──────────────────────────────

  // Current period
  const pageViews = allEvents.filter((e) => e.event_type === "page_view");
  const itemClicks = allEvents.filter((e) => e.event_type === "item_click");
  const sessions = new Set(allEvents.map((e) => e.session_id));

  // Prev period
  const prevPageViews = allPrev.filter((e) => e.event_type === "page_view").length;
  const prevSessions = new Set(allPrev.map((e) => e.session_id));
  const prevUniqueVisitorIds = new Set(
    allPrev.filter((e) => e.event_type === "page_view" && e.visitor_id).map((e) => e.visitor_id)
  );

  // Trend %
  const trendPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Top language — only deliberate language_use events (fired after 8s of staying on a language)
  const langUseEvents = allEvents.filter((e) => e.event_type === "language_use");
  const langCounts: Record<string, number> = {};
  for (const e of langUseEvents) {
    if (e.language) langCounts[e.language] = (langCounts[e.language] ?? 0) + 1;
  }
  // Empty string = no deliberate language selections yet; AnalyticsClient renders "—"
  const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  // Unique visitors: prefer distinct visitor_id, fall back to distinct session_id for old data
  const uniqueVisitorIds = new Set(
    pageViews.filter((e) => e.visitor_id).map((e) => e.visitor_id)
  );
  const uniqueVisitors = uniqueVisitorIds.size > 0 ? uniqueVisitorIds.size : sessions.size;
  const prevUniqueVisitors = prevUniqueVisitorIds.size > 0 ? prevUniqueVisitorIds.size : prevSessions.size;

  // Avg items viewed per session
  const clicksPerSession: Record<string, number> = {};
  for (const e of itemClicks) {
    clicksPerSession[e.session_id] = (clicksPerSession[e.session_id] ?? 0) + 1;
  }
  const avgItems = sessions.size > 0
    ? Math.round((Object.values(clicksPerSession).reduce((a, b) => a + b, 0) / sessions.size) * 10) / 10
    : 0;

  // Daily scan counts
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const e of pageViews) {
    const d = e.created_at.slice(0, 10);
    if (d in dailyMap) dailyMap[d]++;
  }
  const dailyScans = Object.entries(dailyMap).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }));

  // Top 10 items by click count
  const itemClickCounts: Record<string, number> = {};
  for (const e of itemClicks) {
    if (e.item_id) itemClickCounts[e.item_id] = (itemClickCounts[e.item_id] ?? 0) + 1;
  }
  const itemNameMap: Record<string, string> = {};
  const itemCatMap: Record<string, string> = {};
  for (const item of items) {
    itemNameMap[item.id] = item.name;
    itemCatMap[item.id] = item.category ?? "Other";
  }
  const topItems = Object.entries(itemClickCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id, views]) => ({
      id,
      name: itemNameMap[id] ?? "(Deleted item)",
      category: itemCatMap[id] ?? "Other",
      views,
    }));
  const totalItemViews = Object.values(itemClickCounts).reduce((a, b) => a + b, 0);

  // Language counts (from language_change events + initial page_view assumed as en)
  const langData = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ lang, count }));

  // Hour-of-day counts
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  for (const e of pageViews) {
    const h = new Date(e.created_at).getHours();
    hourMap[h]++;
  }
  const hourData = Object.entries(hourMap).map(([h, count]) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    count,
  }));

  // Device breakdown
  const deviceMap: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
  for (const e of allEvents) {
    if (e.device_type && e.device_type in deviceMap) deviceMap[e.device_type]++;
  }
  const deviceData = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

  const stats = {
    totalScans: pageViews.length,
    uniqueVisitors,
    avgItems,
    topLang,
    trendScans: trendPct(pageViews.length, prevPageViews),
    trendVisitors: trendPct(uniqueVisitors, prevUniqueVisitors),
  };

  return (
    <AnalyticsClient
      slug={slug}
      restaurantName={restaurant.name ?? "Your Restaurant"}
      days={days}
      stats={stats}
      dailyScans={dailyScans}
      topItems={topItems}
      totalItemViews={totalItemViews}
      langData={langData}
      hourData={hourData}
      hasData={allEvents.length > 0}
    />
  );
}

// Type used in aggregations
type AnalyticsEvent = {
  id: number;
  restaurant_id: string;
  event_type: string;
  item_id: string | null;
  category: string | null;
  language: string | null;
  session_id: string;
  visitor_id: string | null;
  device_type: string;
  user_agent: string;
  referrer: string;
  created_at: string;
};

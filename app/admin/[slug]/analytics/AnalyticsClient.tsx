"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const GOLD = "#8b6914";
const GOLD_LIGHT = "#c9a030";
const DARK = "#2c2a26";
const CREAM = "#faf8f5";

const CHART_COLORS = [
  GOLD, "#c9a030", "#d4af37", DARK, "#6b8e23",
  "#4682b4", "#cd853f", "#8b4513", "#708090", "#2f4f4f",
];

const FEEDBACK_CATEGORY_NAMES: Record<string, string> = {
  food: "Food",
  service: "Service",
  atmosphere: "Atmosphere",
  menuClarity: "Menu clarity",
};

const VISIT_TYPE_NAMES: Record<string, string> = {
  dineIn: "Dine-in",
  takeaway: "Takeaway",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  ar: "العربية",
  zh: "中文",
  ko: "한국어",
  pa: "ਪੰਜਾਬੀ",
  yue: "廣東話",
  tl: "Filipino",
  hi: "हिन्दी",
};

type Props = {
  slug: string;
  restaurantName: string;
  days: number;
  stats: {
    totalScans: number;
    uniqueVisitors: number;
    avgItems: number;
    topLang: string;
    trendScans: number;
    trendVisitors: number;
  };
  dailyScans: { date: string; count: number }[];
  topItems: { id: string; name: string; category: string; views: number }[];
  totalItemViews: number;
  langData: { lang: string; count: number }[];
  hourData: { hour: string; count: number }[];
  feedback: {
    totalResponses: number;
    avgRating: number;
    ratingBreakdown: { star: number; count: number }[];
    categoryBreakdown: { key: string; count: number }[];
    comments: {
      rating: number;
      categories: string[];
      comment: string;
      visitType: string | null;
      createdAt: string;
    }[];
  };
  feedbackEnabled: boolean;
  hasData: boolean;
};

function TrendBadge({ pct }: { pct: number }) {
  const isPos = pct >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5"
      style={{ background: isPos ? "#dcfce7" : "#fee2e2", color: isPos ? "#166534" : "#991b1b" }}
    >
      {isPos ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

function StatCard({
  label, value, trend, subtitle,
}: {
  label: string;
  value: string | number;
  trend?: number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }} />
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-2">{label}</p>
        <p className="text-4xl font-semibold text-[#2c2a26]" style={{ fontFamily: "Georgia, serif" }}>
          {value}
        </p>
        {subtitle && <p className="text-sm text-[#2c2a26]/50 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <TrendBadge pct={trend} />
            <span className="text-xs text-[#2c2a26]/40">vs prev period</span>
          </div>
        )}
      </div>
    </div>
  );
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  const diffMo = Math.round(diffDay / 30);
  if (diffMo < 12) return `${diffMo} month${diffMo === 1 ? "" : "s"} ago`;
  const diffYr = Math.round(diffMo / 12);
  return `${diffYr} year${diffYr === 1 ? "" : "s"} ago`;
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(value - (i - 1), 0), 1); // 0..1 for this star
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0" style={{ color: `${GOLD}30` }} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} fill={GOLD} style={{ color: GOLD }} strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function AnalyticsClient({
  slug, restaurantName, days, stats, dailyScans, topItems,
  langData, hourData, feedback, feedbackEnabled, hasData,
}: Props) {
  const router = useRouter();

  // Adjust UTC hourData to browser local timezone
  const tzOffsetHours = new Date().getTimezoneOffset() / 60; // positive = behind UTC
  const localHourMap: Record<number, number> = {};
  for (let i = 0; i < 24; i++) localHourMap[i] = 0;
  for (const { hour, count } of hourData) {
    const utcH = parseInt(hour.split(":")[0]);
    const localH = ((utcH - tzOffsetHours) % 24 + 24) % 24;
    localHourMap[localH] = (localHourMap[localH] ?? 0) + count;
  }
  const adjustedHourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    count: localHourMap[i],
  }));

  const rangeLabel = days === 7 ? "Last 7 days" : days === 30 ? "Last 30 days" : "Last 90 days";

  const topLangName = stats.topLang ? (LANGUAGE_NAMES[stats.topLang] ?? stats.topLang.toUpperCase()) : "—";

  // Empty state
  if (!hasData) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-semibold text-[#2c2a26] mb-3" style={{ fontFamily: "Georgia, serif" }}>
            No data yet
          </h2>
          <p className="text-[#2c2a26]/60 mb-6 leading-relaxed">
            Share your QR code to start collecting insights from your customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/admin/${slug}/analytics`}
              className="px-5 py-2.5 rounded-xl bg-[#8b6914] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Generate QR code
            </Link>
            <Link
              href={`/admin/${slug}`}
              className="px-5 py-2.5 rounded-xl border border-[#2c2a26]/20 text-[#2c2a26] text-sm font-medium hover:bg-white transition-colors"
            >
              ← Back to menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#2c2a26]/8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/admin/${slug}`} className="text-[#2c2a26]/40 hover:text-[#2c2a26] transition-colors text-sm">
              ← {restaurantName}
            </Link>
            <span className="text-[#2c2a26]/20">/</span>
            <div>
              <h1 className="text-xl font-semibold text-[#2c2a26]" style={{ fontFamily: "Georgia, serif" }}>
                Menu Analytics
              </h1>
              <p className="text-xs text-[#2c2a26]/40">Live insights from your customers</p>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-2 bg-[#faf8f5] rounded-xl p-1 border border-[#2c2a26]/8">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => router.push(`/admin/${slug}/analytics?range=${d}`)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d
                    ? "bg-white shadow-sm text-[#2c2a26] ring-1 ring-[#2c2a26]/10"
                    : "text-[#2c2a26]/50 hover:text-[#2c2a26]"
                }`}
              >
                {d === 7 ? "7 days" : d === 30 ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Menu views"
            value={stats.totalScans.toLocaleString()}
            trend={stats.trendScans}
          />
          <StatCard
            label="Unique Visitors"
            value={stats.uniqueVisitors.toLocaleString()}
            trend={stats.trendVisitors}
          />
          <StatCard
            label="Avg Items Viewed"
            value={stats.avgItems.toFixed(1)}
            subtitle="items clicked per visit"
          />
          <StatCard
            label="Top Language"
            value={topLangName}
            subtitle="most used language"
          />
        </div>

        {/* Views over time */}
        <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
            Views over time — {rangeLabel}
          </h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyScans} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${DARK}10`} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: `${DARK}60` }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: `${DARK}60` }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${DARK}15`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                  labelStyle={{ color: DARK, fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Views"
                  stroke={GOLD}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: GOLD }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2: top items + languages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top items */}
          <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
              Most viewed items
            </h2>
            {topItems.slice(0, 10).length > 0 ? (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topItems.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={`${DARK}10`} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: `${DARK}60` }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: `${DARK}80` }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: `1px solid ${DARK}15`, fontSize: 12 }}
                      cursor={{ fill: `${GOLD}10` }}
                    />
                    <Bar dataKey="views" name="Views" radius={[0, 4, 4, 0]}>
                      {topItems.slice(0, 10).map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? GOLD : idx < 3 ? GOLD_LIGHT : `${GOLD}60`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[#2c2a26]/40 py-8 text-center">No item clicks recorded yet</p>
            )}
          </div>

          {/* Language preferences */}
          <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
              Language preferences
            </h2>
            {langData.length > 0 ? (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={langData}
                      dataKey="count"
                      nameKey="lang"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      label={false}
                      labelLine={false}
                    >
                      {langData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: `1px solid ${DARK}15`, fontSize: 12 }}
                      formatter={(value, name) => [value, LANGUAGE_NAMES[name as string] ?? (name as string)]}
                    />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      formatter={(value, entry: any) => {
                        const total = langData.reduce((s, d) => s + d.count, 0);
                        const pct = total > 0 ? Math.round((entry.payload?.count ?? 0) / total * 100) : 0;
                        const langName = LANGUAGE_NAMES[value] ?? value;
                        return <span dir="ltr">{`${langName} ${pct}%`}</span>;
                      }}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: 11,
                        paddingTop: 12,
                        width: "100%",
                        lineHeight: "2",
                        direction: "ltr",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[#2c2a26]/40 py-8 text-center">No language data yet</p>
            )}
          </div>
        </div>

        {/* Peak hours — full width */}
        <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
            Peak hours
          </h2>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adjustedHourData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${DARK}10`} vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: `${DARK}60` }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10, fill: `${DARK}60` }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${DARK}15`, fontSize: 12 }}
                  cursor={{ fill: `${GOLD}10` }}
                />
                <Bar dataKey="count" name="Views" fill={GOLD} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[#2c2a26]/40 mt-2 text-right">
            Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </p>
        </div>

        {/* Guest feedback */}
        <div>
          <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-4 opacity-60">
            Guest feedback
          </h2>

          {!feedbackEnabled ? (
            <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-8 sm:p-12 text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-[#2c2a26] mb-2" style={{ fontFamily: "Georgia, serif" }}>
                Guest feedback is turned off
              </h3>
              <p className="text-[#2c2a26]/60 leading-relaxed max-w-md mx-auto mb-6">
                Guest feedback is currently turned off. Enable it in Settings to start collecting ratings from your customers.
              </p>
              <Link
                href={`/admin/${slug}/settings`}
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#8b6914] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Open Settings
              </Link>
            </div>
          ) : feedback.totalResponses === 0 ? (
            <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-8 sm:p-12 text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-[#2c2a26] mb-2" style={{ fontFamily: "Georgia, serif" }}>
                No feedback yet
              </h3>
              <p className="text-[#2c2a26]/60 leading-relaxed max-w-md mx-auto">
                Once your guests start leaving feedback, their ratings and comments will appear here.
                You can turn guest feedback on or off anytime in{" "}
                <Link href={`/admin/${slug}/settings`} className="font-semibold underline" style={{ color: GOLD }}>
                  Settings
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary + rating breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average rating */}
                <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-6xl font-semibold text-[#2c2a26] leading-none" style={{ fontFamily: "Georgia, serif" }}>
                    {feedback.avgRating.toFixed(1)}
                  </p>
                  <div className="mt-3">
                    <Stars value={feedback.avgRating} size={22} />
                  </div>
                  <p className="text-sm text-[#2c2a26]/50 mt-3">
                    based on {feedback.totalResponses} response{feedback.totalResponses === 1 ? "" : "s"}
                  </p>
                </div>

                {/* Rating breakdown */}
                <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
                    Rating breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {feedback.ratingBreakdown.map(({ star, count }) => {
                      const pct = feedback.totalResponses > 0 ? (count / feedback.totalResponses) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-sm font-medium text-[#2c2a26]/70 w-8">
                            {star}<Star size={12} fill={GOLD} style={{ color: GOLD }} strokeWidth={0} />
                          </span>
                          <div className="flex-1 h-2.5 rounded-full bg-[#faf8f5] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }}
                            />
                          </div>
                          <span className="text-sm text-[#2c2a26]/50 w-8 text-right tabular-nums">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Category breakdown + recent comments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category breakdown */}
                <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
                    What guests mention
                  </h3>
                  {feedback.categoryBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {feedback.categoryBreakdown.map(({ key, count }, idx) => {
                        const max = feedback.categoryBreakdown[0].count || 1;
                        const pct = (count / max) * 100;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-[#2c2a26]">
                                {FEEDBACK_CATEGORY_NAMES[key] ?? key}
                              </span>
                              <span className="text-sm text-[#2c2a26]/50 tabular-nums">{count}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-[#faf8f5] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: idx === 0 ? GOLD : idx < 3 ? GOLD_LIGHT : `${GOLD}60` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#2c2a26]/40 py-8 text-center">No categories selected yet</p>
                  )}
                </div>

                {/* Recent comments */}
                <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
                    Recent comments
                  </h3>
                  {feedback.comments.length > 0 ? (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 -mr-1">
                      {feedback.comments.map((c, idx) => (
                        <div key={idx} className="pb-4 border-b border-[#2c2a26]/5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Stars value={c.rating} size={14} />
                            <span className="text-xs text-[#2c2a26]/40 whitespace-nowrap">{relativeDate(c.createdAt)}</span>
                          </div>
                          {(c.categories.length > 0 || c.visitType) && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {c.categories.map((cat) => (
                                <span
                                  key={cat}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                  style={{ background: `${GOLD}12`, color: GOLD }}
                                >
                                  {FEEDBACK_CATEGORY_NAMES[cat] ?? cat}
                                </span>
                              ))}
                              {c.visitType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#2c2a26]/6 text-[#2c2a26]/60">
                                  {VISIT_TYPE_NAMES[c.visitType] ?? c.visitType}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-[#2c2a26]/80 leading-relaxed whitespace-pre-line break-words">
                            {c.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#2c2a26]/40 py-8 text-center">No written comments yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "Français 🏴󠁣󠁡󠁱󠁣󠁿",
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

export function AnalyticsClient({
  slug, restaurantName, days, stats, dailyScans, topItems, totalItemViews,
  langData, hourData, hasData,
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

  const topLangName = LANGUAGE_NAMES[stats.topLang] ?? stats.topLang.toUpperCase();

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
            label="Total Scans"
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

        {/* Scans over time */}
        <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest mb-5 opacity-60">
            Scans over time — {rangeLabel}
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
                  name="Scans"
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
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      label={({ lang, percent }) => `${LANGUAGE_NAMES[lang as string] ?? lang} ${((percent as number) * 100).toFixed(0)}%`}
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
                      formatter={(value) => LANGUAGE_NAMES[value] ?? value}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
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
                <Bar dataKey="count" name="Scans" fill={GOLD} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[#2c2a26]/40 mt-2 text-right">
            Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </p>
        </div>

        {/* Item performance table */}
        <div className="bg-white rounded-2xl border border-[#2c2a26]/8 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#2c2a26]/8">
            <h2 className="text-sm font-semibold text-[#2c2a26] uppercase tracking-widest opacity-60">
              Item performance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2c2a26]/8 bg-[#faf8f5]/60">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50">Item</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 hidden sm:table-cell">Category</th>
                  <th className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50">Views</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 hidden sm:table-cell">% of total</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#2c2a26]/40 text-sm">
                      No item clicks recorded yet
                    </td>
                  </tr>
                ) : (
                  topItems.map((item, idx) => {
                    const pct = totalItemViews > 0 ? ((item.views / totalItemViews) * 100).toFixed(1) : "0";
                    const isLow = item.views === 0;
                    return (
                      <tr key={item.id} className={`border-b border-[#2c2a26]/5 transition-colors hover:bg-[#faf8f5]/60 ${isLow ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#2c2a26]/30 w-5 text-right">{idx + 1}</span>
                            <span className={`font-medium ${isLow ? "text-[#2c2a26]/40" : "text-[#2c2a26]"}`}>{item.name}</span>
                            {isLow && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600">
                                Consider removing
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[#2c2a26]/50 hidden sm:table-cell">{item.category}</td>
                        <td className="px-3 py-3 text-right font-semibold text-[#2c2a26]">{item.views}</td>
                        <td className="px-5 py-3 text-right text-[#2c2a26]/50 hidden sm:table-cell">{pct}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

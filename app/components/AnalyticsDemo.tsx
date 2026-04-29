"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const GOLD       = "#8b6914";
const GOLD_LIGHT = "#c9a030";
const DARK       = "#2c2a26";

const CHART_COLORS = [GOLD, "#c9a030", "#d4af37", DARK, "#6b8e23", "#4682b4"];
const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", fr: "🇫🇷", zh: "🇨🇳", es: "🇪🇸", ar: "🇸🇦",
};

// ── Demo data (mirrors real AnalyticsClient shapes) ────────────────────────
const DAILY_SCANS = [
  { date: "Mon", count: 201 },
  { date: "Tue", count: 189 },
  { date: "Wed", count: 247 },
  { date: "Thu", count: 312 },
  { date: "Fri", count: 198 },
  { date: "Sat", count: 312 },
  { date: "Sun", count: 188 },
];

const TOP_ITEMS = [
  { name: "Duck Confit",      category: "Mains",   views: 82 },
  { name: "Atlantic Salmon",  category: "Mains",   views: 68 },
  { name: "Crème Brûlée",     category: "Desserts",views: 51 },
  { name: "Wagyu Burger",     category: "Mains",   views: 39 },
  { name: "Mushroom Risotto", category: "Mains",   views: 34 },
];

const LANG_DATA = [
  { lang: "en", count: 68 },
  { lang: "fr", count: 12 },
  { lang: "zh", count: 9  },
  { lang: "es", count: 6  },
  { lang: "ar", count: 5  },
];

const HOUR_DATA = [
  { hour: "8am",  count: 18 },
  { hour: "9am",  count: 22 },
  { hour: "10am", count: 14 },
  { hour: "11am", count: 19 },
  { hour: "12pm", count: 48 },
  { hour: "1pm",  count: 52 },
  { hour: "2pm",  count: 31 },
  { hour: "3pm",  count: 24 },
  { hour: "4pm",  count: 21 },
  { hour: "5pm",  count: 29 },
  { hour: "6pm",  count: 58 },
  { hour: "7pm",  count: 67 },
  { hour: "8pm",  count: 61 },
  { hour: "9pm",  count: 38 },
];

const DEVICE_DATA = [
  { device: "mobile",  count: 78 },
  { device: "desktop", count: 14 },
  { device: "tablet",  count: 8  },
];

function StatCard({ label, value, trend, subtitle }: { label: string; value: string | number; trend?: number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#2c2a26]/8 shadow-sm overflow-hidden">
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }} />
      <div className="p-3 sm:p-4">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-[#2c2a26]" style={{ fontFamily: "Georgia, serif" }}>{value}</p>
        {subtitle && <p className="text-[10px] text-[#2c2a26]/40 mt-0.5">{subtitle}</p>}
        {trend !== undefined && (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 mt-1"
            style={{ background: trend >= 0 ? "#dcfce7" : "#fee2e2", color: trend >= 0 ? "#166534" : "#991b1b" }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function AnalyticsDemo() {
  return (
    <div className="rounded-2xl border border-[#8b6914]/20 shadow-2xl overflow-hidden bg-[#faf8f5] text-[#2c2a26]">
      {/* Browser chrome */}
      <div className="bg-[#2c2a26] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white/10 rounded-md px-3 py-1 flex items-center gap-2 max-w-xs mx-auto">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span className="text-white/50 text-[10px] font-mono">dinelinks.com/admin/copper-table/analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[10px] font-medium">Demo data</span>
        </div>
      </div>

      {/* Analytics header bar */}
      <div className="bg-white border-b border-[#2c2a26]/8 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#2c2a26]/40 text-xs">← The Copper Table</span>
          <span className="text-[#2c2a26]/20">/</span>
          <span className="text-sm font-semibold text-[#2c2a26]" style={{ fontFamily: "Georgia, serif" }}>Menu Analytics</span>
        </div>
        <div className="flex items-center gap-1 bg-[#faf8f5] rounded-lg p-0.5 border border-[#2c2a26]/8">
          <span className="px-2.5 py-1 rounded-md bg-white shadow-sm text-[10px] font-medium text-[#2c2a26] ring-1 ring-[#2c2a26]/10">7 days</span>
          <span className="px-2.5 py-1 text-[10px] font-medium text-[#2c2a26]/40">30 days</span>
          <span className="px-2.5 py-1 text-[10px] font-medium text-[#2c2a26]/40">90 days</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Scans"      value="1,847" trend={12} />
          <StatCard label="Unique Visitors"  value="634"   trend={8}  />
          <StatCard label="Avg Items Viewed" value="4.2"   subtitle="items clicked per visit" />
          <StatCard label="Top Language"     value="🇬🇧 EN" subtitle="most used language" />
        </div>

        {/* Line chart — scans over time */}
        <div className="bg-white rounded-xl border border-[#2c2a26]/8 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-3">Scans over time — Last 7 days</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={DAILY_SCANS} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${DARK}10`} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: `${DARK}60` }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: `${DARK}60` }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: `1px solid ${DARK}15`, fontSize: 11 }}
                labelStyle={{ color: DARK, fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="count" name="Scans" stroke={GOLD} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: GOLD }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Row 2: top items + language pie */}
        <div className="grid grid-cols-2 gap-3">
          {/* Top items */}
          <div className="bg-white rounded-xl border border-[#2c2a26]/8 shadow-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-3">Most viewed items</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={TOP_ITEMS} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${DARK}10`} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: `${DARK}60` }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: `${DARK}80` }}
                  tickLine={false}
                  axisLine={false}
                  width={85}
                  tickFormatter={(v: string) => v.length > 13 ? v.slice(0, 13) + "…" : v}
                />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${DARK}15`, fontSize: 11 }} cursor={{ fill: `${GOLD}10` }} />
                <Bar dataKey="views" name="Views" radius={[0, 4, 4, 0]}>
                  {TOP_ITEMS.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? GOLD : idx < 3 ? GOLD_LIGHT : `${GOLD}60`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Language pie */}
          <div className="bg-white rounded-xl border border-[#2c2a26]/8 shadow-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-3">Language preferences</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={LANG_DATA}
                  dataKey="count"
                  nameKey="lang"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  label={({ lang, percent }) => `${LANG_FLAGS[lang as string] ?? "🌐"} ${((percent as number) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {LANG_DATA.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: `1px solid ${DARK}15`, fontSize: 11 }}
                  formatter={(value, name) => [value, `${LANG_FLAGS[name as string] ?? "🌐"} ${(name as string).toUpperCase()}`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: peak hours + devices */}
        <div className="grid grid-cols-2 gap-3">
          {/* Peak hours */}
          <div className="bg-white rounded-xl border border-[#2c2a26]/8 shadow-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-3">Peak hours</p>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={HOUR_DATA} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${DARK}10`} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: `${DARK}60` }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 9, fill: `${DARK}60` }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${DARK}15`, fontSize: 11 }} cursor={{ fill: `${GOLD}10` }} />
                <Bar dataKey="count" name="Scans" fill={GOLD} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Device breakdown */}
          <div className="bg-white rounded-xl border border-[#2c2a26]/8 shadow-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-3">Device breakdown</p>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie
                  data={DEVICE_DATA}
                  dataKey="count"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => ((percent as number) > 0.08 ? `${name} ${((percent as number) * 100).toFixed(0)}%` : "")}
                  labelLine={false}
                >
                  {DEVICE_DATA.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? GOLD : idx === 1 ? GOLD_LIGHT : DARK} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${DARK}15`, fontSize: 11 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

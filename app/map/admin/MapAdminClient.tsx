"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapEditForm, type MapFields } from "../MapEditForm";

export type AdminRow = {
  id: string;
  slug: string;
  name: string;
  fields: MapFields;
};

function statusOf(f: MapFields): { label: string; color: string } {
  const hasCoords = f.latitude.trim() !== "" && f.longitude.trim() !== "";
  if (f.approved_for_map && hasCoords) return { label: "Live on map", color: "#1a7f4b" };
  if (f.approved_for_map && !hasCoords) return { label: "Approved · needs coords", color: "#8b6914" };
  if (hasCoords) return { label: "Has coords · not approved", color: "#5b7fb5" };
  return { label: "No location", color: "#a39d94" };
}

export function MapAdminClient({ restaurants }: { restaurants: AdminRow[] }) {
  const [rows, setRows] = useState(restaurants);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.fields.city ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const liveCount = rows.filter(
    (r) => r.fields.approved_for_map && r.fields.latitude.trim() !== "" && r.fields.longitude.trim() !== ""
  ).length;

  function onSaved(id: string, fields: MapFields) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, fields } : r)));
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-serif font-semibold text-[#2c2a26]">Map admin</h1>
          <Link href="/map" className="text-sm font-medium text-[#8b6914] hover:underline">
            View map →
          </Link>
        </div>
        <p className="text-sm text-[#6b6560] mb-5">
          {rows.length} restaurant{rows.length === 1 ? "" : "s"} · {liveCount} live on map. Add a location and tick
          “Approved for map” to make one appear.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, slug, or city…"
          className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
        />

        <div className="space-y-2">
          {filtered.map((r) => {
            const st = statusOf(r.fields);
            const open = openId === r.id;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {r.fields.map_name || r.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">/menu/{r.slug}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-medium" style={{ color: st.color }}>
                      ● {st.label}
                    </span>
                    <span className="text-gray-300 text-lg leading-none">{open ? "−" : "+"}</span>
                  </div>
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                    <MapEditForm restaurant={r} onSaved={(fields) => onSaved(r.id, fields)} />
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No restaurants match “{query}”.</p>
          )}
        </div>
      </div>
    </main>
  );
}

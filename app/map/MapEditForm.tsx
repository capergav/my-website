"use client";

import { useState } from "react";

export type MapFields = {
  map_name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: string;
  longitude: string;
  map_notes: string;
  approved_for_map: boolean;
};

export type MapRestaurant = {
  id: string;
  slug: string;
  name: string;
  fields: MapFields;
};

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]";
const labelCls = "block text-xs font-medium text-gray-600 mb-1";

export function MapEditForm({
  restaurant,
  token,
  onSaved,
}: {
  restaurant: MapRestaurant;
  token?: string;
  onSaved?: (fields: MapFields) => void;
}) {
  const [f, setF] = useState<MapFields>(restaurant.fields);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const set = (patch: Partial<MapFields>) => setF((prev) => ({ ...prev, ...patch }));

  async function geocode() {
    setMsg(null);
    setGeocoding(true);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: f.address,
          city: f.city,
          province: f.province,
          country: f.country,
          token,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.lat == null) {
        setMsg({ kind: "err", text: data.error || "Couldn't find that address." });
      } else {
        set({ latitude: String(data.lat), longitude: String(data.lng) });
        setMsg({ kind: "ok", text: "Coordinates filled from address." });
      }
    } catch {
      setMsg({ kind: "err", text: "Geocoding failed. Try again." });
    } finally {
      setGeocoding(false);
    }
  }

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/map/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          token,
          fields: {
            map_name: f.map_name.trim() || null,
            address: f.address.trim() || null,
            city: f.city.trim() || null,
            province: f.province.trim() || null,
            country: f.country.trim() || null,
            latitude: f.latitude.trim() === "" ? null : Number(f.latitude),
            longitude: f.longitude.trim() === "" ? null : Number(f.longitude),
            map_notes: f.map_notes.trim() || null,
            approved_for_map: f.approved_for_map,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg({ kind: "err", text: data.error || "Save failed." });
      } else {
        setMsg({ kind: "ok", text: "Saved." });
        onSaved?.(f);
      }
    } catch {
      setMsg({ kind: "err", text: "Save failed. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Name shown on map</label>
        <input
          className={inputCls}
          value={f.map_name}
          onChange={(e) => set({ map_name: e.target.value })}
          placeholder={restaurant.name}
        />
      </div>

      <div>
        <label className={labelCls}>Street address</label>
        <input className={inputCls} value={f.address} onChange={(e) => set({ address: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>City</label>
          <input className={inputCls} value={f.city} onChange={(e) => set({ city: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Province / State</label>
          <input className={inputCls} value={f.province} onChange={(e) => set({ province: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Country</label>
        <input className={inputCls} value={f.country} onChange={(e) => set({ country: e.target.value })} />
      </div>

      <div>
        <button
          type="button"
          onClick={geocode}
          disabled={geocoding}
          className="text-xs font-medium text-[#8b6914] hover:underline disabled:opacity-50"
        >
          {geocoding ? "Looking up…" : "↻ Fill coordinates from address"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Latitude</label>
          <input className={inputCls} value={f.latitude} onChange={(e) => set({ latitude: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Longitude</label>
          <input className={inputCls} value={f.longitude} onChange={(e) => set({ longitude: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={`${inputCls} resize-y`}
          rows={2}
          value={f.map_notes}
          onChange={(e) => set({ map_notes: e.target.value })}
          placeholder="Optional note shown on the map pin"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={f.approved_for_map}
          onChange={(e) => set({ approved_for_map: e.target.checked })}
          className="w-4 h-4 accent-[#8b6914]"
        />
        Approved for map
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-[#8b6914] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.kind === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}

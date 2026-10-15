"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  languages: { flag: string; label: string }[];
  notes: string | null;
};

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function popupHtml(p: MapPin): string {
  const langs = p.languages
    .map(
      (l) =>
        `<span style="display:inline-block;margin:2px 4px 0 0;font-size:12px;white-space:nowrap;">${l.flag} ${esc(
          l.label
        )}</span>`
    )
    .join("");
  const notes = p.notes
    ? `<p style="margin:6px 0 0;font-size:12px;color:#6b6560;line-height:1.4;">${esc(p.notes)}</p>`
    : "";
  return `
    <div style="min-width:180px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="font-size:15px;font-weight:700;color:#2c2a26;">${esc(p.name)}</div>
      <div style="margin-top:4px;">${langs}</div>
      ${notes}
      <a href="/menu/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener"
         style="display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:#8b6914;text-decoration:none;">
        View menu →
      </a>
    </div>`;
}

export function MapView({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([20, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Self-contained gold teardrop pin — no external marker image to 404.
      const icon = L.divIcon({
        className: "dl-map-pin",
        html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 26 14 26s14-16 14-26C28 6.3 21.7 0 14 0z" fill="#8b6914"/>
            <circle cx="14" cy="14" r="5.5" fill="#fff"/>
          </svg>`,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -36],
      });

      const latlngs: [number, number][] = [];
      for (const p of pins) {
        if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
        L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(popupHtml(p));
        latlngs.push([p.lat, p.lng]);
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 13);
      } else if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
      }

      // Leaflet occasionally mis-sizes tiles when the container animates in.
      setTimeout(() => map?.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "100%" }} />;
}

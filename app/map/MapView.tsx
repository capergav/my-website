"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { t, type Locale } from "@/app/lib/translations";

export type MapPin = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  languages: string[]; // native-script language names, no flags
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

// Google Maps directions link: standard maps URL built from the coordinates, so
// it works on desktop (opens maps.google.com) and deep-links into the app on
// mobile. Coordinates are authoritative, so the pin always resolves exactly.
function directionsUrl(p: MapPin): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}

function popupHtml(p: MapPin, locale: Locale): string {
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";

  const langs = p.languages
    .map(
      (label) =>
        `<span style="display:inline-block;margin:3px 4px 0 0;padding:2px 8px;border-radius:999px;background:#faf8f5;border:1px solid #e8e4dd;font-size:12px;color:#2c2a26;white-space:nowrap;">${esc(
          label
        )}</span>`
    )
    .join("");

  const address = p.address
    ? `<div style="margin-top:4px;font-size:12px;color:#6b6560;line-height:1.4;">${esc(p.address)}</div>`
    : "";

  const notes = p.notes
    ? `<p style="margin:6px 0 0;font-size:12px;color:#6b6560;line-height:1.4;">${esc(p.notes)}</p>`
    : "";

  const langArrow = rtl ? "←" : "→";

  return `
    <div dir="${dir}" style="min-width:200px;text-align:${align};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="font-size:15px;font-weight:700;color:#2c2a26;">${esc(p.name)}</div>
      ${address}
      <div style="margin-top:8px;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#a39d94;">${esc(
        t("map.popupLanguages", locale)
      )}</div>
      <div style="margin-top:2px;">${langs}</div>
      ${notes}
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;${rtl ? "justify-content:flex-end;" : ""}">
        <a href="/menu/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener"
           style="display:inline-block;font-size:13px;font-weight:600;color:#fff;background:#8b6914;padding:6px 12px;border-radius:8px;text-decoration:none;">
          ${esc(t("map.popupViewMenu", locale))} ${langArrow}
        </a>
        <a href="${directionsUrl(p)}" target="_blank" rel="noopener"
           style="display:inline-block;font-size:13px;font-weight:600;color:#8b6914;background:#faf8f5;border:1px solid #e8e4dd;padding:6px 12px;border-radius:8px;text-decoration:none;">
          ${esc(t("map.popupDirections", locale))}
        </a>
      </div>
    </div>`;
}

export function MapView({ pins, locale }: { pins: MapPin[]; locale: Locale }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([20, 0], 2);

      // CartoDB Positron — a muted, desaturated greyscale basemap (free, no API
      // key, OSM data). Roads and labels stay legible but recede, so the gold
      // pins are the most prominent thing on screen.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      // Custom marker: a gold teardrop with the Lucide "utensils" icon in white,
      // matching the icon set used across the app. Drop-shadow lifts it off the
      // grey tiles for contrast.
      const icon = L.divIcon({
        className: "dl-map-pin",
        html: `<div style="filter:drop-shadow(0 3px 4px rgba(0,0,0,0.35));">
            <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z" fill="#8b6914"/>
              <g transform="translate(10,9) scale(0.83)" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                <path d="M7 2v20"/>
                <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
              </g>
            </svg>
          </div>`,
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -48],
      });

      const latlngs: [number, number][] = [];
      for (const p of pins) {
        if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
        L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(popupHtml(p, locale));
        latlngs.push([p.lat, p.lng]);
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 13);
      } else if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
      }

      setTimeout(() => map?.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins, locale]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "100%" }} />;
}

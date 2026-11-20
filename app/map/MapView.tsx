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

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

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
  const langArrow = rtl ? "←" : "→";

  // Every DineLinks menu is auto-translated into the full language set, so the
  // headline communicates the real capability at a glance; the native-script
  // names live behind a tap/click so the popup stays compact.
  const count = p.languages.length;
  const readable = esc(t("map.popupReadable", locale).replace("{count}", String(count)));

  const langPills = p.languages
    .map(
      (label) =>
        `<span style="display:inline-block;margin:4px 4px 0 0;padding:2px 9px;border-radius:999px;background:#2a2621;border:1px solid #433c31;font-size:12px;color:#ece4d4;white-space:nowrap;">${esc(
          label
        )}</span>`
    )
    .join("");

  const address = p.address
    ? `<div style="margin-top:4px;font-size:12px;color:#a39d94;line-height:1.4;">${esc(p.address)}</div>`
    : "";

  const notes = p.notes
    ? `<p style="margin:8px 0 0;font-size:12px;color:#a39d94;line-height:1.4;">${esc(p.notes)}</p>`
    : "";

  // Gold globe to signal "languages", light chevron that rotates when open.
  const globe = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d9b25f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  const chevron = `<svg class="dl-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a39d94" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="margin-${
    rtl ? "right" : "left"
  }:auto;flex:none;"><path d="m6 9 6 6 6-6"/></svg>`;

  const languagesBlock = `
    <details class="dl-langs" style="margin-top:10px;">
      <summary style="display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:10px;background:#211e1a;border:1px solid #3c362d;font-size:13px;font-weight:600;color:#f1ebe0;">
        ${globe}<span>${readable}</span>${chevron}
      </summary>
      <div style="margin-top:4px;">${langPills}</div>
    </details>`;

  return `
    <div dir="${dir}" style="min-width:214px;text-align:${align};font-family:${FONT};">
      <div style="font-size:15px;font-weight:700;color:#faf6ee;">${esc(p.name)}</div>
      ${address}
      ${languagesBlock}
      ${notes}
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;${rtl ? "justify-content:flex-end;" : ""}">
        <a href="/menu/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener"
           style="display:inline-block;font-size:13px;font-weight:700;color:#1a1611;background:#caa23f;padding:6px 12px;border-radius:8px;text-decoration:none;">
          ${esc(t("map.popupViewMenu", locale))} ${langArrow}
        </a>
        <a href="${directionsUrl(p)}" target="_blank" rel="noopener"
           style="display:inline-block;font-size:13px;font-weight:600;color:#e3c98c;background:#211e1a;border:1px solid #4a4336;padding:6px 12px;border-radius:8px;text-decoration:none;">
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

      // Standard OpenStreetMap raster tiles — free forever, no API key or
      // account (CARTO's dark basemaps now gate behind a key and render as
      // "API KEY REQUIRED" watermarks, which previously broke this map). The
      // `dl-basemap` class inverts + hue-rotates + desaturates the light OSM
      // tiles into a charcoal/grey dark map entirely in CSS (see <style>
      // below) — no extra network source, so it stays keyless — while the gold
      // restaurant pins become the clear focal point.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "dl-basemap",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom marker: a gold teardrop with the Lucide "utensils" icon in white.
      // A lighter-gold rim plus a dark drop-shadow and faint gold glow lift it
      // off the charcoal tiles so it reads clearly at a glance.
      const icon = L.divIcon({
        className: "dl-map-pin",
        html: `<div style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.6)) drop-shadow(0 0 7px rgba(217,178,95,0.4));">
            <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 1C9.5 1 1 9.5 1 20c0 13.6 19 31 19 31s19-17.4 19-31C39 9.5 30.5 1 20 1z" fill="#8b6914" stroke="#e4c074" stroke-width="1.6"/>
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

  return (
    <>
      <style>{`
        /* Dark basemap, keyless: invert flips the light OSM tiles to dark and
           turns the dark labels light (legible), hue-rotate restores natural
           hues after the invert, and saturate/grayscale pull everything toward
           a neutral charcoal/grey so the gold pins own the colour. */
        .dl-basemap {
          filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.92)
                  saturate(0.5) grayscale(0.28);
        }
        /* Dark canvas behind/around tiles (and while they load). */
        .leaflet-container { background: #15120d; }

        /* Dark popups to match the basemap instead of light UI on a dark map. */
        .leaflet-popup-content-wrapper {
          background: #1b1813;
          color: #f1ebe0;
          border-radius: 14px;
          box-shadow: 0 12px 34px rgba(0,0,0,0.55);
        }
        .leaflet-popup-content { margin: 14px 16px; }
        .leaflet-popup-tip { background: #1b1813; box-shadow: none; }
        .leaflet-popup-close-button { color: #a39d94 !important; }
        .leaflet-popup-close-button:hover { color: #fff !important; }

        /* Expandable language disclosure inside the popup. */
        .dl-langs summary { list-style: none; cursor: pointer; }
        .dl-langs summary::-webkit-details-marker { display: none; }
        .dl-langs .dl-chevron { transition: transform .18s ease; }
        .dl-langs[open] .dl-chevron { transform: rotate(180deg); }

        /* Dark zoom + attribution controls. */
        .leaflet-bar a,
        .leaflet-control-zoom a {
          background: #1b1813 !important;
          color: #e3c98c !important;
          border-color: #3a352d !important;
        }
        .leaflet-bar a:hover,
        .leaflet-control-zoom a:hover {
          background: #2a2621 !important;
          color: #fff !important;
        }
        .leaflet-control-attribution {
          background: rgba(21,18,13,0.72) !important;
          color: #8a847b !important;
        }
        .leaflet-control-attribution a { color: #caa23f !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: "100%" }} />
    </>
  );
}

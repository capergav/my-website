"use client";

import { useEffect, useRef } from "react";

export type EventType =
  | "page_view"
  | "item_click"
  | "language_change"
  | "category_view"
  | "session_start";

export type DeviceType = "mobile" | "tablet" | "desktop";

export function detectDevice(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return "mobile";
  return "desktop";
}

export function useSessionId(): string {
  const ref = useRef<string>("");
  if (typeof window !== "undefined") {
    let id = sessionStorage.getItem("dl_session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("dl_session", id);
    }
    ref.current = id;
  }
  return ref.current;
}

export async function trackEvent(payload: {
  restaurant_id: string;
  event_type: EventType;
  item_id?: string | null;
  category?: string | null;
  language?: string | null;
  session_id: string;
  device_type: DeviceType;
  user_agent: string;
  referrer: string;
}): Promise<void> {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // silent failure — never break the menu
  }
}

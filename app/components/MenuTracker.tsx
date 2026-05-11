"use client";

import { useEffect, useRef } from "react";
import { trackEvent, detectDevice, getVisitorId } from "@/lib/analytics";

export function MenuTracker({ restaurantId }: { restaurantId: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    let sessionId = sessionStorage.getItem("dl_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("dl_session", sessionId);
    }

    const visitorId = getVisitorId();
    const device = detectDevice();
    const ua = navigator.userAgent;
    const ref = document.referrer ?? "";
    // Read stored language at fire time (after LanguageProvider has hydrated from localStorage)
    const language = localStorage.getItem("menusnap-locale") ?? "en";

    const isNewSession = !sessionStorage.getItem("dl_session_started");
    if (isNewSession) {
      sessionStorage.setItem("dl_session_started", "1");
      trackEvent({
        restaurant_id: restaurantId,
        event_type: "session_start",
        session_id: sessionId,
        device_type: device,
        user_agent: ua,
        referrer: ref,
        visitor_id: visitorId,
        language,
      });
    }

    trackEvent({
      restaurant_id: restaurantId,
      event_type: "page_view",
      session_id: sessionId,
      device_type: device,
      user_agent: ua,
      referrer: ref,
      visitor_id: visitorId,
      language,
    });
  }, [restaurantId]);

  return null;
}

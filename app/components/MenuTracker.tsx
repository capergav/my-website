"use client";

import { useEffect, useRef } from "react";
import { trackEvent, detectDevice } from "@/lib/analytics";

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

    const device = detectDevice();
    const ua = navigator.userAgent;
    const ref = document.referrer ?? "";

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
      });
    }

    trackEvent({
      restaurant_id: restaurantId,
      event_type: "page_view",
      session_id: sessionId,
      device_type: device,
      user_agent: ua,
      referrer: ref,
    });
  }, [restaurantId]);

  return null;
}

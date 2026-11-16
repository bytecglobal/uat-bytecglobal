"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const initializedRef = useRef(false);

  useEffect(() => {
    // Avoid tracking admin routes to prevent self-polluting analytics
    if (pathname.startsWith("/admin")) return;

    try {
      // 1. Get or create persistent anonymous visitor ID
      let visitorId = localStorage.getItem("bytec_visitor_id");
      if (!visitorId) {
        visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("bytec_visitor_id", visitorId);
      }

      // 2. Get or create session ID (stored in sessionStorage)
      let sessionId = sessionStorage.getItem("bytec_session_id");
      if (!sessionId) {
        sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("bytec_session_id", sessionId);
      }

      // 3. Send page view beacon
      const payload = {
        eventName: "page_view",
        path: pathname,
        visitorId,
        sessionId,
        referrer: document.referrer || "",
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/track", JSON.stringify(payload));
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, [pathname]);

  // Global click listener for important website actions (WhatsApp, Calendly, CTA buttons)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    function handleClick(e) {
      try {
        const target = e.target.closest("a, button");
        if (!target) return;

        const href = target.getAttribute("href") || "";
        const text = (target.textContent || "").trim();

        let eventName = null;
        if (href.includes("wa.me") || target.closest(".vx-whatsapp")) {
          eventName = "whatsapp_click";
        } else if (href.includes("calendly.com") || text.includes("Book a Meeting")) {
          eventName = "meeting_click";
        } else if (text.includes("Let's talk") || text.includes("Start Your Software Project") || text.includes("Start a Project")) {
          eventName = "lets_talk_click";
        } else if (text.includes("See our work") || href.includes("/projects")) {
          eventName = "see_our_work_click";
        }

        if (eventName) {
          const visitorId = localStorage.getItem("bytec_visitor_id");
          const sessionId = sessionStorage.getItem("bytec_session_id");
          const payload = {
            eventName,
            path: window.location.pathname,
            visitorId,
            sessionId,
            metadata: { targetText: text, targetHref: href },
          };

          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/analytics/track", JSON.stringify(payload));
          } else {
            fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              keepalive: true,
            }).catch(() => {});
          }
        }
      } catch {}
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_STORAGE_KEY = "omg3q_visitor_id";
const TRACKING_DEDUPLICATE_WINDOW_MS = 1200;

let lastTrackedPath = "";
let lastTrackedAt = 0;

function getVisitorId() {
  const storedVisitorId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);

  if (storedVisitorId) {
    return storedVisitorId;
  }

  const nextVisitorId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, nextVisitorId);
  return nextVisitorId;
}

function shouldTrackPath(pathname: string | null) {
  return Boolean(
    pathname &&
      pathname.startsWith("/") &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/api")
  );
}

function sendVisit(payload: {
  path: string;
  referrer: string;
  visitorId: string;
}) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], {
      type: "application/json",
    });

    navigator.sendBeacon("/api/analytics/visit", blob);
    return;
  }

  void fetch("/api/analytics/visit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  });
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldTrackPath(pathname)) {
      return;
    }

    const now = Date.now();

    if (
      pathname === lastTrackedPath &&
      now - lastTrackedAt < TRACKING_DEDUPLICATE_WINDOW_MS
    ) {
      return;
    }

    lastTrackedPath = pathname;
    lastTrackedAt = now;

    sendVisit({
      path: pathname,
      referrer: document.referrer,
      visitorId: getVisitorId(),
    });
  }, [pathname]);

  return null;
}

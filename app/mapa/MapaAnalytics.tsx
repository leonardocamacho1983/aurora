"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { trackAurora } from "@/lib/analytics/client";

type MapaEventProperties = {
  source?: string;
  surface?: string;
  focus_key?: string | null;
  focus_confidence?: string | null;
  focus_count?: number;
  entry_count?: number;
  has_focus?: boolean;
  label?: string;
};

export function MapaViewTracker({
  eventName,
  properties,
}: {
  eventName: "product_mapa_viewed" | "product_mapa_focus_viewed";
  properties?: MapaEventProperties;
}) {
  useEffect(() => {
    trackAurora(eventName, properties);
  }, [eventName, properties]);

  return null;
}

export function trackMapaEvent(eventName: string, properties?: MapaEventProperties) {
  trackAurora(eventName, properties);
}

export function MapaTrackedLink({
  children,
  className,
  eventName,
  eventProperties,
  href,
}: {
  children: ReactNode;
  className?: string;
  eventName: string;
  eventProperties?: MapaEventProperties;
  href: string;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => trackMapaEvent(eventName, eventProperties)}
    >
      {children}
    </Link>
  );
}

"use client";

import { useEffect } from "react";
import { trackAurora } from "@/lib/analytics/client";

type TrackPageViewProps = {
  page: string;
  category?: string;
  eventName?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

export function TrackPageView({
  page,
  category = "launch",
  eventName = "launch_page_viewed",
  properties,
}: TrackPageViewProps) {
  useEffect(() => {
    trackAurora(eventName, { page, category, ...properties });
  }, [page, category, eventName, properties]);

  return null;
}

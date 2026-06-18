"use client";

import { useEffect } from "react";
import { trackAurora } from "@/lib/analytics/client";

type TrackPageViewProps = {
  page: string;
  category?: string;
};

export function TrackPageView({ page, category = "launch" }: TrackPageViewProps) {
  useEffect(() => {
    trackAurora("launch_page_viewed", { page, category });
  }, [page, category]);

  return null;
}

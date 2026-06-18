"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackAurora } from "@/lib/analytics/client";

type TrackedLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  eventProperties?: Record<string, string | number | boolean | null | undefined>;
};

export function TrackedLink({ href, className, children, eventProperties }: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackAurora("launch_cta_clicked", eventProperties)}
    >
      {children}
    </Link>
  );
}

"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackAurora } from "@/lib/analytics/client";

type BioLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  label: string;
};

export function BioLink({ children, label, onClick, ...props }: BioLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackAurora("launch_cta_clicked", {
          page: "instagram-bio",
          category: "bio",
          source: "instagram_bio_page",
          label,
        });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}

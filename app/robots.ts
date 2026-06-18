import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/diario-por-voz"],
        disallow: ["/api/", "/admin", "/account", "/login", "/timeline", "/diario", "/orb", "/lista/", "/r/", "/chegada"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}

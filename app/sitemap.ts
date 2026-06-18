import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

const publicRoutes = [
  "/",
  "/manifesto",
  "/privacidade",
  "/termos",
  "/seguranca",
  "/para-terapeutas",
  "/metodo",
  "/aurora-org",
  "/faq",
  "/diario-por-voz",
  "/ia-para-reflexao",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/manifesto" ? 0.9 : 0.75,
  }));
}

import type { Metadata } from "next";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://aurora-five-mauve-57.vercel.app";

export const siteName = "Aurora";

export function absoluteUrl(path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: absoluteUrl(input.path),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: absoluteUrl(input.path),
      siteName,
      type: "website",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Aurora",
  url: siteUrl,
  logo: absoluteUrl("/icon.svg"),
  sameAs: [],
  description:
    "Aurora cria um diário por voz com IA para reflexão pessoal, privacidade e clareza emocional.",
};

export const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Aurora",
  url: siteUrl,
  potentialAction: {
    "@type": "JoinAction",
    target: absoluteUrl("/#lista"),
    name: "Entrar na lista de espera da Aurora",
  },
};

export const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Aurora",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Diário por voz com IA para registrar sentimentos, organizar reflexões e acompanhar padrões pessoais.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/PreOrder",
  },
};

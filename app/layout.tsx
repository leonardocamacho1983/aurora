import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { siteUrl } from "@/lib/seo/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fraunces é variável; carregamos a fonte completa (pesos 400/450 vêm do eixo).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aurora | Diário por voz com IA",
  description: "Um diário por voz com IA para registrar seus dias, organizar sentimentos e perceber padrões com mais clareza.",
  applicationName: "Aurora",
  category: "wellbeing",
  keywords: [
    "diário por voz com IA",
    "diário pessoal com IA",
    "reflexão pessoal",
    "autoconhecimento por voz",
    "organizar sentimentos",
  ],
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Aurora | Diário por voz com IA",
    description: "Fale por alguns minutos. A Aurora organiza seu registro, percebe seu momento e ajuda você a se entender melhor.",
    siteName: "Aurora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurora | Diário por voz com IA",
    description: "Fale por alguns minutos. A Aurora organiza seu registro, percebe seu momento e ajuda você a se entender melhor.",
  },
  appleWebApp: {
    capable: true,
    title: "Aurora",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#181527",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}

import { Hero } from "@/components/landing/Hero";
import { AdaptiveDemo } from "@/components/landing/AdaptiveDemo";
import { Privacidade, ComoFunciona, Features, ParaTerapeutas, Convide, Manifesto, Footer } from "@/components/landing/Sections";
import { AsTelas } from "@/components/landing/AsTelas";
import { CtaFinal } from "@/components/landing/CtaFinal";
import { Reveal } from "@/components/landing/Reveal";

// Home pública (landing / lista de espera). Sem auth.
export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aurora",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description: "Diário por voz com IA para registrar sentimentos, organizar reflexões e acompanhar padrões pessoais.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      availability: "https://schema.org/PreOrder",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ background: "#0A0814", color: "#F0ECF7", overflowX: "hidden" }}>
        <Hero />
        <Reveal><AdaptiveDemo /></Reveal>
        <Reveal><Privacidade /></Reveal>
        <Reveal><ComoFunciona /></Reveal>
        <Reveal><Features /></Reveal>
        <Reveal><AsTelas /></Reveal>
        <Reveal><ParaTerapeutas /></Reveal>
        <Reveal><Convide /></Reveal>
        <Reveal><Manifesto /></Reveal>
        <Reveal><CtaFinal /></Reveal>
        <Footer />
      </div>
    </>
  );
}

import { Hero } from "@/components/landing/Hero";
import { AdaptiveDemo } from "@/components/landing/AdaptiveDemo";
import { Privacidade, ComoFunciona, Features, ParaTerapeutas, Convide, Manifesto, Footer } from "@/components/landing/Sections";
import { AsTelas } from "@/components/landing/AsTelas";
import { CtaFinal } from "@/components/landing/CtaFinal";
import { Reveal } from "@/components/landing/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, softwareJsonLd, webSiteJsonLd } from "@/lib/seo/site";

// Home pública (landing / acesso antecipado). Sem auth.
export default function Home() {
  return (
    <>
      <JsonLd data={[organizationJsonLd, webSiteJsonLd, softwareJsonLd]} />
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

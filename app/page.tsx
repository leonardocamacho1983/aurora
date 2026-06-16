import { Hero } from "@/components/landing/Hero";
import { AdaptiveDemo } from "@/components/landing/AdaptiveDemo";
import { Privacidade, ComoFunciona, Features, ParaTerapeutas, Convide, Manifesto, Footer } from "@/components/landing/Sections";
import { AsTelas } from "@/components/landing/AsTelas";
import { CtaFinal } from "@/components/landing/CtaFinal";

// Home pública (landing / lista de espera). Sem auth.
export default function Home() {
  return (
    <div style={{ background: "#0A0814", color: "#F0ECF7", overflowX: "hidden" }}>
      <Hero />
      <AdaptiveDemo />
      <Privacidade />
      <ComoFunciona />
      <Features />
      <AsTelas />
      <ParaTerapeutas />
      <Convide />
      <Manifesto />
      <CtaFinal />
      <Footer />
    </div>
  );
}

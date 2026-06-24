import type { Metadata } from "next";
import { ResponsivePatternLab } from "@/components/patterns";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, type DesignSystemSearchParams } from "../_shared";
import styles from "../DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Patterns de Tela | Aurora Design System",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PatternsPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.hubHero}>
        <p className={styles.kicker}>Patterns de Tela</p>
        <h1>Responsive Screen Lab para montar telas complexas.</h1>
        <p>
          Mobile, tablet e desktop são composições específicas. Esta aba permite alternar ambiente e cenário antes da migração de Diário, Timeline e Fios.
        </p>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Fase 3.1 pronta"
          title="Patterns montam telas; pages coordenam dados."
          copy="Use os controles para testar Mobile, Tablet e Desktop. Diário começa sem botões e com textura; Resultado espelha produção; Timeline usa FlipCard como padrão; tipografia muda por área com presets do DS."
        />

        <ResponsivePatternLab />
      </section>
    </DesignSystemShell>
  );
}

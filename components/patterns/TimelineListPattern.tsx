import { BottomNav, EmptyState, FlipCard, TimelineEntryCard } from "@/components/product";
import { Button, SegmentedTabs } from "@/components/ui";
import type { PatternScenarioId, PatternTypographySettings, PatternViewport } from "./responsive";
import styles from "./Patterns.module.css";

const navItems = [
  { key: "diary", href: "/diario", label: "Diário", icon: "○" },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: "◔" },
  { key: "account", href: "/account", label: "Perfil", icon: "♙" },
];

type TimelineListPatternProps = {
  viewport?: PatternViewport;
  scenario?: PatternScenarioId;
  typography?: PatternTypographySettings;
};

export function TimelineListPattern({
  viewport = "desktop",
  scenario = "with-flip",
  typography = { title: "editorial", support: "product", reflection: "editorial" },
}: TimelineListPatternProps) {
  const empty = scenario === "empty";
  const noFlip = scenario === "no-flip";
  const filtered = scenario === "filtered";

  return (
    <section
      className={`${styles.patternShell} ${styles.timelinePattern}`}
      data-reflection-typeface={typography.reflection}
      data-scenario={scenario}
      data-support-typeface={typography.support}
      data-title-typeface={typography.title}
      data-viewport={viewport}
      aria-label="Pattern lista de timeline"
    >
      <div className={styles.timelineTop}>
        <div>
          <p className={styles.screenMeta}>Timeline</p>
          <h3>{empty ? "Timeline vazia" : "Registros e devolutivas intercalados"}</h3>
        </div>
        <SegmentedTabs
          defaultValue={filtered ? "mes" : "semana"}
          items={[
            { value: "semana", label: "Semana" },
            { value: "mes", label: "Mês" },
            { value: "tudo", label: "Tudo" },
          ]}
          label="Período da timeline"
        />
      </div>

      {empty ? (
        <EmptyState
          action={<Button variant="secondary">Registrar primeiro momento</Button>}
          title="Seus momentos vão aparecer aqui."
        >
          A timeline começa quando você registra algo no diário. Nada precisa estar pronto antes.
        </EmptyState>
      ) : (
        <div className={styles.timelineList}>
          {noFlip ? (
            <div className={styles.timelineStack}>
              <TimelineEntryCard
                data-typeface={typography.reflection}
                meta={filtered ? "Este mês · 4 registros" : "Hoje · 22:16"}
                mood="sensível"
                actionLabel="Ver tudo"
                active
              >
                Estou há três semanas tentando tomar essa decisão sobre mudar de emprego.
              </TimelineEntryCard>
              <TimelineEntryCard
                author="aurora"
                data-typeface={typography.reflection}
                meta="Aurora"
                mood="padrão"
                actionLabel="Seu registro"
              >
                Você se permitiu sentir essa satisfação hoje. Isso não é pouca coisa.
              </TimelineEntryCard>
            </div>
          ) : (
            <div className={styles.timelineFlipGrid}>
              <FlipCard
                data-typeface={typography.reflection}
                front="Estou há três semanas tentando tomar essa decisão sobre mudar de emprego."
                back="Você volta a esse tema quando está perto de uma decisão importante. Talvez o cansaço esteja pedindo uma escolha menor e mais honesta."
                frontMeta={filtered ? "Este mês · 4 registros" : "Hoje · 22:16"}
                backMeta="Aurora"
                frontSupport="Registro · sensível"
                flipLabel="Ver Aurora"
                returnLabel="Voltar ao registro"
              />
              <FlipCard
                data-typeface={typography.reflection}
                front="A Maia nasceu hoje de manhã. Às 6h14. Olhei para ela e não consegui falar nada. Fiquei só olhando."
                back="Você descreve um momento em que a emoção chegou como presença, não como explosão."
                frontMeta="Seg · 06:32"
                backMeta="Aurora"
                frontSupport="Áudio · 1 min 23 s"
                flipLabel="Ver Aurora"
                returnLabel="Voltar ao registro"
              />
            </div>
          )}
        </div>
      )}

      {viewport === "mobile" ? <BottomNav activeKey="timeline" items={navItems} /> : null}
    </section>
  );
}

import { BottomNav, EmptyState, PrivacyChip } from "@/components/product";
import { Button } from "@/components/ui";
import type { PatternScenarioId, PatternTypographySettings, PatternViewport } from "./responsive";
import styles from "./Patterns.module.css";

const navItems = [
  { key: "diary", href: "/diario", label: "Diário", icon: "○" },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: "◔" },
  { key: "thread", href: "/fios", label: "Fio", icon: "⌁" },
  { key: "profile", href: "/account", label: "Perfil", icon: "♙" },
];

type EmptyThreadPatternProps = {
  viewport?: PatternViewport;
  scenario?: PatternScenarioId;
  typography?: PatternTypographySettings;
};

export function EmptyThreadPattern({
  viewport = "desktop",
  scenario = "no-thread",
  typography = { title: "product", support: "product", reflection: "product" },
}: EmptyThreadPatternProps) {
  const startFromDiary = scenario === "start-from-diary";
  const noContinuity = scenario === "no-continuity";
  const title = startFromDiary
    ? "Comece pelo diário, não pelo fio."
    : noContinuity
      ? "Ainda não existe continuidade clara."
      : "Quando quiser falar, o fio começa aqui.";
  const actionLabel = startFromDiary ? "Abrir diário" : noContinuity ? "Ver timeline" : "Começar pelo diário";

  return (
    <section
      className={`${styles.patternShell} ${styles.emptyThread}`}
      data-reflection-typeface={typography.reflection}
      data-scenario={scenario}
      data-support-typeface={typography.support}
      data-title-typeface={typography.title}
      data-viewport={viewport}
      aria-label="Pattern fio vazio"
    >
      <div className={styles.emptyThreadStack}>
        <PrivacyChip>{viewport === "desktop" ? "anônimo" : "fio privado"}</PrivacyChip>
        <EmptyState
          action={<Button variant={startFromDiary ? "primary" : "secondary"}>{actionLabel}</Button>}
          className={styles.threadEmptyState}
          title={title}
        >
          {noContinuity
            ? "A Aurora pode esperar mais registros antes de sugerir uma pergunta viva."
            : "Nenhum fio precisa nascer pronto. Registre um momento, e a Aurora pode ajudar a encontrar continuidade depois."}
        </EmptyState>
        <p className={styles.helperText}>
          {viewport === "mobile"
            ? "Mobile mantém uma saída principal e navegação inferior."
            : "Use este pattern quando ainda não houver pergunta viva, último momento ou continuidade clara."}
        </p>
      </div>

      <aside className={styles.responsiveContext} aria-label="Regra do estado vazio">
        <p className={styles.screenMeta}>{viewport}</p>
        <p>{startFromDiary ? "A tela convida ao registro antes de criar estrutura." : "O estado vazio evita prometer continuidade artificial."}</p>
      </aside>

      {viewport === "mobile" ? <BottomNav activeKey="thread" items={navItems} /> : null}
    </section>
  );
}

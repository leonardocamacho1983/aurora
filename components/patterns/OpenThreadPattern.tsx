import { BottomNav, ContinueThreadButton, EmptyState, PrivacyChip, StreamingText, ThreadCard } from "@/components/product";
import { Button } from "@/components/ui";
import type { PatternScenarioId, PatternTypographySettings, PatternViewport } from "./responsive";
import styles from "./Patterns.module.css";

const navItems = [
  { key: "diary", href: "/diario", label: "Diário", icon: "○" },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: "◔" },
  { key: "thread", href: "/fios", label: "Fio", icon: "⌁" },
  { key: "profile", href: "/account", label: "Perfil", icon: "♙" },
];

type OpenThreadPatternProps = {
  viewport?: PatternViewport;
  scenario?: PatternScenarioId;
  typography?: PatternTypographySettings;
};

export function OpenThreadPattern({
  viewport = "desktop",
  scenario = "latest",
  typography = { title: "product", support: "product", reflection: "product" },
}: OpenThreadPatternProps) {
  const empty = scenario === "empty";
  const continuing = scenario === "continuing";
  const question = scenario === "question";

  return (
    <section
      className={`${styles.patternShell} ${styles.threadPattern}`}
      data-reflection-typeface={typography.reflection}
      data-scenario={scenario}
      data-support-typeface={typography.support}
      data-title-typeface={typography.title}
      data-viewport={viewport}
      aria-label="Pattern fio aberto"
    >
      <header className={styles.threadTop}>
        <div>
          <p className={styles.screenMeta}>Fio aberto</p>
          <h3>{empty ? "Fio sem continuidade ativa" : "Continuidade sem virar chat"}</h3>
        </div>
        {viewport === "mobile" ? <PrivacyChip>fio</PrivacyChip> : <Button variant="secondary">Ordenar: recente</Button>}
      </header>

      {empty ? (
        <EmptyState
          action={<Button variant="secondary">Voltar aos registros</Button>}
          className={styles.threadEmptyState}
          title="Este fio ainda não encontrou uma pergunta."
        >
          A Aurora pode guardar o último momento sem forçar continuidade antes da hora.
        </EmptyState>
      ) : (
        <div className={styles.threadList}>
          <ThreadCard className={styles.threadEntry} variant="latest" title="Último momento" meta="Registro">
            Voltei da viagem com o Henrique e ainda estou tentando entender o que quero guardar disso.
          </ThreadCard>
          {viewport === "mobile" ? null : (
            <ThreadCard className={styles.threadEntry} title="Padrão do fio" meta="Aurora">
              Você registra presença quando sente que o tempo está passando rápido.
            </ThreadCard>
          )}
          <ThreadCard
            className={styles.threadEntry}
            variant={question ? "question" : "pattern"}
            title="Pergunta viva"
            meta="Aurora"
          >
            O que você quer preservar dessa viagem que ainda não colocou em palavras?
          </ThreadCard>
        </div>
      )}

      {!empty ? (
        <div className={styles.threadQuestion}>
          <StreamingText className={styles.threadStreamingText} streaming={continuing}>
            {continuing
              ? "Aurora está retomando o fio sem transformar isso em conversa infinita."
              : "A próxima entrada pode continuar desse ponto, sem precisar repetir todo o contexto."}
          </StreamingText>
          <ContinueThreadButton state={continuing ? "loading" : "idle"} />
        </div>
      ) : null}

      {viewport === "mobile" ? <BottomNav activeKey="thread" items={navItems} /> : null}
    </section>
  );
}

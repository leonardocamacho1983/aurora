import { Orb } from "@/components/orb/Orb";
import type { PatternScenarioId, PatternTypographySettings, PatternViewport } from "./responsive";
import styles from "./Patterns.module.css";

const starPositions = [
  [8, 12, 0, 1.5],
  [88, 8, 1.2, 1],
  [45, 4, 1.9, 2],
  [72, 18, 0.5, 1],
  [15, 35, 0.8, 1],
  [78, 32, 0.3, 1.5],
  [30, 75, 1.7, 1.5],
  [82, 72, 2.4, 1],
] as const;

type ReflectionResultPatternProps = {
  viewport?: PatternViewport;
  scenario?: PatternScenarioId;
  typography?: PatternTypographySettings;
};

function ProductChrome({ viewport }: { viewport: PatternViewport }) {
  return (
    <>
      <header className={styles.productTopbar}>
        <a className={styles.productBrand} href="/diario" aria-label="Ir para o diário">
          <span className={styles.productBrandOrb} aria-hidden="true" />
          <span>Aurora</span>
        </a>

        <nav className={styles.productSegmented} aria-label="Navegação principal do produto">
          <a href="/diario" aria-current="page">Diário</a>
          <a href="/timeline">Timeline</a>
        </nav>

        <div className={styles.productContext}>
          <span>leonardocamacho</span>
        </div>
      </header>

      {viewport !== "desktop" ? (
        <nav className={styles.productBottomNav} aria-label="Navegação principal">
          <a href="/diario" aria-current="page"><span aria-hidden="true">○</span>Diário</a>
          <a href="/timeline"><span aria-hidden="true">◔</span>Timeline</a>
          <a href="/account"><span aria-hidden="true">♙</span>Perfil</a>
        </nav>
      ) : null}
    </>
  );
}

function StarField() {
  return (
    <div className={styles.diaryStars} aria-hidden="true">
      {starPositions.map(([x, y, delay, size]) => (
        <span
          key={`${x}-${y}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            animationDelay: `${delay}s`,
            animationDuration: `${2.5 + delay * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ReflectionResultPattern({
  viewport = "desktop",
  scenario = "saved",
  typography = { title: "editorial", support: "product", reflection: "editorial" },
}: ReflectionResultPatternProps) {
  const streaming = scenario === "streaming";
  const primaryLabel = scenario === "continue-thread" ? "Continuando este registro" : "Continuar este registro";
  const reflection = streaming
    ? "A Aurora está pensando no que você falou. A devolutiva aparece neste mesmo card quando a leitura estiver pronta."
    : "Aparece um padrão de esperar clareza total antes de agir. Talvez o próximo passo não seja decidir tudo, mas abrir uma conversa menor, com menos performance.";

  return (
    <section
      className={`${styles.patternShell} ${styles.resultPattern}`}
      data-reflection-typeface={typography.reflection}
      data-scenario={scenario}
      data-support-typeface={typography.support}
      data-title-typeface={typography.title}
      data-viewport={viewport}
      aria-label="Pattern resultado de reflexão"
    >
      <StarField />
      <ProductChrome viewport={viewport} />

      <div className={styles.resultExperience}>
        <div className={styles.resultSun}>
          <Orb
            state={streaming ? "reflecting" : "idle"}
            ariaLabel={streaming ? "Aurora está pensando" : "Toque para continuar falando"}
          />
        </div>

        <article className={styles.productionResultCard}>
          <div className={styles.productionResultContent}>
            <span className={styles.resultSparkle} aria-hidden="true">✦</span>
            <div className={styles.productionReflectionReader}>
              <div className={`font-serif ${styles.productionReflectionText}`}>
                <p>{reflection}</p>
              </div>
            </div>

            {!streaming ? (
              <button type="button" className={styles.readMoreAction}>
                Ler devolutiva inteira
              </button>
            ) : null}

            <div className={styles.productionMetaRow}>
              <span className={styles.productionMood}>
                <span aria-hidden="true" />
                sensível
              </span>
            </div>

            <div className={styles.productionActionRow}>
              <button type="button" className={styles.productionPrimaryAction} disabled={streaming}>
                {primaryLabel}
              </button>
              <button type="button" className={styles.productionSecondaryAction}>
                Novo momento
              </button>
              <a href="/timeline" className={styles.productionSoftLink}>Linha do tempo</a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

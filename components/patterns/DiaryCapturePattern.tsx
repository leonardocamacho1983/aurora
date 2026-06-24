import { Orb, type OrbState } from "@/components/orb/Orb";
import { Button } from "@/components/ui";
import type {
  PatternActionMode,
  PatternBackgroundMode,
  PatternScenarioId,
  PatternTypographySettings,
  PatternViewport,
} from "./responsive";
import styles from "./Patterns.module.css";

const navItems = [
  { key: "diary", href: "/diario", label: "Diário", icon: "○" },
  { key: "timeline", href: "/timeline", label: "Timeline", icon: "◔" },
  { key: "account", href: "/account", label: "Perfil", icon: "♙" },
];

const starPositions = [
  [8, 12, 0, 1.5],
  [88, 8, 1.2, 1],
  [45, 4, 1.9, 2],
  [72, 18, 0.5, 1],
  [15, 35, 0.8, 1],
  [78, 32, 0.3, 1.5],
  [5, 48, 1, 1],
  [30, 75, 1.7, 1.5],
  [82, 72, 2.4, 1],
  [18, 58, 3.3, 1.5],
] as const;

type DiaryCapturePatternProps = {
  viewport?: PatternViewport;
  scenario?: PatternScenarioId;
  actionMode?: PatternActionMode;
  backgroundMode?: PatternBackgroundMode;
  typography?: PatternTypographySettings;
};

type DiaryScenarioCopy = {
  orb: OrbState;
  title: string;
  body: string;
  helper: string;
  primary: string;
  secondary: string;
  ariaLabel: string;
};

const defaultDiaryScenario: DiaryScenarioCopy = {
  orb: "idle",
  title: "Leo, o que está vivo agora?",
  body: "Fale sem organizar antes.",
  helper: "Toque para falar",
  primary: "Começar a falar",
  secondary: "Linha do tempo",
  ariaLabel: "Toque para falar",
};

const diaryScenario: Partial<Record<PatternScenarioId, DiaryScenarioCopy>> = {
  idle: defaultDiaryScenario,
  recording: {
    orb: "recording",
    title: "Gravando",
    body: "Pode falar no seu tempo.",
    helper: "Toque no orb de novo para encerrar.",
    primary: "Encerrar e refletir",
    secondary: "Cancelar",
    ariaLabel: "Toque para encerrar a gravação",
  },
  reflecting: {
    orb: "reflecting",
    title: "Aproveite para respirar.",
    body: "A Aurora está pensando no que você falou.",
    helper: "Solte os ombros por um instante.",
    primary: "Aguardar",
    secondary: "Voltar depois",
    ariaLabel: "A Aurora está pensando no que você falou",
  },
  error: {
    orb: "disabled",
    title: "Algo saiu do fluxo.",
    body: "Nada foi perdido. Você pode tentar novamente.",
    helper: "Nada foi perdido.",
    primary: "Tentar novamente",
    secondary: "Linha do tempo",
    ariaLabel: "Estado de erro. Nada foi perdido.",
  },
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
          {navItems.map((item) => (
            <a href={item.href} key={item.key} aria-current={item.key === "diary" ? "page" : undefined}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          ))}
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

export function DiaryCapturePattern({
  viewport = "desktop",
  scenario = "idle",
  actionMode = "minimal",
  backgroundMode = "texture",
  typography = { title: "editorial", support: "product", reflection: "editorial" },
}: DiaryCapturePatternProps) {
  const copy = diaryScenario[scenario] ?? defaultDiaryScenario;
  const showActions = actionMode === "actions";

  return (
    <section
      className={`${styles.patternShell} ${styles.diaryCapture}`}
      data-actions={actionMode}
      data-background={backgroundMode}
      data-reflection-typeface={typography.reflection}
      data-scenario={scenario}
      data-support-typeface={typography.support}
      data-title-typeface={typography.title}
      data-viewport={viewport}
      aria-label="Pattern Diário captura"
    >
      {backgroundMode === "texture" ? <StarField /> : null}
      <ProductChrome viewport={viewport} />

      <div className={styles.diaryExperience}>
        <div className={styles.diaryCopy}>
          <h2 className={styles.diaryTitle}>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>

        <div className={styles.diaryOrbStage}>
          <Orb state={copy.orb} ariaLabel={copy.ariaLabel} />
        </div>

        <p className={scenario === "recording" ? styles.diaryLiveHelper : styles.diaryHelper}>
          {copy.helper}
        </p>

        {showActions ? (
          <div className={styles.diaryActions}>
            <Button disabled={scenario === "reflecting"}>{copy.primary}</Button>
            <Button variant="secondary">{copy.secondary}</Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

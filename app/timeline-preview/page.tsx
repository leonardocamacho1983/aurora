"use client";

import { useState } from "react";
import styles from "./TimelinePreview.module.css";

type PreviewView = "diario" | "feedback" | "timeline" | "fio";
type NavItem = "Diário" | "Timeline" | "Padrões" | "Conta";

function previewViewFromHash(): PreviewView {
  if (typeof window === "undefined") {
    return "diario";
  }

  const hash = window.location.hash.replace("#", "");
  return hash === "feedback" || hash === "timeline" || hash === "timeline-mobile" || hash === "fio"
    ? hash === "timeline-mobile"
      ? "timeline"
      : hash
    : "diario";
}

const moments = [
  ["Momento 1", "A conversa que drenou", "warm"],
  ["Momento 2", "Quando tentei explicar", "blue"],
  ["Momento 3", "O limite ficou claro", "mint"],
  ["Momento 4", "Depois veio descanso", "lavender"],
] as const;

function Brand() {
  return (
    <div className={styles.brand}>
      <span className={styles.brandOrb} aria-hidden="true" />
      <span>Aurora</span>
    </div>
  );
}

function AppNav({ active, onNavigate }: { active: NavItem; onNavigate: (view: PreviewView) => void }) {
  const items = [
    ["○", "Diário", "diario"],
    ["◔", "Timeline", "timeline"],
    ["✧", "Padrões", "timeline"],
    ["♙", "Conta", "timeline"],
  ] as const;

  return (
    <nav className={styles.appNav} aria-label="Navegação principal">
      {items.map(([icon, label, view]) => (
        <button
          className={label === active ? styles.navActive : undefined}
          key={label}
          onClick={() => onNavigate(view)}
          type="button"
        >
          <span aria-hidden="true">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return <span className={active ? styles.pillActive : styles.pill}>{children}</span>;
}

function Action({
  children,
  onClick,
  primary = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button className={primary ? styles.actionPrimary : styles.action} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function DiaryScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className={`${styles.screen} ${styles.diaryScreen}`} id="diario" aria-label="Diário inicial">
      <Brand />
      <span className={styles.clockIcon} aria-hidden="true" />
      <button className={styles.diaryOrbButton} onClick={onStart} type="button" aria-label="Começar entrada">
        <span className={styles.diaryOrb} aria-hidden="true" />
      </button>
      <div className={styles.diaryCopy}>
        <h1>Leo, o que está vivo agora?</h1>
        <p>Fale sem organizar antes.</p>
        <button className={styles.textButton} onClick={onStart} type="button">
          Toque para falar
        </button>
      </div>
    </section>
  );
}

function FeedbackScreen({
  onBack,
  onOpenThread,
  onTimeline,
}: {
  onBack: () => void;
  onOpenThread: () => void;
  onTimeline: () => void;
}) {
  return (
    <section className={`${styles.phoneScreen} ${styles.feedbackScreen}`} id="feedback" aria-label="Feedback Aurora">
      <Brand />
      <span className={styles.clockIcon} aria-hidden="true" />
      <h2>Leitura</h2>
      <div className={styles.segmented}>
        <Pill active>Seu registro</Pill>
        <Pill>Leitura Aurora</Pill>
      </div>
      <article className={styles.readerCard}>
        <p className={styles.cardLabel}>A Aurora percebeu</p>
        <div className={styles.readerText}>
          <p>
            Você parece estar tentando entender o custo de parecer bem quando, por dentro,
            ainda precisava de tempo.
          </p>
          <p>
            O fio não é resolver tudo agora. É guardar esse ponto com cuidado para continuar depois.
          </p>
        </div>
        <p className={styles.readerNote}>Ponto retomável: limite sem ruptura.</p>
      </article>
      <Action onClick={onTimeline} primary>
        Salvar na Timeline
      </Action>
      <div className={styles.twoActions}>
        <Action onClick={onBack}>Voltar</Action>
        <Action onClick={onOpenThread}>Abrir fio</Action>
      </div>
      <AppNav active="Diário" onNavigate={(view) => (view === "diario" ? onBack() : onTimeline())} />
    </section>
  );
}

function TimelineMobile({
  onDiary,
  onOpenThread,
}: {
  onDiary: () => void;
  onOpenThread: () => void;
}) {
  return (
    <section className={`${styles.phoneScreen} ${styles.timelineMobile}`} id="timeline-mobile" aria-label="Timeline mobile populada">
      <h2>Timeline</h2>
      <div className={styles.filterRow}>
        <Pill active>Semana</Pill>
        <Pill>Fios</Pill>
        <Pill>Pontos</Pill>
        <Pill>Sensíveis</Pill>
      </div>

      <article className={`${styles.previewCard} ${styles.heroMemory}`}>
        <div className={styles.metaLine}>
          <span>HOJE · 7 MIN · SENSÍVEL</span>
          <i aria-hidden="true" />
        </div>
        <h3>O peso de parecer bem</h3>
        <p className={styles.quote}>“Eu estava tentando sustentar uma leveza que não era real.”</p>
        <div className={styles.segmentedCompact}>
          <Pill active>Seu registro</Pill>
          <Pill>Aurora</Pill>
        </div>
        <Action onClick={onOpenThread}>Continuar daqui</Action>
      </article>

      <div className={styles.mobileGrid}>
        <article className={styles.previewCard}>
          <p className={styles.cardLabel}>PONTO</p>
          <p>Você tenta continuar disponível antes de descansar.</p>
        </article>
        <article className={styles.previewCard}>
          <p className={styles.cardLabel}>FIO · 3 MOMENTOS</p>
          <h3>Limites e presença</h3>
          <Action onClick={onOpenThread}>Ver fio</Action>
        </article>
      </div>

      <blockquote className={styles.looseQuote}>
        “Talvez o limite não seja uma ruptura. Talvez seja uma forma de continuar presente sem desaparecer.”
      </blockquote>

      <div className={styles.mobileGrid}>
        <article className={styles.previewCard}>
          <p className={styles.cardLabel}>PROTEGIDO</p>
          <h3>Conversa difícil</h3>
          <Action onClick={onOpenThread}>Abrir</Action>
        </article>
        <article className={styles.previewCard}>
          <p className={styles.cardLabel}>PADRÃO</p>
          <p>Depois de nomear o incômodo, aparece mais calma.</p>
        </article>
      </div>

      <article className={`${styles.previewCard} ${styles.simpleMoment}`}>
        <p className={styles.cardLabel}>ONTEM · 4 MIN</p>
        <h3>Uma ideia voltou com mais calma</h3>
        <Action onClick={onOpenThread}>Ler momento</Action>
      </article>
      <AppNav active="Timeline" onNavigate={(view) => (view === "diario" ? onDiary() : undefined)} />
    </section>
  );
}

function TimelineDesktop({ onOpenThread }: { onOpenThread: () => void }) {
  return (
    <section className={`${styles.desktopScreen} ${styles.timelineDesktop}`} id="timeline" aria-label="Timeline desktop populada">
      <header className={styles.previewHeader}>
        <h2>Timeline</h2>
        <p>Um board do diário: memórias, fios e padrões como previews. O texto completo abre no reader.</p>
        <div className={styles.filterRow}>
          <Pill active>Semana</Pill>
          <Pill>Mês</Pill>
          <Pill>Tudo</Pill>
          <Pill>Fios</Pill>
          <Pill>Pontos</Pill>
          <Pill>Sensíveis</Pill>
        </div>
      </header>

      <div className={styles.desktopTimelineLayout}>
        <div className={styles.board}>
          <article className={`${styles.previewCard} ${styles.boardHero}`}>
            <p className={styles.cardLabel}>HOJE · 7 MIN · SENSÍVEL</p>
            <h3>O peso de parecer bem</h3>
            <p className={styles.quote}>“Eu estava tentando sustentar uma leveza que não era real.”</p>
            <div className={styles.segmentedCompact}>
              <Pill active>Seu registro</Pill>
              <Pill>Aurora</Pill>
            </div>
            <Action onClick={onOpenThread}>Continuar daqui</Action>
          </article>

          <article className={`${styles.previewCard} ${styles.boardInsight}`}>
            <p className={styles.cardLabel}>PONTO</p>
            <p>Disponibilidade sem pausa apareceu em três registros.</p>
          </article>

          <article className={`${styles.previewCard} ${styles.boardRecord}`}>
            <p className={styles.cardLabel}>ONTEM · 4 MIN</p>
            <h3>Uma ideia voltou com mais calma</h3>
            <span className={styles.previewLine} />
            <Action onClick={onOpenThread}>Ler momento</Action>
          </article>

          <blockquote className={styles.boardQuote}>
            “Talvez o limite não seja uma ruptura. Talvez seja uma forma de continuar presente sem desaparecer.”
          </blockquote>

          <article className={`${styles.previewCard} ${styles.boardThread}`}>
            <p className={styles.cardLabel}>FIO · 3 MOMENTOS</p>
            <h3>Limites e presença</h3>
            <span className={styles.previewLine} />
            <span className={styles.previewLineShort} />
            <div className={styles.segmentedCompact}>
              <Pill active>Seu registro</Pill>
              <Pill>Aurora</Pill>
            </div>
            <Action onClick={onOpenThread}>Ver fio</Action>
          </article>

          <article className={`${styles.previewCard} ${styles.boardPattern}`}>
            <p className={styles.cardLabel}>PADRÃO</p>
            <p>Depois de nomear o incômodo, aparece mais calma.</p>
          </article>

          <article className={`${styles.previewCard} ${styles.boardProtected}`}>
            <p className={styles.cardLabel}>PROTEGIDO</p>
            <h3>Conversa difícil</h3>
            <span className={styles.previewLineTiny} />
            <Action onClick={onOpenThread}>Abrir</Action>
          </article>

          <article className={`${styles.previewCard} ${styles.boardPhrase}`}>
            <p className={styles.cardLabel}>FRASE</p>
            <h3>Não sumir de si.</h3>
            <Action onClick={onOpenThread}>Ler</Action>
          </article>
        </div>

        <aside className={styles.readerRail}>
          <h3>Reader</h3>
          <p>Abra um card para ler o momento completo sem transformar a Timeline em lista.</p>
          <div className={styles.segmentedCompact}>
            <Pill active>Seu registro</Pill>
            <Pill>Aurora</Pill>
          </div>
          <div className={styles.readerPlaceholder}>
            <span />
            <span />
            <span />
          </div>
          <Action onClick={onOpenThread}>Ler momento</Action>
          <Action onClick={onOpenThread} primary>
            Ler este fio
          </Action>
          <Action onClick={onOpenThread}>Entender padrão</Action>
        </aside>
      </div>
    </section>
  );
}

function FioScreen({ onBackToTimeline }: { onBackToTimeline: () => void }) {
  return (
    <section className={`${styles.desktopScreen} ${styles.fioScreen}`} id="fio" aria-label="Fio aberto">
      <Brand />
      <button className={styles.backButton} onClick={onBackToTimeline} type="button">
        Voltar para Timeline
      </button>
      <h2>Fio aberto</h2>
      <p className={styles.screenSubtitle}>Linha de pensamento: momentos, reader e contexto. Não é chat.</p>

      <div className={styles.fioLayout}>
        <aside className={styles.momentsRail}>
          <h3>Momentos</h3>
          {moments.map(([title, meta, mood], index) => (
            <article className={index === 2 ? styles.momentActive : styles.momentRow} key={title}>
              <i className={styles[mood]} aria-hidden="true" />
              <div>
                <h4>{title}</h4>
                <p>{meta}</p>
              </div>
            </article>
          ))}
        </aside>

        <section className={styles.fioReader}>
          <div className={styles.segmentedCompact}>
            <Pill active>Seu registro</Pill>
            <Pill>Leitura Aurora</Pill>
          </div>
          <h3>Momento selecionado</h3>
          <p>
            Eu percebi que respondi rápido demais, como se a demora fosse uma falha. O que eu queria era ter
            tempo para entender o que aquela conversa tinha mexido em mim.
          </p>
          <div className={styles.readerActions}>
            <Action>Ler este momento</Action>
            <Action primary>Adicionar momento</Action>
          </div>
          <small>Ler este momento abre só o trecho selecionado. Ler este fio reúne todos os momentos.</small>
        </section>

        <aside className={styles.fioContext}>
          <div className={styles.contextHead}>
            <span>Fio</span>
            <a href="#fio">Renomear</a>
          </div>
          <h3>Limites e presença</h3>
          <p>12 jun · 4 momentos</p>
          <article>
            <h4>Ponto de reflexão</h4>
            <p>Limite sem ruptura.</p>
            <small>Aparece só se houver algo retomável.</small>
          </article>
          <article>
            <h4>Leitura mais recente</h4>
            <span className={styles.previewLine} />
          </article>
          <Action primary>Ler este fio</Action>
          <Action>Só registrar novo momento</Action>
        </aside>
      </div>
    </section>
  );
}

export default function TimelinePreviewPage() {
  const [view, setView] = useState<PreviewView>(previewViewFromHash);

  function go(nextView: PreviewView) {
    setView(nextView);
    window.history.replaceState(null, "", `#${nextView}`);
    window.scrollTo({ top: 0, left: 0 });
  }

  return (
    <main className={styles.stage}>
      {view === "diario" ? <DiaryScreen onStart={() => go("feedback")} /> : null}
      {view === "feedback" ? (
        <FeedbackScreen
          onBack={() => go("diario")}
          onOpenThread={() => go("fio")}
          onTimeline={() => go("timeline")}
        />
      ) : null}
      {view === "timeline" ? (
        <>
          <TimelineMobile onDiary={() => go("diario")} onOpenThread={() => go("fio")} />
          <TimelineDesktop onOpenThread={() => go("fio")} />
        </>
      ) : null}
      {view === "fio" ? <FioScreen onBackToTimeline={() => go("timeline")} /> : null}
    </main>
  );
}

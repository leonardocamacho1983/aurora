"use client";

import { useState } from "react";
import { OpenThreadPattern, EmptyThreadPattern, TimelineListPattern } from "@/components/patterns";
import type { PatternScenarioId, PatternViewport } from "@/components/patterns/responsive";
import { ProductNav } from "@/components/product";
import { Button, Chip, SegmentedTabs } from "@/components/ui";
import styles from "./TimelinePreview.module.css";

type PreviewSurface = "timeline" | "fio" | "empty";

const surfaces: Array<{ value: PreviewSurface; label: string }> = [
  { value: "timeline", label: "Timeline" },
  { value: "fio", label: "Fio aberto" },
  { value: "empty", label: "Fio vazio" },
];

const timelineScenarios: Array<{ value: PatternScenarioId; label: string }> = [
  { value: "with-flip", label: "Com flip" },
  { value: "filtered", label: "Filtrada" },
  { value: "empty", label: "Vazia" },
];

const openThreadScenarios: Array<{ value: PatternScenarioId; label: string }> = [
  { value: "latest", label: "Último" },
  { value: "question", label: "Pergunta" },
  { value: "continuing", label: "Continuando" },
];

const emptyThreadScenarios: Array<{ value: PatternScenarioId; label: string }> = [
  { value: "no-thread", label: "Sem fio" },
  { value: "no-continuity", label: "Sem continuidade" },
  { value: "start-from-diary", label: "Começar diário" },
];

const viewports: Array<{ value: PatternViewport; label: string }> = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
];

function getScenarioOptions(surface: PreviewSurface) {
  if (surface === "fio") {
    return openThreadScenarios;
  }

  if (surface === "empty") {
    return emptyThreadScenarios;
  }

  return timelineScenarios;
}

function getDefaultScenario(surface: PreviewSurface): PatternScenarioId {
  return getScenarioOptions(surface)[0].value;
}

export default function TimelinePreviewPage() {
  const [surface, setSurface] = useState<PreviewSurface>("timeline");
  const [viewport, setViewport] = useState<PatternViewport>("desktop");
  const [scenario, setScenario] = useState<PatternScenarioId>("with-flip");

  function changeSurface(nextSurface: string) {
    const parsedSurface = nextSurface as PreviewSurface;

    setSurface(parsedSurface);
    setScenario(getDefaultScenario(parsedSurface));
  }

  return (
    <main className={styles.stage}>
      <ProductNav active="timeline" context="Preview DS" />

      <section className={styles.hero} aria-labelledby="timeline-preview-title">
        <div className={styles.heroCopy}>
          <Chip tone="privacy" withDot>
            Laboratório de contrato
          </Chip>
          <h1 id="timeline-preview-title">Timeline/Fios composto pelo Design System</h1>
          <p>
            Esta rota mostra a regra funcionando: a página coordena cenário, viewport e layout;
            os estados visuais vêm dos patterns e componentes do produto.
          </p>
        </div>

        <aside className={styles.contractCard} aria-label="Contrato aplicado">
          <p>Contrato aplicado</p>
          <ul>
            <li>Sem botão local</li>
            <li>Sem card local</li>
            <li>Sem nav local</li>
            <li>CSS só para shell</li>
          </ul>
        </aside>
      </section>

      <section className={styles.controls} aria-label="Controles de cenário">
        <SegmentedTabs
          items={surfaces}
          label="Superfície de produto"
          layout="wrap"
          onValueChange={changeSurface}
          value={surface}
        />
        <SegmentedTabs
          items={getScenarioOptions(surface)}
          label="Estado da superfície"
          layout="wrap"
          onValueChange={(nextScenario) => setScenario(nextScenario as PatternScenarioId)}
          value={scenario}
        />
        <SegmentedTabs
          items={viewports}
          label="Viewport simulado"
          layout="wrap"
          onValueChange={(nextViewport) => setViewport(nextViewport as PatternViewport)}
          value={viewport}
        />
      </section>

      <section className={styles.previewGrid} data-viewport={viewport} aria-label="Preview composto">
        <div className={styles.previewFrame}>
          {surface === "timeline" ? (
            <TimelineListPattern
              scenario={scenario}
              viewport={viewport}
              typography={{ title: "product", support: "product", reflection: "editorial" }}
            />
          ) : null}

          {surface === "fio" ? (
            <OpenThreadPattern
              scenario={scenario}
              viewport={viewport}
              typography={{ title: "product", support: "product", reflection: "product" }}
            />
          ) : null}

          {surface === "empty" ? (
            <EmptyThreadPattern
              scenario={scenario}
              viewport={viewport}
              typography={{ title: "product", support: "product", reflection: "product" }}
            />
          ) : null}
        </div>

        <aside className={styles.map} aria-label="Mapa de composição">
          <h2>Mapa</h2>
          <dl>
            <div>
              <dt>Rota</dt>
              <dd>/timeline-preview</dd>
            </div>
            <div>
              <dt>Superfície</dt>
              <dd>Timeline-Fio</dd>
            </div>
            <div>
              <dt>Fonte DS</dt>
              <dd>{surface === "timeline" ? "TimelineListPattern" : surface === "fio" ? "OpenThreadPattern" : "EmptyThreadPattern"}</dd>
            </div>
            <div>
              <dt>CSS da rota</dt>
              <dd>Shell, grid, espaçamento e responsividade</dd>
            </div>
          </dl>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setSurface("timeline");
              setScenario("with-flip");
              setViewport("desktop");
            }}
          >
            Resetar cenário
          </Button>
        </aside>
      </section>
    </main>
  );
}

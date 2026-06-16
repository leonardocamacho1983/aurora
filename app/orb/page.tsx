"use client";

import { useState } from "react";
import { Orb, type OrbState } from "@/components/orb/Orb";

const STATES: OrbState[] = ["idle", "recording", "reflecting", "saved", "disabled"];
const LABEL: Record<OrbState, string> = {
  idle: "Repousa",
  recording: "Floresce",
  reflecting: "Gira",
  saved: "Exala",
  disabled: "Desabilitado",
};

const btn = (active: boolean): React.CSSProperties => ({
  minHeight: 44,
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--hairline)",
  background: active ? "var(--accent)" : "var(--raised)",
  color: active ? "#1b1830" : "var(--ink)",
  fontSize: "1rem",
  cursor: "pointer",
});

/**
 * Preview do componente Orb — temporário, sem ligação com as rotas/dados.
 * Será removido quando a tela real de Início assumir. Inofensivo (só visual).
 */
export default function OrbPreviewPage() {
  const [state, setState] = useState<OrbState>("idle");

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-6)",
        padding: "var(--space-5)",
      }}
    >
      <Orb state={state} onClick={() => {}} />

      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {STATES.map((s) => (
          <button key={s} style={btn(s === state)} onClick={() => setState(s)}>
            {LABEL[s]}
          </button>
        ))}
      </div>

      <p style={{ color: "var(--ink-faint)", maxWidth: "42ch", textAlign: "center", margin: 0 }}>
        Preview do componente Orb (sem ligação com as rotas). Estado: {LABEL[state]}.
      </p>
    </main>
  );
}

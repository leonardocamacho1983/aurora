"use client";

import { useId } from "react";
import styles from "./Orb.module.css";

export type OrbState = "idle" | "recording" | "reflecting" | "saved" | "disabled";

// aria-label por estado (§2/§6). Pode ser sobrescrito (ex.: nome do humor no "salvo").
const DEFAULT_LABEL: Record<OrbState, string> = {
  idle: "Toque para falar",
  recording: "Toque para parar",
  reflecting: "A Aurora está pensando no que você falou",
  saved: "Salvo",
  disabled: "Indisponível",
};

export interface OrbProps {
  state?: OrbState;
  onClick?: () => void;
  /** Sobrescreve o aria-label (ex.: o nome do humor no estado "salvo"). */
  ariaLabel?: string;
  /** 13 níveis 0..1 reativos ao áudio (estado "recording"). Opcional. */
  audioLevels?: number[];
  /** Sol puramente decorativo: sem botão, sem foco, sem ação. */
  decorative?: boolean;
}

/**
 * Orb — assinatura da Aurora (Design System v0.1 §5, handoff §7).
 * Máquina de estados visual: repousa · floresce · respira/pensa · exala · desabilitado.
 * Botão real, focável, aria-label por estado. Respeita prefers-reduced-motion.
 * NÃO está ligado às rotas — só o componente.
 */
export function Orb({ state = "idle", onClick, ariaLabel, audioLevels, decorative }: OrbProps) {
  const grainId = useId();
  const interactive = state === "idle" || state === "recording";
  const label = ariaLabel ?? DEFAULT_LABEL[state];

  const inner = (
    <>
      <span className={styles.halo} aria-hidden="true" />

      {/* anéis do "floresce" (gravando) — vendem o tamanho */}
      <span className={styles.rings} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.ring} />
        <span className={styles.ring} />
      </span>

      <span className={styles.core} aria-hidden="true">
        {/* luz interna lenta no estado respira/pensa (refletindo) */}
        <span className={styles.conic} />
        <span className={styles.spiral} aria-hidden="true">
          <span className={styles.spiralLayer} />
          <span className={styles.spiralLayer} />
          <span className={styles.spiralCurl}>
            <span />
          </span>
          <span className={styles.spiralEye} />
        </span>
        {/* grão (feTurbulence) — todos os estados mantêm o grão */}
        <svg className={styles.grain} aria-hidden="true" focusable="false">
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>
      </span>

      {/* waveform do "floresce" (13 barras) */}
      <span className={styles.waveform} aria-hidden="true">
        {Array.from({ length: 13 }).map((_, i) => (
          <span
            key={i}
            className={styles.bar}
            style={
              audioLevels && audioLevels[i] != null
                ? { transform: `scaleY(${Math.max(0.15, Math.min(1, audioLevels[i]))})` }
                : { animationDelay: `${(i % 7) * 0.08}s` }
            }
          />
        ))}
      </span>
    </>
  );

  if (decorative) {
    return (
      <span className={`${styles.orb} ${styles[state]}`} aria-hidden="true" style={{ pointerEvents: "none" }}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.orb} ${styles[state]}`}
      onClick={onClick}
      disabled={!interactive}
      aria-label={label}
      aria-busy={state === "reflecting"}
    >
      {inner}
    </button>
  );
}

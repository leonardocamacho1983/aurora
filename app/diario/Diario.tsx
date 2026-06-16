"use client";

import { useRef, useState } from "react";
import { Orb, type OrbState } from "@/components/orb/Orb";
import {
  CrisisResources,
  type CrisisResourcesData,
} from "@/components/sheets/CrisisResources";
import styles from "./Diario.module.css";

type Phase = "idle" | "recording" | "reflecting" | "reflection" | "crisis" | "error";

type ReflectResponse =
  | { status: "ok"; risk: string; reflection: string; mood: string | null; entryId: string }
  | { status: "crisis"; risk: "high"; type: string; resources: CrisisResourcesData; entryId: string }
  | { error: string };

const PROMPT_DO_DIA = "O que está vivo em você agora?";

const MOOD_COLOR: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensível: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

const ORB_STATE: Record<Phase, OrbState> = {
  idle: "idle",
  recording: "recording",
  reflecting: "reflecting",
  reflection: "idle", // sol calmo atrás do card
  crisis: "disabled",
  error: "idle",
};

const HELPER: Record<Phase, string> = {
  idle: "Toque para falar",
  recording: "Gravando… toque para parar",
  reflecting: "Refletindo…",
  reflection: "",
  crisis: "",
  error: "Algo deu errado",
};

// Converte ênfase em markdown (*x* / _x_ / **x**) em itálico/negrito — a reflexão
// nunca mostra asteriscos crus. Sem HTML perigoso: monta nós React.
function renderInline(text: string, kp: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const isStrong = m[1] != null;
    const content = m[1] ?? m[2] ?? m[3] ?? "";
    nodes.push(
      isStrong ? (
        <strong key={`${kp}-${i}`}>{content}</strong>
      ) : (
        <em key={`${kp}-${i}`}>{content}</em>
      ),
    );
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderProse(text: string): React.ReactNode {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, idx) => (
      <p key={idx} style={{ margin: 0 }}>
        {renderInline(p.replace(/\n/g, " "), `p${idx}`)}
      </p>
    ));
}

export function Diario() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reflection, setReflection] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<CrisisResourcesData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function resetToIdle() {
    setPhase("idle");
    setReflection(null);
    setMood(null);
    setCrisis(null);
    setErrorMsg(null);
  }

  function fail(message: string) {
    setErrorMsg(message);
    setPhase("error");
  }

  async function onOrbClick() {
    if (phase === "recording") {
      stopRecording();
      return;
    }
    if (phase === "reflecting") return; // ocupado
    await startRecording(); // idle | error | reflection (gravar mais)
  }

  async function startRecording() {
    setErrorMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      fail("Seu navegador não permite gravar áudio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await transcribeAndReflect(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
    } catch {
      fail("Não consegui acessar o microfone. Verifique a permissão.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setPhase("reflecting");
  }

  async function transcribeAndReflect(blob: Blob) {
    setPhase("reflecting");
    try {
      const form = new FormData();
      form.append("audio", new File([blob], "audio.webm", { type: blob.type || "audio/webm" }));
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      const tData = (await tRes.json()) as { transcript?: string; language?: string | null };
      if (!tRes.ok || !tData.transcript) {
        fail("Não consegui transcrever o áudio. Tente de novo.");
        return;
      }
      await reflectOn(tData.transcript, tData.language ?? null);
    } catch {
      fail("Falha de conexão ao transcrever.");
    }
  }

  async function reflectOn(transcript: string, language: string | null) {
    try {
      const rRes = await fetch("/api/reflect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript, language, locale: "pt-BR" }),
      });
      const data = (await rRes.json()) as ReflectResponse;
      if (!rRes.ok || "error" in data) {
        fail("A Aurora não conseguiu responder agora. Tente de novo.");
        return;
      }
      if (data.status === "crisis") {
        setCrisis(data.resources);
        setPhase("crisis");
        return;
      }
      setReflection(data.reflection);
      setMood(data.mood);
      setPhase("reflection");
    } catch {
      fail("Falha de conexão ao refletir.");
    }
  }

  return (
    <main className={styles.stage}>
      {phase !== "reflection" ? (
        <div className={styles.center}>
          {(phase === "idle" || phase === "recording" || phase === "reflecting") && (
            <p
              className="font-serif"
              style={{ fontSize: "1.35rem", color: "var(--ink)", maxWidth: "24ch", margin: 0 }}
            >
              {PROMPT_DO_DIA}
            </p>
          )}

          <Orb state={ORB_STATE[phase]} onClick={onOrbClick} />

          {HELPER[phase] && <p style={{ color: "var(--ink-soft)", margin: 0 }}>{HELPER[phase]}</p>}

          {phase === "error" && errorMsg && (
            <p role="alert" style={{ color: "var(--alert)", margin: 0 }}>
              {errorMsg}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.composition}>
          <div className={styles.inner}>
            <div className={styles.sun}>
              <Orb state="idle" onClick={onOrbClick} ariaLabel="Toque para continuar falando" />
            </div>

            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div
                  className="font-serif"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                    fontSize: "1.2rem",
                    lineHeight: 1.6,
                    color: "var(--ink)",
                  }}
                >
                  {reflection && renderProse(reflection)}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    flexWrap: "wrap",
                  }}
                >
                  {mood ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        color: "var(--ink-soft)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: MOOD_COLOR[mood] ?? "var(--ink-faint)",
                        }}
                      />
                      {mood}
                    </span>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onClick={resetToIdle}
                    style={{
                      minHeight: 44,
                      padding: "var(--space-2) var(--space-3)",
                      background: "transparent",
                      border: "none",
                      color: "var(--ink-faint)",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    Concluir
                  </button>
                </div>

                <p style={{ color: "var(--ink-faint)", fontSize: "0.85rem", margin: 0 }}>
                  Toque no orb para continuar falando.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "crisis" && crisis && (
        <CrisisResources data={crisis} onClose={resetToIdle} />
      )}
    </main>
  );
}

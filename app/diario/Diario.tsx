"use client";

import { useRef, useState } from "react";
import { Orb, type OrbState } from "@/components/orb/Orb";
import {
  CrisisResources,
  type CrisisResourcesData,
} from "@/components/sheets/CrisisResources";

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
  reflection: "saved",
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
    if (phase === "idle" || phase === "error") {
      await startRecording();
    } else if (phase === "recording") {
      stopRecording();
    }
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
      const tData = (await tRes.json()) as { transcript?: string; language?: string | null; error?: string };
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
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-6)",
        padding: "var(--space-5)",
        textAlign: "center",
      }}
    >
      {(phase === "idle" || phase === "recording" || phase === "reflecting") && (
        <p
          className="font-serif"
          style={{ fontSize: "1.35rem", color: "var(--ink)", maxWidth: "24ch", margin: 0 }}
        >
          {PROMPT_DO_DIA}
        </p>
      )}

      <Orb state={ORB_STATE[phase]} onClick={onOrbClick} />

      {HELPER[phase] && (
        <p style={{ color: "var(--ink-soft)", margin: 0 }}>{HELPER[phase]}</p>
      )}

      {phase === "error" && errorMsg && (
        <p role="alert" style={{ color: "var(--alert)", margin: 0 }}>
          {errorMsg}
        </p>
      )}

      {/* Reflexão (cartão) — Fraunces, glifo de orb, sem "IA:" */}
      {phase === "reflection" && reflection && (
        <section
          style={{
            maxWidth: 460,
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-lg)",
            padding: "var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            textAlign: "left",
          }}
        >
          <p
            className="font-serif"
            style={{ margin: 0, fontSize: "1.15rem", lineHeight: 1.5, whiteSpace: "pre-line" }}
          >
            {reflection}
          </p>

          {mood && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                alignSelf: "flex-start",
                color: "var(--ink-soft)",
                fontSize: "0.9rem",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: MOOD_COLOR[mood] ?? "var(--ink-faint)",
                }}
              />
              {mood}
            </span>
          )}

          <button
            type="button"
            onClick={resetToIdle}
            style={{
              minHeight: 44,
              padding: "var(--space-3) var(--space-5)",
              borderRadius: "var(--r-pill)",
              border: "1px solid var(--hairline)",
              background: "var(--raised)",
              color: "var(--ink)",
              fontSize: "1rem",
              cursor: "pointer",
              alignSelf: "center",
            }}
          >
            Concluir
          </button>
        </section>
      )}

      {phase === "crisis" && crisis && (
        <CrisisResources data={crisis} onClose={resetToIdle} />
      )}
    </main>
  );
}

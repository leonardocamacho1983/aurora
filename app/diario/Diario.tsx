"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Orb, type OrbState } from "@/components/orb/Orb";
import {
  CrisisResources,
  type CrisisResourcesData,
} from "@/components/sheets/CrisisResources";
import { renderProse } from "@/lib/render-prose";
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
  recording: "Gravando. Toque para parar",
  reflecting: "A Aurora está organizando sua fala",
  reflection: "",
  crisis: "",
  error: "Algo deu errado",
};

export function Diario({ userEmail = "" }: { userEmail?: string }) {
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

  const accountLabel = userEmail ? userEmail.split("@")[0] : "Conta";
  const isActive = phase === "recording" || phase === "reflecting";

  return (
    <main className={styles.stage}>
      <nav className={styles.nav} aria-label="Navegação do diário">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          <span>Aurora</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/timeline">Linha</Link>
          <Link href="/account">{accountLabel}</Link>
        </div>
      </nav>

      {phase !== "reflection" ? (
        <div className={styles.center}>
          <div className={styles.copy}>
            <p className={styles.kicker}>{isActive ? "Agora" : "Diário por voz"}</p>
            <h1 className="font-serif">{PROMPT_DO_DIA}</h1>
            <p>
              Fale por alguns minutos. Não precisa organizar antes, encontrar a frase certa ou explicar tudo.
            </p>
          </div>

          {(phase === "idle" || phase === "recording" || phase === "reflecting") && (
            <div className={styles.orbStage}>
              <Orb state={ORB_STATE[phase]} onClick={onOrbClick} />
            </div>
          )}

          {HELPER[phase] && (
            <p className={phase === "recording" ? styles.liveHelper : styles.helper}>
              {HELPER[phase]}
            </p>
          )}

          {phase === "error" && errorMsg && (
            <p role="alert" className={styles.error}>
              {errorMsg}
            </p>
          )}

          {phase === "idle" && (
            <div className={styles.quickGrid} aria-label="O que acontece no diário">
              <span>Sem digitar</span>
              <span>Registro privado</span>
              <Link href="/timeline">Ver linha do tempo</Link>
            </div>
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
                <p className={styles.kicker}>Reflexão</p>
                <div
                  className={`font-serif ${styles.reflectionText}`}
                >
                  {reflection && renderProse(reflection)}
                </div>

                <div className={styles.metaRow}>
                  {mood ? (
                    <span className={styles.mood}>
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

                  <Link href="/timeline" className={styles.softLink}>Ver linha do tempo</Link>
                </div>

                <div className={styles.actionRow}>
                  <button type="button" onClick={onOrbClick} className={styles.primaryAction}>
                    Falar mais
                  </button>
                  <button type="button" onClick={resetToIdle} className={styles.secondaryAction}>
                    Concluir
                  </button>
                </div>
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

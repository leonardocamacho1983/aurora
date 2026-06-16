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

const MOODS = ["leve", "calmo", "pesado", "sensível", "ansioso"] as const;
type Mood = (typeof MOODS)[number];

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

// Converte ênfase em markdown (*x* / _x_ / **x**) em itálico/negrito — para a
// reflexão nunca mostrar asteriscos crus. Sem HTML perigoso: monta nós React.
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

const pillButton: React.CSSProperties = {
  minHeight: 44,
  padding: "var(--space-3) var(--space-5)",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--hairline)",
  fontSize: "1rem",
  cursor: "pointer",
};

export function Diario() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reflection, setReflection] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<CrisisResourcesData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edição inline (Parte 2)
  const [entryId, setEntryId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function resetToIdle() {
    setPhase("idle");
    setReflection(null);
    setCrisis(null);
    setErrorMsg(null);
    setEntryId(null);
    setDraftText("");
    setMood(null);
    setSaved(false);
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
      const tData = (await tRes.json()) as {
        transcript?: string;
        language?: string | null;
        error?: string;
      };
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
      setEntryId(data.entryId);
      setDraftText(transcript);
      setMood((data.mood as Mood | null) ?? null);
      setSaved(false);
      setPhase("reflection");
    } catch {
      fail("Falha de conexão ao refletir.");
    }
  }

  async function save() {
    if (!entryId) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: draftText, mood }),
      });
      if (!res.ok) {
        fail("Não consegui salvar suas alterações. Tente de novo.");
        return;
      }
      setSaved(true);
    } catch {
      fail("Falha de conexão ao salvar.");
    } finally {
      setSaving(false);
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

      {/* Reflexão + edição inline */}
      {phase === "reflection" && reflection && (
        <section
          style={{
            maxWidth: 520,
            width: "100%",
            background: "var(--surface)",
            borderRadius: "var(--r-lg)",
            padding: "var(--space-6) var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
            textAlign: "left",
            boxShadow: "0 1px 48px rgba(0, 0, 0, 0.28)",
          }}
        >
          {/* glifo do orb */}
          <span
            aria-hidden="true"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--aurora)",
              alignSelf: "flex-start",
            }}
          />

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
            {renderProse(reflection)}
          </div>

          <hr style={{ width: "100%", border: "none", borderTop: "1px solid var(--hairline)", margin: 0 }} />

          {/* transcrição editável */}
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Sua entrada</span>
            <textarea
              value={draftText}
              onChange={(e) => {
                setDraftText(e.target.value);
                setSaved(false);
              }}
              rows={3}
              style={{
                width: "100%",
                padding: "var(--space-3)",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--hairline)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontSize: "1rem",
                resize: "vertical",
              }}
            />
          </label>

          {/* humor (chips) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Como você nomearia isso?</span>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {MOODS.map((m) => {
                const active = mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setMood(active ? null : m);
                      setSaved(false);
                    }}
                    style={{
                      ...pillButton,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      background: active ? MOOD_COLOR[m] : "var(--raised)",
                      color: active ? "#1b1830" : "var(--ink)",
                      borderColor: active ? MOOD_COLOR[m] : "var(--hairline)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: active ? "#1b1830" : MOOD_COLOR[m],
                      }}
                    />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                ...pillButton,
                background: "var(--accent)",
                color: "#1b1830",
                borderColor: "var(--accent)",
              }}
            >
              {saving ? "Salvando…" : saved ? "Salvo ✓" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={resetToIdle}
              style={{ ...pillButton, background: "var(--raised)", color: "var(--ink)" }}
            >
              Concluir
            </button>
          </div>
        </section>
      )}

      {phase === "crisis" && crisis && (
        <CrisisResources data={crisis} onClose={resetToIdle} />
      )}
    </main>
  );
}

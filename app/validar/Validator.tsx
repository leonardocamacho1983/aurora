"use client";

import { useRef, useState } from "react";

// Contratos reais das rotas (ver app/api/*/route.ts).
type TranscribeResponse =
  | { transcript: string; language: string | null }
  | { error: string };

type CrisisResources = {
  locale: string;
  message: string;
  lines: { name: string; contact: string; note?: string }[];
  disclaimer: string;
};

type ReflectResponse =
  | { status: "ok"; risk: string; reflection: string; mood: string | null; entryId: string }
  | { status: "crisis"; risk: "high"; type: string; resources: CrisisResources; entryId: string }
  | { error: string };

const EXEMPLO_CRISE = "Não aguento mais viver, queria sumir pra sempre e acabar com tudo.";
const EXEMPLO_COMUM = "Tive um dia corrido mas tranquilo; saí pra caminhar à tarde.";

const btn: React.CSSProperties = {
  minHeight: 44,
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--hairline)",
  background: "var(--raised)",
  color: "var(--ink)",
  fontSize: "1rem",
  cursor: "pointer",
};

const box: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  padding: "var(--space-4)",
  marginTop: "var(--space-4)",
};

const pre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.8rem",
  color: "var(--ink-soft)",
  margin: 0,
};

export function Validator({ email }: { email: string }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [transcribeRaw, setTranscribeRaw] = useState<unknown>(null);
  const [reflectRaw, setReflectRaw] = useState<unknown>(null);
  const [reflect, setReflect] = useState<ReflectResponse | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function reset() {
    setError(null);
    setTranscribeRaw(null);
    setReflectRaw(null);
    setReflect(null);
    setTranscript(null);
  }

  async function callReflect(transcriptText: string, language: string | null) {
    setBusy(true);
    try {
      const res = await fetch("/api/reflect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, language, locale: "pt-BR" }),
      });
      const data = (await res.json()) as ReflectResponse;
      setReflectRaw(data);
      if (!res.ok || "error" in data) {
        setError(`/api/reflect falhou (HTTP ${res.status}): ${JSON.stringify(data)}`);
        setReflect(null);
      } else {
        setReflect(data);
      }
    } catch (e) {
      setError(`/api/reflect erro de rede: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    reset();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador não suporta gravação de áudio (getUserMedia).");
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
        await transcribeThenReflect(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e) {
      setError(`Não consegui acessar o microfone: ${String(e)}`);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribeThenReflect(blob: Blob) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append(
        "audio",
        new File([blob], "audio.webm", { type: blob.type || "audio/webm" }),
      );
      // SEM storagePath: áudio enviado inline, nunca persistido (§10).
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await res.json()) as TranscribeResponse;
      setTranscribeRaw(data);
      if (!res.ok || "error" in data) {
        setError(`/api/transcribe falhou (HTTP ${res.status}): ${JSON.stringify(data)}`);
        return;
      }
      setTranscript(data.transcript);
      await callReflect(data.transcript, data.language);
    } catch (e) {
      setError(`/api/transcribe erro de rede: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendText() {
    reset();
    if (!text.trim()) {
      setError("Digite uma frase primeiro.");
      return;
    }
    setTranscript(text.trim());
    await callReflect(text.trim(), "pt-BR");
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "var(--space-5)" }}>
      <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Validação (debug)</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-2)" }}>
        Ferramenta de teste — não é o app. Logado como {email}.
      </p>

      {/* CAMINHO DE VOZ */}
      <section style={box} aria-labelledby="voz">
        <h2 id="voz" style={{ fontSize: "1rem", marginTop: 0 }}>
          1) Caminho de voz
        </h2>
        <button
          style={{ ...btn, background: recording ? "var(--alert)" : "var(--raised)" }}
          onClick={recording ? stopRecording : startRecording}
          disabled={busy && !recording}
          aria-label={recording ? "Parar gravação" : "Gravar áudio"}
        >
          {recording ? "■ Parar e transcrever" : "● Gravar"}
        </button>
        <p style={{ color: "var(--ink-faint)", fontSize: "0.85rem" }}>
          Fala algo, para, e a tela transcreve e reflete automaticamente.
        </p>
      </section>

      {/* CAMINHO DE TEXTO */}
      <section style={box} aria-labelledby="texto">
        <h2 id="texto" style={{ fontSize: "1rem", marginTop: 0 }}>
          2) Caminho de texto (pula a gravação)
        </h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Digite uma frase para enviar ao /api/reflect"
          style={{
            width: "100%",
            padding: "var(--space-3)",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--hairline)",
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: "1rem",
          }}
        />
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
          <button style={btn} onClick={() => setText(EXEMPLO_CRISE)}>
            Preencher: frase de crise
          </button>
          <button style={btn} onClick={() => setText(EXEMPLO_COMUM)}>
            Preencher: frase comum
          </button>
          <button style={{ ...btn, background: "var(--accent)", color: "#1b1830" }} onClick={sendText} disabled={busy}>
            Enviar texto → /api/reflect
          </button>
        </div>
      </section>

      {busy && <p style={{ marginTop: "var(--space-4)" }}>Processando…</p>}

      {/* ERRO (fail-loud) */}
      {error && (
        <section style={{ ...box, borderColor: "var(--alert)" }} role="alert">
          <h2 style={{ fontSize: "1rem", marginTop: 0, color: "var(--alert)" }}>Erro</h2>
          <p style={pre}>{error}</p>
        </section>
      )}

      {/* TRANSCRIÇÃO */}
      {transcript !== null && (
        <section style={box}>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Transcrição / entrada</h2>
          <p style={{ margin: 0 }}>{transcript}</p>
        </section>
      )}

      {/* RESULTADO DO /api/reflect */}
      {reflect && "status" in reflect && reflect.status === "crisis" && (
        <section style={{ ...box, borderColor: "var(--alert)" }} role="alert">
          <h2 style={{ fontSize: "1rem", marginTop: 0, color: "var(--alert)" }}>
            ⚠️ Protocolo de crise (sem reflexão) — risk: {reflect.risk}, tipo: {reflect.type}
          </h2>
          <p style={{ margin: 0 }}>{reflect.resources.message}</p>
          <ul>
            {reflect.resources.lines.map((l) => (
              <li key={l.name}>
                <strong>{l.name}: {l.contact}</strong>
                {l.note ? ` — ${l.note}` : ""}
              </li>
            ))}
          </ul>
          <p style={{ color: "var(--ink-soft)", margin: 0 }}>{reflect.resources.disclaimer}</p>
        </section>
      )}

      {reflect && "status" in reflect && reflect.status === "ok" && (
        <section style={box}>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>
            Reflexão — risk: {reflect.risk}, humor: {reflect.mood ?? "—"}
          </h2>
          <p className="font-serif" style={{ margin: 0, fontSize: "1.05rem" }}>
            {reflect.reflection}
          </p>
        </section>
      )}

      {/* RETORNO CRU (debug) */}
      {(transcribeRaw !== null || reflectRaw !== null) && (
        <section style={box}>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Retorno cru (debug)</h2>
          {transcribeRaw !== null && (
            <>
              <p style={{ margin: 0, color: "var(--ink-faint)" }}>/api/transcribe:</p>
              <pre style={pre}>{JSON.stringify(transcribeRaw, null, 2)}</pre>
            </>
          )}
          {reflectRaw !== null && (
            <>
              <p style={{ margin: "var(--space-3) 0 0", color: "var(--ink-faint)" }}>/api/reflect:</p>
              <pre style={pre}>{JSON.stringify(reflectRaw, null, 2)}</pre>
            </>
          )}
        </section>
      )}
    </main>
  );
}

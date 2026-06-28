"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Orb, type OrbState } from "@/components/orb/Orb";
import { PmfPrompt } from "@/components/product/PmfPrompt";
import { ProductNav } from "@/components/product/ProductNav";
import {
  CrisisResources,
  type CrisisResourcesData,
} from "@/components/sheets/CrisisResources";
import { trackAurora } from "@/lib/analytics/client";
import { renderProse } from "@/lib/render-prose";
import type { OnboardingProfile } from "@/lib/onboarding/context";
import styles from "./Diario.module.css";

type Phase = "idle" | "recording" | "reflecting" | "reflection" | "crisis" | "error";

type ReflectResponse =
  | {
      status: "ok";
      risk: string;
      reflection: string;
      mood: string | null;
      entryId: string;
      threadId?: string | null;
      requestId?: string;
      fallbackSaved?: boolean;
      intent?: string;
    }
  | {
      status: "crisis";
      risk: "high";
      type: string;
      resources: CrisisResourcesData;
      entryId: string;
      threadId?: string | null;
      requestId?: string;
      intent?: string;
    }
  | {
      error: string;
      errorCode?: string;
      errorClass?: string;
      retryable?: boolean;
      requestId?: string;
      userMessage?: string;
      entryId?: string;
    };

type TranscribeResponse =
  | { transcript: string; language?: string | null; entryId?: string; segmentId?: string; requestId?: string }
  | {
      error: string;
      errorCode?: string;
      errorClass?: string;
      retryable?: boolean;
      requestId?: string;
      userMessage?: string;
      entryId?: string;
      segmentId?: string;
    };

type EntryMode = "new" | "continue" | "reformulate";

type ActiveRecorder = {
  mimeType: string;
  stop: () => Promise<Blob>;
};

type RetryPayload = {
  blob: Blob;
  entryId?: string;
  entryMode: EntryMode;
  durationBucket: string;
  attempt: number;
};

const DEFAULT_PROMPT = "O que está vivo agora?";
const STOP_RECORDING_TIMEOUT_MS = 8000;
const TRANSCRIBE_TIMEOUT_MS = 45000;
const REFLECT_TIMEOUT_MS = 45000;
const MAX_TRANSCRIPTION_ATTEMPTS = 3;

function trackProduct(
  eventName: string,
  properties: Record<string, string | number | boolean | null | undefined>,
  distinctId?: string,
) {
  trackAurora(
    eventName,
    {
      source_type: "product",
      ...properties,
    },
    distinctId ? { distinctId } : undefined,
  );
}

function createClientRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function retryDelayForAttempt(attempt: number) {
  if (attempt <= 2) return 1500;
  return 4000;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const REFLECTING_HELPERS = [
  "Solte os ombros por um instante.",
  "Sinta os pés no chão.",
  "Se puder, tome um copo d'água.",
  "Olhe pela janela por alguns segundos.",
  "Deixe a respiração ficar um pouco mais lenta.",
];

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

const STARS = [
  [8, 12, 0, 1.5],
  [88, 8, 1.2, 1],
  [25, 6, 2.8, 1.5],
  [72, 18, 0.5, 1],
  [45, 4, 1.9, 2],
  [92, 28, 3.1, 1],
  [15, 35, 0.8, 1],
  [60, 9, 2.2, 1.5],
  [38, 22, 1.5, 1],
  [78, 32, 0.3, 1.5],
  [52, 16, 2, 1],
  [5, 48, 1, 1],
  [30, 75, 1.7, 1.5],
  [65, 60, 0.6, 1],
  [82, 72, 2.4, 1],
  [18, 58, 3.3, 1.5],
  [50, 85, 0.9, 1],
  [95, 50, 1.8, 1],
] as const;

function Stars() {
  return (
    <div className={styles.stars} aria-hidden="true">
      {STARS.map(([x, y, delay, size]) => (
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

function bucketSeconds(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 10) return "lt_10s";
  if (seconds < 30) return "10s_30s";
  if (seconds < 60) return "30s_1m";
  if (seconds < 180) return "1m_3m";
  return "gte_3m";
}

function pickReflectingHelper() {
  return REFLECTING_HELPERS[Math.floor(Math.random() * REFLECTING_HELPERS.length)];
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function preferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/aac",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionForAudioType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("webm")) return "webm";
  if (normalized.includes("mp4")) return "m4a";
  if (normalized.includes("aac")) return "aac";
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("wav")) return "wav";
  return "webm";
}

function deviceFamily() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  if (isIOS && /CriOS/i.test(ua)) return "ios_chrome";
  if (isIOS) return "ios_safari";
  if (isAndroid && /Chrome/i.test(ua)) return "android_chrome";
  if (/Mobi|Android/i.test(ua)) return "mobile_other";
  return "desktop";
}

function combineFloat32(chunks: Float32Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, value: string) {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

async function createWavRecorder(stream: MediaStream): Promise<ActiveRecorder> {
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) throw new Error("AudioContext unavailable");

  const audioContext = new AudioContextCtor();
  if (audioContext.state === "suspended") await audioContext.resume();

  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    mimeType: "audio/wav",
    stop: async () => {
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      const sampleRate = audioContext.sampleRate;
      await audioContext.close();
      return encodeWav(combineFloat32(chunks), sampleRate);
    },
  };
}

function createMediaRecorder(stream: MediaStream, mimeType: string): ActiveRecorder {
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  recorder.start();

  return {
    mimeType: recorder.mimeType || mimeType || "audio/webm",
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
        };
        recorder.stop();
      }),
  };
}

export function Diario({
  userEmail = "",
  onboarding,
  initialContinueEntryId,
  analyticsId,
}: {
  userEmail?: string;
  onboarding?: OnboardingProfile;
  initialContinueEntryId?: string;
  analyticsId?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reflection, setReflection] = useState<string | null>(null);
  const [isReflectionExpanded, setIsReflectionExpanded] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<CrisisResourcesData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reflectingHelper, setReflectingHelper] = useState(REFLECTING_HELPERS[0]);

  const recorderRef = useRef<ActiveRecorder | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const lastDurationBucketRef = useRef("lt_10s");
  const retryPayloadRef = useRef<RetryPayload | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [nextEntryMode, setNextEntryMode] = useState<EntryMode>("new");
  const [canRetry, setCanRetry] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const [isFeedbackActive, setIsFeedbackActive] = useState(false);

  function track(eventName: string, properties: Record<string, string | number | boolean | null | undefined>) {
    trackProduct(eventName, properties, analyticsId);
  }

  useEffect(() => {
    track("product_diary_viewed", {
      source: "diary",
      has_onboarding_moment: Boolean(onboarding?.moment),
      has_onboarding_presence: Boolean(onboarding?.presence),
      entry_mode: initialContinueEntryId ? "continue" : "new",
    });
  }, [analyticsId, initialContinueEntryId, onboarding?.moment, onboarding?.presence]);

  useEffect(() => {
    if (!initialContinueEntryId) return;
    setActiveEntryId(initialContinueEntryId);
    setNextEntryMode("continue");
  }, [initialContinueEntryId]);

  function resetToIdle() {
    setPhase("idle");
    setReflection(null);
    setIsReflectionExpanded(false);
    setMood(null);
    setCrisis(null);
    setErrorMsg(null);
    setCanRetry(false);
    setIsRetrying(false);
    setRetryNotice(null);
    retryPayloadRef.current = null;
    setActiveEntryId(null);
    setNextEntryMode("new");
    setIsFeedbackActive(false);
  }

  function fail(message: string, options: { canRetry?: boolean } = {}) {
    setErrorMsg(message);
    setCanRetry(Boolean(retryPayloadRef.current) && options.canRetry !== false);
    setIsRetrying(false);
    setRetryNotice(null);
    setPhase("error");
  }

  function enterReflecting() {
    setReflectingHelper(pickReflectingHelper());
    setIsReflectionExpanded(false);
    setPhase("reflecting");
  }

  async function onOrbClick() {
    if (phase === "recording") {
      await stopRecording();
      return;
    }
    if (phase === "reflecting") return; // ocupado
    if (phase === "reflection" && activeEntryId) {
      setNextEntryMode("continue");
    }
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
      const family = deviceFamily();
      const useWavRecorder = family === "ios_safari" || family === "ios_chrome";
      const mimeType = useWavRecorder ? "audio/wav" : preferredAudioMimeType();
      const recorder = useWavRecorder
        ? await createWavRecorder(stream)
        : createMediaRecorder(stream, mimeType);
      recorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setPhase("recording");
      track("product_diary_recording_started", {
        source: "diary",
        device_family: family,
        recorder_mime_type: recorder.mimeType.split(";")[0],
        entry_mode: nextEntryMode,
      });
    } catch {
      track("product_diary_recording_stopped", {
        source: "diary",
        status: "microphone_denied",
      });
      fail("Não consegui acessar o microfone. Verifique a permissão.");
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;

    const startedAt = recordingStartedAtRef.current;
    const durationMs = startedAt ? Date.now() - startedAt : 0;
    const durationBucket = bucketSeconds(durationMs);
    lastDurationBucketRef.current = durationBucket;
    track("product_diary_recording_stopped", {
      source: "diary",
      status: "stopped",
      duration_bucket: durationBucket,
      device_family: deviceFamily(),
      recorder_mime_type: recorder.mimeType.split(";")[0],
      entry_mode: nextEntryMode,
    });
    enterReflecting();
    let blob: Blob;
    try {
      blob = await withTimeout(recorder.stop(), STOP_RECORDING_TIMEOUT_MS);
    } catch {
      fail("A gravação demorou para encerrar. Tente de novo.");
      return;
    }
    await transcribeAndReflect(blob, {
      entryId: nextEntryMode === "new" ? undefined : activeEntryId ?? undefined,
      entryMode: nextEntryMode,
      durationBucket,
    });
  }

  async function transcribeAndReflect(
    blob: Blob,
    options?: { entryId?: string; entryMode?: EntryMode; durationBucket?: string; attempt?: number },
  ) {
    enterReflecting();
    setCanRetry(false);
    setRetryNotice(null);
    const requestId = createClientRequestId();
    const attempt = options?.attempt ?? 1;
    try {
      const form = new FormData();
      const audioType = blob.type || "audio/webm";
      const extension = extensionForAudioType(audioType);
      form.append("audio", new File([blob], `audio.${extension}`, { type: audioType }));
      form.append("audioMimeType", audioType);
      form.append("deviceFamily", deviceFamily());
      form.append("entryMode", options?.entryMode ?? nextEntryMode);
      form.append("durationBucket", options?.durationBucket ?? lastDurationBucketRef.current);
      form.append("clientRequestId", requestId);
      form.append("attempt", String(attempt));
      if (options?.entryId) form.append("entryId", options.entryId);
      const tRes = await fetchWithTimeout(
        "/api/transcribe",
        { method: "POST", body: form },
        TRANSCRIBE_TIMEOUT_MS,
      );
      const tData = (await tRes.json()) as TranscribeResponse;
      if (!tRes.ok || !("transcript" in tData) || !tData.transcript) {
        const retryable = "retryable" in tData ? tData.retryable !== false : tRes.status >= 500 || tRes.status === 429;
        const canAttemptAgain = retryable && attempt < MAX_TRANSCRIPTION_ATTEMPTS;
        retryPayloadRef.current = canAttemptAgain
          ? {
              blob,
              entryId: tData.entryId ?? options?.entryId,
              entryMode: options?.entryMode ?? nextEntryMode,
              durationBucket: options?.durationBucket ?? lastDurationBucketRef.current,
              attempt,
            }
          : null;
        track("product_transcription_failed", {
          source: "diary_client",
          status: String(tRes.status),
          error_code: "errorCode" in tData ? tData.errorCode ?? "transcription_response_invalid" : "transcription_response_invalid",
          error_class: "errorClass" in tData ? tData.errorClass ?? null : null,
          retryable,
          request_id: "requestId" in tData ? tData.requestId ?? requestId : requestId,
          attempt,
          device_family: deviceFamily(),
          audio_mime_type: audioType.split(";")[0],
          entry_mode: options?.entryMode ?? nextEntryMode,
          duration_bucket: options?.durationBucket ?? lastDurationBucketRef.current,
        });
        fail(
          !canAttemptAgain && retryable
            ? "Não consegui transcrever depois de algumas tentativas. Grave de novo em uma fala mais curta."
            : "userMessage" in tData && tData.userMessage
            ? tData.userMessage
            : "Não consegui transcrever o áudio. Tente de novo.",
          { canRetry: canAttemptAgain },
        );
        return;
      }
      await reflectOn(
        tData.transcript,
        tData.language ?? null,
        tData.entryId ?? options?.entryId,
        tData.segmentId,
        options?.entryMode ?? nextEntryMode,
        tData.requestId ?? requestId,
        attempt,
      );
    } catch (error) {
      const canAttemptAgain = attempt < MAX_TRANSCRIPTION_ATTEMPTS;
      retryPayloadRef.current = canAttemptAgain
        ? {
            blob,
            entryId: options?.entryId,
            entryMode: options?.entryMode ?? nextEntryMode,
            durationBucket: options?.durationBucket ?? lastDurationBucketRef.current,
            attempt,
          }
        : null;
      track("product_transcription_failed", {
        source: "diary_client",
        error_code: isAbortError(error) ? "transcription_timeout" : "transcription_network",
        error_class: isAbortError(error) ? "provider_timeout" : "network_or_unknown",
        retryable: true,
        request_id: requestId,
        attempt,
        device_family: deviceFamily(),
        entry_mode: options?.entryMode ?? nextEntryMode,
        duration_bucket: options?.durationBucket ?? lastDurationBucketRef.current,
      });
      fail(
        !canAttemptAgain
          ? "Não consegui transcrever depois de algumas tentativas. Grave de novo em uma fala mais curta."
          : isAbortError(error)
            ? "A transcrição demorou demais. Tente de novo."
            : "Falha de conexão ao transcrever.",
        { canRetry: canAttemptAgain },
      );
    }
  }

  async function reflectOn(
    transcript: string,
    language: string | null,
    entryId?: string,
    segmentId?: string,
    entryMode: EntryMode = "new",
    requestId = createClientRequestId(),
    attempt = 1,
  ) {
    try {
      const rRes = await fetchWithTimeout(
        "/api/reflect",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript, language, locale: "pt-BR", entryId, segmentId, entryMode, clientRequestId: requestId, attempt }),
        },
        REFLECT_TIMEOUT_MS,
      );
      const data = (await rRes.json()) as ReflectResponse;
      if (!rRes.ok || "error" in data) {
        track("product_reflection_failed", {
          source: "diary_client",
          status: String(rRes.status),
          error_code: "errorCode" in data ? data.errorCode ?? "reflection_response_invalid" : "reflection_response_invalid",
          error_class: "errorClass" in data ? data.errorClass ?? null : null,
          retryable: "retryable" in data ? data.retryable ?? null : null,
          request_id: "requestId" in data ? data.requestId ?? requestId : requestId,
          attempt,
          entry_mode: entryMode,
        });
        fail(
          "userMessage" in data && data.userMessage
            ? data.userMessage
            : "A Aurora não conseguiu responder agora. Tente de novo.",
          { canRetry: false },
        );
        return;
      }
      if (data.status === "crisis") {
        track("product_crisis_resources_shown", {
          source: "diary_client",
          risk_level: data.risk,
          request_id: data.requestId ?? requestId,
          attempt,
        });
        setCrisis(data.resources);
        setActiveEntryId(data.entryId);
        setPhase("crisis");
        return;
      }
      track("product_reflection_received", {
        source: "diary_client",
        status: "ok",
        entry_mode: entryMode,
        risk_level: data.risk,
        has_mood: Boolean(data.mood),
        reflection_type: data.fallbackSaved ? "fallback_saved" : data.mood ? "with_mood" : "without_mood",
        fallback_saved: Boolean(data.fallbackSaved),
        request_id: data.requestId ?? requestId,
        attempt,
      });
      setReflection(data.reflection);
      setIsReflectionExpanded(false);
      setMood(data.mood);
      setActiveEntryId(data.entryId);
      setNextEntryMode("continue");
      setPhase("reflection");
    } catch (error) {
      track("product_reflection_failed", {
        source: "diary_client",
        error_code: isAbortError(error) ? "reflection_timeout" : "reflection_network",
        error_class: isAbortError(error) ? "provider_timeout" : "network_or_unknown",
        retryable: true,
        request_id: requestId,
        attempt,
        entry_mode: entryMode,
      });
      fail(isAbortError(error) ? "A Aurora demorou demais para responder. Tente de novo." : "Falha de conexão ao refletir.");
    }
  }

  async function retryTranscription() {
    const retry = retryPayloadRef.current;
    if (!retry) return;
    const nextAttempt = retry.attempt + 1;
    const waitMs = retryDelayForAttempt(nextAttempt);
    setIsRetrying(true);
    setCanRetry(false);
    setRetryNotice("Vou tentar transcrever de novo em instantes.");
    try {
      await delay(waitMs);
      await transcribeAndReflect(retry.blob, {
        entryId: retry.entryId,
        entryMode: retry.entryMode,
        durationBucket: retry.durationBucket,
        attempt: nextAttempt,
      });
    } finally {
      setIsRetrying(false);
    }
  }

  async function startWithMode(mode: EntryMode) {
    setNextEntryMode(mode);
    await startRecording();
  }

  const firstName = onboarding?.name?.split(" ")[0] ?? "";
  const isContinuingThread = nextEntryMode === "continue" && Boolean(activeEntryId);
  const idleTitle = isContinuingThread
    ? "Continue este fio no seu tempo."
    : firstName
      ? `${firstName}, o que está vivo agora?`
      : DEFAULT_PROMPT;
  const canExpandReflection = Boolean(
    reflection && (reflection.length > 170 || reflection.trim().split(/\s+/).length > 24),
  );
  const stateCopy: Record<Exclude<Phase, "reflection">, { title: string; body: string; helper: string }> = {
    idle: {
      title: idleTitle,
      body: isContinuingThread
        ? "A nova fala entra no mesmo fio e preserva a sequência dos momentos."
        : onboarding?.moment
          ? `Se quiser, comece por ${onboarding.moment}.`
          : "Fale sem organizar antes.",
      helper: isContinuingThread ? "Toque para adicionar outro momento." : "Toque para falar",
    },
    recording: {
      title: "Gravando",
      body: "Pode falar no seu tempo.",
      helper: "Toque no orb de novo para encerrar.",
    },
    reflecting: {
      title: "Aproveite para respirar.",
      body: "A Aurora está pensando no que você falou.",
      helper: reflectingHelper,
    },
    crisis: {
      title: "Apoio agora",
      body: "A Aurora encontrou algo que precisa de cuidado imediato.",
      helper: "",
    },
    error: {
      title: "Algo saiu do fluxo.",
      body: "Você pode tentar de novo. Nada foi inventado.",
      helper: "",
    },
  };

  return (
    <main className={styles.stage} data-phase={phase}>
      <Stars />
      <ProductNav
        active="diario"
        context={isContinuingThread ? "Continuando fio" : userEmail ? userEmail.split("@")[0] : undefined}
      />

      {phase !== "reflection" ? (
        <div className={styles.center}>
          <div className={styles.copy}>
            <h1 className={phase === "recording" ? styles.functionalTitle : "font-serif"}>
              {stateCopy[phase].title}
            </h1>
            <p>{stateCopy[phase].body}</p>
          </div>

          {(phase === "idle" || phase === "recording" || phase === "reflecting" || phase === "error" || phase === "crisis") && (
            <div className={styles.orbStage}>
              <Orb state={ORB_STATE[phase]} onClick={onOrbClick} />
            </div>
          )}

          {stateCopy[phase].helper && (
            <p className={phase === "recording" ? styles.liveHelper : styles.helper}>
              {stateCopy[phase].helper}
            </p>
          )}

          {phase === "error" && errorMsg && (
            <div role="alert" className={styles.errorPanel}>
              <span className={styles.errorIcon} aria-hidden="true">!</span>
              <p>{errorMsg}</p>
              {retryNotice ? <p className={styles.retryNotice}>{retryNotice}</p> : null}
              <div className={styles.errorActions}>
                {canRetry && (
                  <button type="button" onClick={retryTranscription} disabled={isRetrying}>
                    {isRetrying ? "Tentando..." : "Tentar transcrever"}
                  </button>
                )}
                <button type="button" onClick={() => startWithMode(activeEntryId ? "continue" : "new")}>
                  Gravar de novo
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className={styles.composition}>
          <div className={styles.inner}>
            <div className={styles.sun}>
              <Orb state="idle" onClick={onOrbClick} ariaLabel="Toque para continuar falando" />
            </div>

            <div
              className={`${styles.card} ${isReflectionExpanded ? styles.cardExpanded : ""} ${
                isFeedbackActive && !isReflectionExpanded ? styles.cardFeedbackFocused : ""
              }`}
            >
              <div className={styles.cardContent}>
                <span className={styles.cardIcon} aria-hidden="true">✦</span>
                {canExpandReflection && isReflectionExpanded ? (
                  <button
                    type="button"
                    className={`${styles.readMoreAction} ${styles.readMoreActionTop}`}
                    onClick={() => setIsReflectionExpanded(false)}
                    aria-expanded={isReflectionExpanded}
                  >
                    Recolher devolutiva
                  </button>
                ) : null}

                <div
                  role={canExpandReflection ? "button" : undefined}
                  tabIndex={canExpandReflection ? 0 : undefined}
                  className={`${styles.reflectionReader} ${
                    isReflectionExpanded ? styles.reflectionReaderExpanded : ""
                  } ${canExpandReflection ? styles.reflectionReaderExpandable : ""}`}
                  onClick={() => canExpandReflection && setIsReflectionExpanded((expanded) => !expanded)}
                  onKeyDown={(event) => {
                    if (!canExpandReflection) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setIsReflectionExpanded((expanded) => !expanded);
                    }
                  }}
                  aria-expanded={canExpandReflection ? isReflectionExpanded : undefined}
                >
                  <div className={`font-serif ${styles.reflectionText}`}>
                    {reflection && renderProse(reflection)}
                  </div>
                </div>

                {canExpandReflection && !isReflectionExpanded ? (
                  <button
                    type="button"
                    className={styles.readMoreAction}
                    onClick={() => setIsReflectionExpanded((expanded) => !expanded)}
                    aria-expanded={isReflectionExpanded}
                  >
                    Ler devolutiva inteira
                  </button>
                ) : null}

                {!isReflectionExpanded ? (
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

                    <span />
                  </div>
                ) : null}

                <PmfPrompt
                  entryId={activeEntryId}
                  entryMode={nextEntryMode}
                  onActiveChange={setIsFeedbackActive}
                  source="diary_reflection"
                  suspended={isReflectionExpanded}
                />

                {!isFeedbackActive && !isReflectionExpanded ? (
                  <div className={styles.actionRow}>
                    <button type="button" onClick={() => startWithMode("continue")} className={styles.primaryAction}>
                      Continuar este registro
                    </button>
                    <button type="button" onClick={resetToIdle} className={styles.secondaryAction}>
                      Novo momento
                    </button>
                    <Link href="/timeline" className={styles.softLink}>Linha do tempo</Link>
                  </div>
                ) : null}
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

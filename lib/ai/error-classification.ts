import { randomUUID } from "crypto";

export type ProcessingErrorClass =
  | "audio_too_large"
  | "audio_too_short"
  | "database_write_failed"
  | "invalid_audio_empty"
  | "network_or_unknown"
  | "pipeline_failed"
  | "provider_empty_transcript"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "storage_delete_failed"
  | "unsupported_mime";

export type ClassifiedProcessingError = {
  errorClass: ProcessingErrorClass;
  errorCode: string;
  retryable: boolean;
  status: number;
  userMessage: string;
};

const SUPPORTED_AUDIO_MIME_PREFIXES = ["audio/", "video/webm", "video/mp4"];
const INLINE_AUDIO_MAX_BYTES = 25 * 1024 * 1024;
const INLINE_AUDIO_MIN_BYTES = 256;

export function createProcessingRequestId() {
  return randomUUID();
}

export function bucketAudioSize(bytes: number) {
  if (bytes <= 0) return "empty";
  if (bytes < 20 * 1024) return "lt_20kb";
  if (bytes < 100 * 1024) return "20_100kb";
  if (bytes < 1 * 1024 * 1024) return "100kb_1mb";
  if (bytes < 6 * 1024 * 1024) return "1_6mb";
  if (bytes < INLINE_AUDIO_MAX_BYTES) return "6_25mb";
  return "gte_25mb";
}

export function bucketLatency(ms: number) {
  if (ms < 1000) return "lt_1s";
  if (ms < 5000) return "1_5s";
  if (ms < 15000) return "5_15s";
  if (ms < 45000) return "15_45s";
  return "gte_45s";
}

export function bucketTranscriptLength(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return "empty";
  if (words <= 10) return "1_10w";
  if (words <= 40) return "11_40w";
  if (words <= 120) return "41_120w";
  return "gt_120w";
}

export function validateAudioForTranscription({
  bytes,
  mimeType,
}: {
  bytes: number;
  mimeType: string;
}): ClassifiedProcessingError | null {
  if (bytes <= 0) {
    return {
      errorClass: "invalid_audio_empty",
      errorCode: "invalid_audio_empty",
      retryable: false,
      status: 400,
      userMessage: "A gravação veio vazia. Grave de novo por alguns segundos.",
    };
  }

  if (bytes < INLINE_AUDIO_MIN_BYTES) {
    return {
      errorClass: "audio_too_short",
      errorCode: "audio_too_short",
      retryable: false,
      status: 422,
      userMessage: "A gravação ficou curta demais. Grave um pouco mais ou escreva uma frase.",
    };
  }

  if (bytes > INLINE_AUDIO_MAX_BYTES) {
    return {
      errorClass: "audio_too_large",
      errorCode: "audio_too_large",
      retryable: false,
      status: 413,
      userMessage: "A gravação ficou grande demais para transcrever agora. Tente uma versão mais curta.",
    };
  }

  const normalizedMime = mimeType.toLowerCase();
  if (
    normalizedMime &&
    normalizedMime !== "application/octet-stream" &&
    !SUPPORTED_AUDIO_MIME_PREFIXES.some((prefix) => normalizedMime.startsWith(prefix))
  ) {
    return {
      errorClass: "unsupported_mime",
      errorCode: "unsupported_mime",
      retryable: false,
      status: 415,
      userMessage: "Esse formato de áudio não foi aceito. Grave de novo pelo navegador.",
    };
  }

  return null;
}

function errorStatus(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode ?? record.code;
  if (typeof status === "number") return status;
  if (typeof status === "string" && /^\d+$/.test(status)) return Number(status);
  return null;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

export function classifyTranscriptionError(error: unknown): ClassifiedProcessingError {
  const status = errorStatus(error);
  const message = errorMessage(error);

  if (status === 429 || message.includes("rate limit") || message.includes("too many")) {
    return {
      errorClass: "provider_rate_limited",
      errorCode: "provider_rate_limited",
      retryable: true,
      status: 429,
      userMessage: "A transcrição ficou ocupada agora. Tente novamente em instantes.",
    };
  }

  if (status === 408 || status === 504 || message.includes("timeout") || message.includes("timed out")) {
    return {
      errorClass: "provider_timeout",
      errorCode: "provider_timeout",
      retryable: true,
      status: 504,
      userMessage: "A transcrição demorou demais. Tente novamente.",
    };
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    message.includes("overloaded") ||
    message.includes("unavailable")
  ) {
    return {
      errorClass: "provider_unavailable",
      errorCode: "provider_unavailable",
      retryable: true,
      status: 503,
      userMessage: "A transcrição não respondeu agora. Tente novamente em instantes.",
    };
  }

  if (message.includes("storage") || message.includes("delete") || message.includes("remove")) {
    return {
      errorClass: "storage_delete_failed",
      errorCode: "storage_delete_failed",
      retryable: true,
      status: 500,
      userMessage: "A Aurora não conseguiu finalizar o áudio com segurança. Tente novamente.",
    };
  }

  return {
    errorClass: "network_or_unknown",
    errorCode: "transcription_unknown",
    retryable: true,
    status: 500,
    userMessage: "Não consegui transcrever o áudio. Tente novamente.",
  };
}

export function classifyReflectionError(error: unknown): ClassifiedProcessingError {
  const status = errorStatus(error);
  const message = errorMessage(error);

  if (status === 429 || message.includes("rate limit")) {
    return {
      errorClass: "provider_rate_limited",
      errorCode: "reflection_rate_limited",
      retryable: true,
      status: 429,
      userMessage: "A Aurora ficou ocupada agora. Tente novamente em instantes.",
    };
  }

  if (status === 408 || status === 504 || message.includes("timeout") || message.includes("timed out")) {
    return {
      errorClass: "provider_timeout",
      errorCode: "reflection_timeout",
      retryable: true,
      status: 504,
      userMessage: "A Aurora demorou demais para responder. Tente novamente.",
    };
  }

  if (message.includes("database") || message.includes("duplicate key") || message.includes("insert")) {
    return {
      errorClass: "database_write_failed",
      errorCode: "reflection_database_write_failed",
      retryable: true,
      status: 500,
      userMessage: "Seu registro não pôde ser salvo agora. Tente novamente.",
    };
  }

  return {
    errorClass: "pipeline_failed",
    errorCode: "reflection_pipeline_failed",
    retryable: true,
    status: 500,
    userMessage: "A Aurora não conseguiu preparar a devolutiva agora.",
  };
}

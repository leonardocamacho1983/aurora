import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

// Transcrição (§5) — OpenAI gpt-4o-mini-transcribe.
export const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

export interface TranscriptResult {
  text: string;
  language: string | null;
}

/** Transcreve bytes de áudio (em memória; nunca persiste o áudio). */
export async function transcribeAudio(audio: Uint8Array): Promise<TranscriptResult> {
  if (process.env.NODE_ENV !== "production" && !process.env.OPENAI_API_KEY) {
    return {
      text: "Registro local de teste da Aurora para validar gravação, resultado e timeline.",
      language: "pt",
    };
  }

  const result = await transcribe({
    model: openai.transcription(TRANSCRIBE_MODEL),
    audio,
  });
  return { text: result.text.trim(), language: result.language ?? null };
}

export interface TranscribeDeps {
  transcribe: (audio: Uint8Array) => Promise<TranscriptResult>;
  deleteAudio: (path: string) => Promise<void>;
}

/**
 * §10 (privacidade, NÃO opcional): apaga o áudio após a transcrição.
 *  - storagePath presente (áudio pré-enviado ao Storage) → removido após sucesso.
 *  - áudio inline (sem storagePath) → nunca foi persistido, nada a apagar.
 *  - falha na transcrição → áudio preservado (permite retry); a transcrição não
 *    prossegue, então nenhuma reflexão é gerada por baixo.
 */
export async function runTranscription(
  audio: Uint8Array,
  opts: { storagePath?: string | null },
  deps: TranscribeDeps,
): Promise<TranscriptResult> {
  const result = await deps.transcribe(audio);
  if (opts.storagePath) {
    await deps.deleteAudio(opts.storagePath);
  }
  return result;
}

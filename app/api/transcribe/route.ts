import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TRANSCRIBE_MODEL, transcribeAudio, runTranscription } from "@/lib/ai/transcribe";
import {
  bucketAudioSize,
  bucketLatency,
  classifyTranscriptionError,
  createProcessingRequestId,
  validateAudioForTranscription,
  type ClassifiedProcessingError,
} from "@/lib/ai/error-classification";
import { recordProductEvent, type ProductEventMetadata } from "@/lib/analytics/product-events";

export const runtime = "nodejs"; // OpenAI SDK precisa do runtime Node
export const dynamic = "force-dynamic";

// Bucket privado do Supabase Storage onde o cliente pré-envia o áudio (opcional).
const AUDIO_BUCKET = "audio";

function formString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.slice(0, 120) : undefined;
}

function formAttempt(form: FormData) {
  const raw = formString(form, "attempt");
  if (!raw) return 1;
  const attempt = Number.parseInt(raw, 10);
  if (!Number.isFinite(attempt) || attempt < 1) return 1;
  return Math.min(attempt, 10);
}

function transcriptionFailureResponse({
  requestId,
  failure,
}: {
  requestId: string;
  failure: ClassifiedProcessingError;
}) {
  return NextResponse.json(
    {
      error: "transcription_failed",
      errorCode: failure.errorCode,
      errorClass: failure.errorClass,
      retryable: failure.retryable,
      requestId,
      userMessage: failure.userMessage,
    },
    { status: failure.status },
  );
}

export async function POST(request: Request) {
  let requestId: string = createProcessingRequestId();
  const startedAt = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "expected multipart/form-data" },
      { status: 400 },
    );
  }
  const clientRequestId = formString(form, "clientRequestId");
  if (clientRequestId) requestId = clientRequestId;
  const attempt = formAttempt(form);

  const file = form.get("audio");
  const storagePath = (form.get("storagePath") as string | null) || null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const audioMimeType = formString(form, "audioMimeType") || file.type || "unknown";
  const baseMetadata: ProductEventMetadata = {
    request_id: requestId,
    provider: "openai",
    model: TRANSCRIBE_MODEL,
    audio_mime_type: audioMimeType.split(";")[0],
    audio_size_bucket: bucketAudioSize(bytes.byteLength),
    device_family: formString(form, "deviceFamily") ?? null,
    duration_bucket: formString(form, "durationBucket") ?? null,
    entry_mode: formString(form, "entryMode") ?? "new",
    storage_path_present: Boolean(storagePath),
    attempt,
  };

  await recordProductEvent({
    userId: user.id,
    eventName: "product_transcription_attempted",
    source: "transcribe_api",
    metadata: baseMetadata,
  });

  const validationFailure = validateAudioForTranscription({
    bytes: bytes.byteLength,
    mimeType: audioMimeType,
  });
  if (validationFailure) {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_transcription_failed",
      source: "transcribe_api",
      metadata: {
        ...baseMetadata,
        status: String(validationFailure.status),
        error_class: validationFailure.errorClass,
        error_code: validationFailure.errorCode,
        retryable: validationFailure.retryable,
        latency_bucket: bucketLatency(Date.now() - startedAt),
      },
    });
    return transcriptionFailureResponse({ requestId, failure: validationFailure });
  }

  try {
    const { text, language } = await runTranscription(
      bytes,
      { storagePath },
      {
        transcribe: transcribeAudio,
        // §10: apaga o áudio do Storage após a transcrição.
        deleteAudio: async (path) => {
          await supabase.storage.from(AUDIO_BUCKET).remove([path]);
        },
      },
    );

    if (!text.trim()) {
      const emptyTranscriptFailure: ClassifiedProcessingError = {
        errorClass: "provider_empty_transcript",
        errorCode: "provider_empty_transcript",
        retryable: false,
        status: 422,
        userMessage: "Não encontrei fala suficiente nessa gravação. Grave um pouco mais ou escreva uma frase.",
      };
      await recordProductEvent({
        userId: user.id,
        eventName: "product_transcription_failed",
        source: "transcribe_api",
        metadata: {
          ...baseMetadata,
          status: String(emptyTranscriptFailure.status),
          error_class: emptyTranscriptFailure.errorClass,
          error_code: emptyTranscriptFailure.errorCode,
          retryable: emptyTranscriptFailure.retryable,
          latency_bucket: bucketLatency(Date.now() - startedAt),
        },
      });
      return transcriptionFailureResponse({ requestId, failure: emptyTranscriptFailure });
    }

    await recordProductEvent({
      userId: user.id,
      eventName: "product_transcription_succeeded",
      source: "transcribe_api",
      metadata: {
        ...baseMetadata,
        status: "ok",
        language: language ?? null,
        latency_bucket: bucketLatency(Date.now() - startedAt),
      },
    });

    return NextResponse.json({ transcript: text, language, requestId });
  } catch (error) {
    console.error("/api/transcribe error:", error);
    const failure = classifyTranscriptionError(error);
    await recordProductEvent({
      userId: user.id,
      eventName: "product_transcription_failed",
      source: "transcribe_api",
      metadata: {
        ...baseMetadata,
        status: String(failure.status),
        error_class: failure.errorClass,
        error_code: failure.errorCode,
        retryable: failure.retryable,
        latency_bucket: bucketLatency(Date.now() - startedAt),
      },
    });
    return transcriptionFailureResponse({ requestId, failure });
  }
}

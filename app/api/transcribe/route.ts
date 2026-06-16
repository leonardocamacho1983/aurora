import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio, runTranscription } from "@/lib/ai/transcribe";

export const runtime = "nodejs"; // OpenAI SDK precisa do runtime Node
export const dynamic = "force-dynamic";

// Bucket privado do Supabase Storage onde o cliente pré-envia o áudio (opcional).
const AUDIO_BUCKET = "audio";

export async function POST(request: Request) {
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

  const file = form.get("audio");
  const storagePath = (form.get("storagePath") as string | null) || null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

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

    return NextResponse.json({ transcript: text, language });
  } catch (error) {
    console.error("/api/transcribe error:", error);
    return NextResponse.json({ error: "transcription_failed" }, { status: 500 });
  }
}

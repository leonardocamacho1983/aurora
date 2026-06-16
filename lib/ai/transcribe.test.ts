import { describe, it, expect, vi } from "vitest";
import { runTranscription, type TranscribeDeps } from "./transcribe";

const audio = new Uint8Array([1, 2, 3]);

function makeDeps(over: Partial<TranscribeDeps> = {}): TranscribeDeps {
  return {
    transcribe: vi.fn(async () => ({ text: "olá mundo", language: "pt" })),
    deleteAudio: vi.fn(async () => {}),
    ...over,
  };
}

describe("runTranscription — §10 apagar áudio", () => {
  it("apaga o áudio do Storage após transcrever (quando há storagePath)", async () => {
    const deps = makeDeps();
    const result = await runTranscription(audio, { storagePath: "u/1.webm" }, deps);

    expect(result).toEqual({ text: "olá mundo", language: "pt" });
    expect(deps.deleteAudio).toHaveBeenCalledWith("u/1.webm");
  });

  it("transcreve ANTES de apagar (ordem)", async () => {
    const calls: string[] = [];
    const deps: TranscribeDeps = {
      transcribe: vi.fn(async () => {
        calls.push("transcribe");
        return { text: "x", language: null };
      }),
      deleteAudio: vi.fn(async () => {
        calls.push("delete");
      }),
    };
    await runTranscription(audio, { storagePath: "p" }, deps);
    expect(calls).toEqual(["transcribe", "delete"]);
  });

  it("áudio inline (sem storagePath) não tenta apagar nada", async () => {
    const deps = makeDeps();
    await runTranscription(audio, { storagePath: null }, deps);
    expect(deps.deleteAudio).not.toHaveBeenCalled();
  });

  it("se a transcrição falha, o áudio NÃO é apagado (preserva p/ retry)", async () => {
    const deps = makeDeps({
      transcribe: vi.fn(async () => {
        throw new Error("openai down");
      }),
    });
    await expect(
      runTranscription(audio, { storagePath: "p" }, deps),
    ).rejects.toThrow("openai down");
    expect(deps.deleteAudio).not.toHaveBeenCalled();
  });
});

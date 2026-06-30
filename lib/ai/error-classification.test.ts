import { describe, expect, it } from "vitest";
import {
  bucketAudioSize,
  bucketLatency,
  classifyTranscriptionError,
  validateAudioForTranscription,
} from "./error-classification";

describe("processing error classification", () => {
  it("marks empty audio as non-retryable validation failure", () => {
    const result = validateAudioForTranscription({ bytes: 0, mimeType: "audio/webm" });

    expect(result?.errorClass).toBe("invalid_audio_empty");
    expect(result?.retryable).toBe(false);
    expect(result?.status).toBe(400);
  });

  it("marks unsupported MIME types as non-retryable", () => {
    const result = validateAudioForTranscription({ bytes: 4096, mimeType: "text/plain" });

    expect(result?.errorClass).toBe("unsupported_mime");
    expect(result?.retryable).toBe(false);
    expect(result?.status).toBe(415);
  });

  it("classifies provider rate limits as retryable", () => {
    const result = classifyTranscriptionError({ status: 429 });

    expect(result.errorClass).toBe("provider_rate_limited");
    expect(result.retryable).toBe(true);
    expect(result.status).toBe(429);
  });

  it("accepts numeric status codes from SDK string fields", () => {
    const result = classifyTranscriptionError({ code: "504" });

    expect(result.errorClass).toBe("provider_timeout");
    expect(result.retryable).toBe(true);
  });

  it("buckets safe technical metrics without raw content", () => {
    expect(bucketAudioSize(0)).toBe("empty");
    expect(bucketAudioSize(30 * 1024)).toBe("20_100kb");
    expect(bucketLatency(46_000)).toBe("gte_45s");
  });
});

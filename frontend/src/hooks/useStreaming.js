import { useState, useRef, useCallback } from "react";

export function useStreaming() {
  const [streamText, setStreamText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const bufferRef = useRef("");
  const abortRef = useRef(null);

  const parseResult = (raw) => {
    const cleaned = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned);
  };

  const stream = useCallback(async (url, options = {}) => {
    setStreaming(true);
    setStreamText("");
    setResult(null);
    setError(null);
    bufferRef.current = "";

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        ...options,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Processing failed." }));
        throw new Error(err.error || "Processing failed.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            try {
              const parsed = parseResult(bufferRef.current);
              setResult(parsed);
            } catch {
              setError("Failed to parse AI response. Please try again.");
            }
            setStreaming(false);
            return;
          }

          try {
            const { text } = JSON.parse(data);
            if (text) {
              bufferRef.current += text;
              setStreamText(bufferRef.current);
            }
          } catch {
            // ignore partial JSON chunks
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Processing failed. Please try again.");
      }
    } finally {
      setStreaming(false);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { stream, streamText, streaming, result, error, abort };
}

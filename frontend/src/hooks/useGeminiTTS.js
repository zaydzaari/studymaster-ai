import { useState, useRef, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export function useGeminiTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const ctxRef = useRef(null);

  const stop = useCallback(() => {
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
    setSpeaking(false);
    window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback(async (text, lang = "en") => {
    stop();
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 3000), lang }),
      });

      if (!res.ok) throw new Error("TTS request failed");

      const { audio, mimeType } = await res.json();
      const sampleRate = parseInt(mimeType?.match(/rate=(\d+)/)?.[1] || "24000");

      // Decode base64 PCM → Float32
      const raw = atob(audio);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const i16 = new Int16Array(bytes.buffer);
      const f32 = new Float32Array(i16.length);
      for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;

      const ctx = new AudioContext({ sampleRate });
      ctxRef.current = ctx;
      const buf = ctx.createBuffer(1, f32.length, sampleRate);
      buf.copyToChannel(f32, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
      setSpeaking(true);
      src.onended = () => { setSpeaking(false); try { ctx.close(); } catch {} };
    } catch {
      // Fallback to browser TTS
      if (window.speechSynthesis) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US";
        utt.rate = 0.9;
        utt.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utt);
        setSpeaking(true);
      }
    } finally {
      setLoading(false);
    }
  }, [stop]);

  return { speaking, loading, speak, stop };
}

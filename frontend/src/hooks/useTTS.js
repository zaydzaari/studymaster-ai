import { useState, useEffect } from "react";

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const handle = () => setSpeaking(false);
    window.speechSynthesis?.addEventListener?.("end", handle);
    return () => window.speechSynthesis?.removeEventListener?.("end", handle);
  }, []);

  const speak = (text, lang = "en") => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US";
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
    if (match) utterance.voice = match;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  return { speaking, speak, stop };
}

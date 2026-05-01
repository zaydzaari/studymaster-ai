import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import DeepDivePanel from "./DeepDivePanel.jsx";
import { useGeminiTTS } from "../hooks/useGeminiTTS.js";

export default function SummaryView({ result, lang, addToast, demoControl, onDebug }) {
  const { t } = useTranslation();
  const { speaking, loading: ttsLoading, speak, stop } = useGeminiTTS();
  const [deepDiveConcept, setDeepDiveConcept] = useState(null);
  const [copied, setCopied] = useState(false);

  const isPlaying = speaking || !!demoControl?.ttsActive;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.summary || "");
    setCopied(true);
    addToast?.(t("actions.copied"), "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = () => {
    if (isPlaying) stop();
    else speak(result.summary || "", result.meta?.language || lang);
  };

  const paragraphs = (result.summary || "").split("\n").filter(p => p.trim());

  return (
    <div style={{ position: "relative" }}>
      {/* Chapter header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 4 }}>
            Introduction
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
            {result.meta?.title || t("results.summary")}
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            data-demo-id="listen-btn"
            onClick={handleTTS}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
              background: isPlaying ? "var(--accent-light)" : "var(--bg-secondary)",
              border: `1px solid ${isPlaying ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6, fontSize: 12,
              color: isPlaying ? "var(--accent)" : "var(--text-secondary)",
              cursor: ttsLoading ? "wait" : "pointer", transition: "all 0.2s",
              opacity: ttsLoading ? 0.7 : 1,
            }}
          >
            {isPlaying ? (
              <><div className="audio-bars"><span /><span /><span /><span /></div>{t("actions.stop")}</>
            ) : (
              <>{t("actions.listen")}</>
            )}
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: "5px 12px",
              background: copied ? "var(--success-light)" : "var(--bg-secondary)",
              border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
              borderRadius: 6, fontSize: 12,
              color: copied ? "var(--success)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {copied ? "✓" : t("actions.copy")}
          </button>
        </div>
      </div>

      {/* Summary — flowing prose */}
      <div style={{ marginBottom: 24 }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{
            fontSize: 15, lineHeight: 1.8, color: "var(--text-primary)",
            marginBottom: i < paragraphs.length - 1 ? 14 : 0,
          }}>
            {para}
          </p>
        ))}
      </div>

      {/* Key Takeaways section */}
      {result.keyPoints?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 12,
          }}>
            Core Concepts
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {result.keyPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "10px 14px",
                  background: "var(--bg-secondary)", borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{
                  width: 20, height: 20, background: "var(--accent-light)", color: "var(--accent)",
                  borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 10, flexShrink: 0, fontFamily: "'Geist Mono', monospace",
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.55, flex: 1 }}>
                  {point}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Key quote blockquote */}
      {result.keyQuote && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            borderLeft: "3px solid var(--accent)", padding: "14px 18px",
            background: "var(--accent-light)", borderRadius: "0 8px 8px 0",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 8 }}>
            Key Takeaway
          </div>
          <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>
            "{result.keyQuote}"
          </p>
        </motion.div>
      )}

      {/* Concept pills */}
      {result.concepts?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 8 }}>
            {t("results.concepts")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.concepts.map((c, i) => (
              <button
                key={i}
                onClick={() => setDeepDiveConcept(c)}
                title={t("actions.explainMore")}
                style={{
                  padding: "4px 12px",
                  background: "var(--bg-secondary)", color: "var(--text-secondary)",
                  borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--accent-light)";
                  e.currentTarget.style.color = "var(--accent)";
                  e.currentTarget.style.borderColor = "rgba(79,70,229,0.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {c}
                <span style={{ fontSize: 10, opacity: 0.5 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        padding: "10px 14px", background: "var(--bg-secondary)",
        borderRadius: 8, fontSize: 12, color: "var(--text-muted)",
      }}>
        {result.meta?.subject && <span>{result.meta.subject}</span>}
        {result.meta?.readingTime && <span>{result.meta.readingTime} min read</span>}
        {result.meta?.language && <span>{result.meta.language.toUpperCase()}</span>}
      </div>

      {deepDiveConcept && (
        <DeepDivePanel
          concept={deepDiveConcept}
          subject={result.meta?.subject || "General"}
          onClose={() => setDeepDiveConcept(null)}
          onDebug={onDebug}
        />
      )}
    </div>
  );
}

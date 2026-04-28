import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import DeepDivePanel from "./DeepDivePanel.jsx";
import { useTTS } from "../hooks/useTTS.js";

export default function SummaryView({ result, lang, addToast }) {
  const { t } = useTranslation();
  const { speaking, speak, stop } = useTTS();
  const [deepDiveConcept, setDeepDiveConcept] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.summary || "");
    setCopied(true);
    addToast?.(t("actions.copied"), "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = () => {
    if (speaking) {
      stop();
    } else {
      speak(result.summary || "", result.meta?.language || lang);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
          {t("results.summary")}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Listen */}
          <button
            onClick={handleTTS}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: speaking ? "var(--accent-light)" : "var(--bg-secondary)",
              border: `1px solid ${speaking ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6,
              fontSize: 12,
              color: speaking ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {speaking ? (
              <>
                <div className="audio-bars">
                  <span /><span /><span /><span />
                </div>
                {t("actions.stop")}
              </>
            ) : (
              <>🎙 {t("actions.listen")}</>
            )}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            style={{
              padding: "5px 12px",
              background: copied ? "var(--success-light)" : "var(--bg-secondary)",
              border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
              borderRadius: 6,
              fontSize: 12,
              color: copied ? "var(--success)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓" : t("actions.copy")}
          </button>
        </div>
      </div>

      {/* Summary text */}
      <div style={{
        fontSize: 15,
        lineHeight: 1.75,
        color: "var(--text-primary)",
        marginBottom: 20,
      }}>
        {(result.summary || "").split("\n").map((para, i) => (
          <p key={i} style={{ marginBottom: 12 }}>{para}</p>
        ))}
      </div>

      {/* Key quote */}
      {result.keyQuote && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            borderLeft: "3px solid var(--accent)",
            padding: "12px 16px",
            background: "var(--accent-light)",
            borderRadius: "0 8px 8px 0",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
            {t("results.keyQuote")}
          </div>
          <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.6 }}>
            "{result.keyQuote}"
          </p>
        </motion.div>
      )}

      {/* Concepts */}
      {result.concepts?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onMouseEnter={e => {
                  e.target.style.background = "var(--accent-light)";
                  e.target.style.color = "var(--accent)";
                  e.target.style.borderColor = "rgba(37,99,235,0.3)";
                }}
                onMouseLeave={e => {
                  e.target.style.background = "var(--bg-secondary)";
                  e.target.style.color = "var(--text-secondary)";
                  e.target.style.borderColor = "var(--border)";
                }}
              >
                {c}
                <span style={{ fontSize: 10, opacity: 0.6 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta info */}
      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        padding: "12px 16px",
        background: "var(--bg-secondary)",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--text-muted)",
      }}>
        {result.meta?.subject && <span>📚 {result.meta.subject}</span>}
        {result.meta?.readingTime && <span>⏱ {result.meta.readingTime} min read</span>}
        {result.meta?.language && <span>🌍 {result.meta.language.toUpperCase()}</span>}
      </div>

      {/* Deep dive panel */}
      {deepDiveConcept && (
        <DeepDivePanel
          concept={deepDiveConcept}
          subject={result.meta?.subject || "General"}
          onClose={() => setDeepDiveConcept(null)}
        />
      )}
    </div>
  );
}

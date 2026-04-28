import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const DIFF_STYLE = {
  easy: { bg: "#D1FAE5", color: "#065F46" },
  medium: { bg: "#FEF3C7", color: "#78350F" },
  hard: { bg: "#FEE2E2", color: "#7F1D1D" },
};

export default function QuestionsView({ result, addToast }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const questions = result.studyQuestions || [];

  const handleCopy = async () => {
    const text = questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    addToast?.(t("actions.copied"), "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{t("results.questions")}</div>
        <button
          onClick={handleCopy}
          style={{
            padding: "4px 10px",
            background: copied ? "var(--success-light)" : "var(--bg-secondary)",
            border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
            borderRadius: 6,
            fontSize: 12,
            color: copied ? "var(--success)" : "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied" : t("actions.copy")}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: "14px 16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 10, flex: 1 }}>
              <span style={{
                color: "var(--text-muted)",
                fontSize: 12,
                fontFamily: "'Geist Mono', monospace",
                minWidth: 20,
                paddingTop: 2,
              }}>
                {i + 1}.
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)" }}>
                {q.question}
              </span>
            </div>
            {q.difficulty && (
              <span style={{
                background: DIFF_STYLE[q.difficulty]?.bg || "#EFF6FF",
                color: DIFF_STYLE[q.difficulty]?.color || "#1D4ED8",
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {t(`difficulty.${q.difficulty}`)}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const floatAnim = {
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function EmptyState({ onDemo }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        gap: 24,
        padding: 40,
        textAlign: "center",
      }}
    >
      {/* Floating icons */}
      <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
        {[
          { emoji: "📝", delay: 0 },
          { emoji: "📚", delay: 0.5 },
          { emoji: "📇", delay: 1 },
        ].map(({ emoji, delay }, i) => (
          <motion.div
            key={i}
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
            style={{
              fontSize: 40,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <div>
        <h2 style={{
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: 12,
        }}>
          {t("empty.heading")}
        </h2>
        <p style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          maxWidth: 420,
          lineHeight: 1.6,
          margin: "0 auto",
        }}>
          {t("empty.subtitle")}
        </p>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {["📝 Summaries", "📇 Flashcards", "📝 Quizzes"].map((pill, i) => (
          <div
            key={i}
            style={{
              padding: "6px 14px",
              background: "var(--accent-light)",
              color: "var(--accent)",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid rgba(37,99,235,0.2)",
            }}
          >
            {pill}
          </div>
        ))}
      </div>

      {/* Demo button */}
      <motion.button
        whileHover={{ scale: 1.02, translateY: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDemo}
        style={{
          padding: "12px 28px",
          background: "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        ✨ {t("empty.demo")}
      </motion.button>

      {/* Arrow hint */}
      <motion.div
        animate={{ x: [-4, 4, -4] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        ← Paste your content in the panel
      </motion.div>
    </motion.div>
  );
}

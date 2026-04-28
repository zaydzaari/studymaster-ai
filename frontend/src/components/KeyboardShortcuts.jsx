import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const SHORTCUTS = [
  { keys: ["Ctrl", "↵"], desc: "Submit / Generate" },
  { keys: ["Esc"], desc: "Close modal / go back" },
  { keys: ["?"], desc: "Open this shortcuts panel" },
  { keys: ["←", "→"], desc: "Navigate flashcards" },
  { keys: ["Space"], desc: "Flip flashcard" },
  { keys: ["1–4"], desc: "Select quiz option A–D" },
  { keys: ["↵"], desc: "Submit / next quiz question" },
  { keys: ["1–6"], desc: "Switch result tabs" },
  { keys: ["Ctrl", "P"], desc: "Export PDF" },
  { keys: ["Ctrl", "L"], desc: "Listen (text-to-speech)" },
];

export default function KeyboardShortcuts({ onClose }) {
  const { t } = useTranslation();
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 800,
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          padding: 24,
          zIndex: 801,
          width: 420,
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            {t("shortcuts.title")}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--text-muted)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SHORTCUTS.map((s, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: "var(--bg-secondary)",
              borderRadius: 6,
            }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.desc}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {s.keys.map((k, j) => (
                  <kbd key={j} style={{
                    padding: "2px 6px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderBottom: "2px solid var(--border-hover)",
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: "'Geist Mono', monospace",
                    color: "var(--text-primary)",
                  }}>
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

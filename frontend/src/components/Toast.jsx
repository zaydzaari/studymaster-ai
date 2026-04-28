import React from "react";
import { motion } from "framer-motion";

const colors = {
  info: { bg: "var(--bg-card)", border: "var(--border)", icon: "ℹ️" },
  success: { bg: "var(--success-light)", border: "var(--success)", icon: "✓" },
  error: { bg: "var(--error-light)", border: "var(--error)", icon: "✕" },
  warning: { bg: "var(--warning-light)", border: "var(--warning)", icon: "⚠" },
};

export default function Toast({ message, type = "info" }) {
  const c = colors[type] || colors.info;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={{
        maxWidth: 320,
        padding: "12px 16px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        boxShadow: "var(--shadow-lg)",
        fontSize: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        color: "var(--text-primary)",
      }}
    >
      <span style={{ flexShrink: 0 }}>{c.icon}</span>
      <span>{message}</span>
    </motion.div>
  );
}

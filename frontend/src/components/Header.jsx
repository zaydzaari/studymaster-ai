import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
];

export default function Header({ theme, onToggleTheme, lang, onChangeLang, streak }) {
  const { t } = useTranslation();

  return (
    <header style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      background: "rgba(250,250,249,0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
    }}
      data-theme-header={theme}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--accent)" />
          <path d="M8 8h8M8 12h6M8 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          StudyMaster
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Streak */}
        {streak > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "var(--warning-light)",
              color: "var(--warning)",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            🔥 {t("streak.days", { n: streak })}
          </motion.div>
        )}

        {/* Language selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => onChangeLang(l.code)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "none",
                background: lang === l.code ? "var(--accent)" : "transparent",
                color: lang === l.code ? "white" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle theme"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "var(--text-primary)",
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* IA Master badge */}
        <div style={{
          background: "var(--accent)",
          color: "white",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          IA Master 2
        </div>
      </div>
    </header>
  );
}

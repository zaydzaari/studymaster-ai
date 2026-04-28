import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
];

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--accent)" />
    <path d="M8 8h8M8 12h6M8 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function Header({ theme, onToggleTheme, lang, onChangeLang, streak, onOpenMenu }) {
  const { t } = useTranslation();
  const { isMobile, isTablet } = useIsMobile();

  const headerHeight = isMobile ? 48 : isTablet ? 56 : 60;

  return (
    <header
      data-theme-header={theme}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        background: theme === "dark"
          ? "rgba(9,9,11,0.88)"
          : "rgba(250,250,249,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "0 12px" : "0 24px",
        gap: 12,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <Logo />
        {!isMobile && (
          <span style={{
            fontSize: isTablet ? 16 : 18,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}>
            StudyMaster
          </span>
        )}
      </div>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexShrink: 0 }}>
        {/* Streak — show on tablet & desktop */}
        {!isMobile && streak > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
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

        {/* Language selector — desktop only */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => onChangeLang(l.code)}
                style={{
                  padding: "5px 9px",
                  height: 36,
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
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle theme"
          style={{
            width: isMobile ? 40 : 36,
            height: isMobile ? 40 : 36,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
            color: "var(--text-primary)",
            flexShrink: 0,
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* IA Master badge — desktop only */}
        {!isMobile && !isTablet && (
          <div style={{
            background: "var(--accent)",
            color: "white",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            IA Master 2
          </div>
        )}

        {/* Hamburger — mobile & tablet only */}
        {(isMobile || isTablet) && (
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            style={{
              width: 40, height: 40,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <span style={{ width: 16, height: 2, background: "var(--text-primary)", borderRadius: 1 }} />
            <span style={{ width: 12, height: 2, background: "var(--text-primary)", borderRadius: 1 }} />
            <span style={{ width: 16, height: 2, background: "var(--text-primary)", borderRadius: 1 }} />
          </button>
        )}
      </div>
    </header>
  );
}

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
];

const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <rect width="30" height="30" rx="8" fill="var(--accent)" />
    {/* Graduation cap */}
    <path d="M15 9L22 13l-7 4-7-4L15 9Z" fill="white" />
    <path d="M11 14.5v4c0 2.2 1.8 4 4 4s4-1.8 4-4v-4" fill="white" fillOpacity="0.35" />
    <path d="M22 13v4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="22" cy="18.5" r="1.5" fill="white" />
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
          ? "rgba(9,9,11,0.92)"
          : "rgba(250,250,249,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "0 12px" : "0 28px",
        gap: 12,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <Logo size={isMobile ? 26 : 30} />
        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{
              fontSize: isTablet ? 15 : 17,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}>
              StudyMaster
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginTop: 1,
            }}>
              AI
            </span>
          </div>
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
          <div data-demo-id="lang-selector" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => onChangeLang(l.code)}
                style={{
                  padding: "5px 9px",
                  height: 34,
                  borderRadius: 6,
                  border: "none",
                  background: lang === l.code ? "var(--accent)" : "transparent",
                  color: lang === l.code ? "white" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
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
            width: isMobile ? 40 : 34,
            height: isMobile ? 40 : 34,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15,
            color: "var(--text-primary)",
            flexShrink: 0,
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* IA Master badge — desktop only */}
        {!isMobile && !isTablet && (
          <div style={{
            background: "linear-gradient(135deg, var(--accent), #0891B2)",
            color: "white",
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
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

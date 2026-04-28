import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇲🇦" },
];

export default function HamburgerMenu({
  isOpen, onClose,
  lang, onChangeLang,
  theme, onToggleTheme,
  onShowShortcuts,
}) {
  const isRTL = lang === "ar";
  const slideX = isRTL ? -300 : 300;
  const sidePos = isRTL
    ? { left: 0, right: "auto", borderRight: "1px solid var(--border)" }
    : { right: 0, left: "auto", borderLeft: "1px solid var(--border)" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 300,
            }}
          />

          <motion.div
            key="drawer"
            initial={{ x: slideX }}
            animate={{ x: 0 }}
            exit={{ x: slideX }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              ...sidePos,
              width: "min(82vw, 300px)",
              background: "var(--bg-card)",
              zIndex: 301,
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              paddingTop: "max(16px, env(safe-area-inset-top))",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              overflowY: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Header row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--accent)" />
                  <path d="M8 8h8M8 12h6M8 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                  StudyMaster
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  width: 40, height: 40,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                  fontSize: 20,
                  color: "var(--text-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Language */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em",
              }}>
                Language
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { onChangeLang(l.code); onClose(); }}
                    style={{
                      padding: "13px 14px",
                      borderRadius: 10,
                      border: `1px solid ${lang === l.code ? "var(--accent)" : "var(--border)"}`,
                      background: lang === l.code ? "var(--accent-light)" : "var(--bg-secondary)",
                      color: lang === l.code ? "var(--accent)" : "var(--text-primary)",
                      fontSize: 15,
                      fontWeight: lang === l.code ? 600 : 400,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      textAlign: "start",
                      width: "100%",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{l.flag}</span>
                    <span style={{ flex: 1 }}>{l.label}</span>
                    {lang === l.code && (
                      <span style={{ fontSize: 13, color: "var(--accent)" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Theme */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em",
              }}>
                Appearance
              </div>
              <button
                onClick={onToggleTheme}
                style={{
                  width: "100%", padding: "13px 14px",
                  borderRadius: 10, border: "1px solid var(--border)",
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, textAlign: "start",
                }}
              >
                <span style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </section>

            {/* More */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em",
              }}>
                More
              </div>
              <button
                onClick={() => { onShowShortcuts(); onClose(); }}
                style={{
                  width: "100%", padding: "13px 14px",
                  borderRadius: 10, border: "1px solid var(--border)",
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, textAlign: "start",
                }}
              >
                <span style={{ fontSize: 18 }}>⌨️</span>
                <span>Keyboard Shortcuts</span>
              </button>
            </section>

            {/* Footer */}
            <div style={{
              marginTop: "auto",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 12,
              lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>StudyMaster AI v1.0</div>
              <div>IA Master 2 · Kazakoo × IPSE Morocco</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

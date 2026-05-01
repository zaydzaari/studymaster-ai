import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const FEATURE_META = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M21 20l1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: "#2563EB", bg: "#EFF6FF",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: "#0891B2", bg: "#ECFEFF",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#059669", bg: "#ECFDF5",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="4" cy="6" r="2" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="20" cy="6" r="2" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="4" cy="18" r="2" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="20" cy="18" r="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M6 6.8L10 10M14 10l4-3.2M6 17.2L10 14M14 14l4 3.2" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
    color: "#D97706", bg: "#FFFBEB",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2 3.5V15h-4v-1.5C8.8 12.8 8 11.5 8 10Z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 19h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: "#0284C7", bg: "#F0F9FF",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 15c-3.3 0-6-2.7-6-6V6l6-3 6 3v3c0 3.3-2.7 6-6 6Z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 15v4M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: "#DC2626", bg: "#FEF2F2",
  },
];

const STEP_NUMS = ["1", "2", "3"];

export default function EmptyState({ onDemo }) {
  const { t } = useTranslation();

  const features = FEATURE_META.map((m, i) => ({
    ...m,
    title: t(`landing.f${i}title`),
    desc: t(`landing.f${i}desc`),
  }));

  const steps = STEP_NUMS.map((n, i) => ({
    n,
    title: t(`landing.s${i + 1}title`),
    desc: t(`landing.s${i + 1}desc`),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      style={{ padding: "8px 0 32px" }}
    >
      {/* ── Hero ── */}
      <div style={{ textAlign: "center", marginBottom: 48, padding: "0 16px" }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--accent-light)", color: "var(--accent)",
          padding: "4px 14px", borderRadius: 999,
          fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
          border: "1px solid rgba(37,99,235,0.2)",
          marginBottom: 20,
        }}>
          ✦ {t("landing.badge")}
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(26px, 5vw, 44px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          lineHeight: 1.15,
          maxWidth: 680,
          margin: "0 auto 16px",
        }}>
          {t("landing.headline")}{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent), #0891B2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {t("landing.headlineAccent")}
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 16,
          color: "var(--text-secondary)",
          maxWidth: 520,
          lineHeight: 1.7,
          margin: "0 auto 24px",
        }}>
          {t("landing.subtitle")}
        </p>

        {/* Direction hint — sits above the button, prominent */}
        <motion.div
          className="empty-hint-desktop"
          animate={{ x: [-3, 3, -3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 18px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          {t("landing.hintDesktop")}
        </motion.div>

        <motion.div
          className="empty-hint-mobile"
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            display: "none", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "8px 18px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          {t("landing.hintMobile")}
        </motion.div>

        {/* Demo button — standalone below the hint */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDemo}
            style={{
              padding: "12px 28px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
              transition: "box-shadow 0.2s",
            }}
          >
            ▶ {t("landing.watchDemo")}
          </motion.button>
        </div>
      </div>

      {/* ── Features grid ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-muted)",
          textAlign: "center", marginBottom: 20,
        }}>
          {t("landing.featuresTitle")}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                padding: "16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: f.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: f.color, flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-muted)",
          textAlign: "center", marginBottom: 20,
        }}>
          {t("landing.stepsTitle")}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}>
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              style={{
                padding: "18px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "white",
                fontFamily: "'Geist Mono', monospace",
              }}>
                {s.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {s.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {s.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

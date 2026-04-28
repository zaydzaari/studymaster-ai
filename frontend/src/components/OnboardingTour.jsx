import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const STEPS = [
  {
    title: "Welcome to StudyMaster AI",
    desc: "Paste any course content here",
    emoji: "📝",
  },
  {
    title: "Generate your study package",
    desc: "Click to generate your study package",
    emoji: "✨",
  },
  {
    title: "Study smarter",
    desc: "Get summaries, flashcards and quizzes instantly",
    emoji: "🎓",
  },
];

export default function OnboardingTour({ onDone }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else onDone();
  };

  const s = STEPS[step];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onDone}
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          zIndex: 700,
        }}
      />

      {/* Tooltip */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-lg)",
          padding: 32,
          zIndex: 701,
          width: 360,
          maxWidth: "90vw",
          textAlign: "center",
        }}
      >
        <button
          onClick={onDone}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "var(--text-muted)",
          }}
        >
          {t("onboarding.skip")}
        </button>

        <div style={{ fontSize: 48, marginBottom: 16 }}>{s.emoji}</div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
          {s.title}
        </h3>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
          {s.desc}
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background: i === step ? "var(--accent)" : "var(--border)",
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            padding: "10px 28px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {step < STEPS.length - 1 ? t("onboarding.next") : t("onboarding.done")}
        </button>
      </motion.div>
    </>
  );
}

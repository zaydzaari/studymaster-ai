import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import SkeletonLoader from "./SkeletonLoader.jsx";
import ProgressBar from "./ProgressBar.jsx";
import SummaryView from "./SummaryView.jsx";
import FlashcardView from "./FlashcardView.jsx";
import QuizView from "./QuizView.jsx";
import QuestionsView from "./QuestionsView.jsx";
import PomodoroTimer from "./PomodoroTimer.jsx";
import ExportButton from "./ExportButton.jsx";
import { exportToPDF } from "../utils/pdfExport.js";

const DIFFICULTY_STYLE = {
  easy: { bg: "#D1FAE5", color: "#065F46" },
  medium: { bg: "#FEF3C7", color: "#78350F" },
  hard: { bg: "#FEE2E2", color: "#7F1D1D" },
  beginner: { bg: "#D1FAE5", color: "#065F46" },
  intermediate: { bg: "#FEF3C7", color: "#78350F" },
  advanced: { bg: "#FEE2E2", color: "#7F1D1D" },
};

export default function ResultsPanel({
  result, streamText, streaming, error,
  lang, activeTab, setActiveTab,
  onQuizComplete, onFlashcardsViewed, addToast,
}) {
  const { t } = useTranslation();
  const [showDeepDive, setShowDeepDive] = useState(false);

  const TABS = [
    { key: "summary", label: t("results.tabs.summary") },
    { key: "keyPoints", label: t("results.tabs.keyPoints") },
    { key: "objectives", label: t("results.tabs.objectives") },
    { key: "questions", label: t("results.tabs.questions") },
    { key: "flashcards", label: t("results.tabs.flashcards") },
    { key: "quiz", label: t("results.tabs.quiz") },
  ];

  const tabUnlocked = [
    true,
    !!result,
    !!result,
    !!result,
    !!result,
    !!result,
  ];

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        gap: 16,
        color: "var(--error)",
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{error}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Please try again</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header bar */}
      {result && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}>
              {result.meta?.title || "Study Package"}
            </span>
            {result.meta?.difficulty && (
              <span style={{
                background: DIFFICULTY_STYLE[result.meta.difficulty]?.bg || "#EFF6FF",
                color: DIFFICULTY_STYLE[result.meta.difficulty]?.color || "#1D4ED8",
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
              }}>
                {t(`difficulty.${result.meta.difficulty}`)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <PomodoroTimer addToast={addToast} />
            <ExportButton onExport={() => exportToPDF(result)} />
          </div>
        </div>
      )}

      {/* Progress bar during streaming */}
      <ProgressBar streaming={streaming} streamText={streamText} />

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        marginBottom: 20,
        overflowX: "auto",
        gap: 0,
      }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => tabUnlocked[i] && setActiveTab(i)}
            style={{
              padding: "10px 14px",
              border: "none",
              background: "transparent",
              color: activeTab === i
                ? "var(--accent)"
                : tabUnlocked[i] ? "var(--text-secondary)" : "var(--text-muted)",
              borderBottom: activeTab === i ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: 13,
              fontWeight: activeTab === i ? 500 : 400,
              cursor: tabUnlocked[i] ? "pointer" : "not-allowed",
              transition: "color 0.15s",
              marginBottom: -1,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: tabUnlocked[i] ? 1 : 0.5,
            }}
          >
            {tab.label}
            {!tabUnlocked[i] && streaming && (
              <span style={{
                width: 6,
                height: 6,
                background: "var(--accent)",
                borderRadius: "50%",
                animation: "pulse 1s infinite",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {!result && streaming && <SkeletonLoader />}

      {result && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && (
              <SummaryView result={result} lang={lang} addToast={addToast} />
            )}
            {activeTab === 1 && (
              <KeyPointsView result={result} addToast={addToast} />
            )}
            {activeTab === 2 && (
              <ObjectivesView result={result} />
            )}
            {activeTab === 3 && (
              <QuestionsView result={result} addToast={addToast} />
            )}
            {activeTab === 4 && (
              <FlashcardView
                result={result}
                onViewed={onFlashcardsViewed}
                addToast={addToast}
              />
            )}
            {activeTab === 5 && (
              <QuizView
                result={result}
                onComplete={onQuizComplete}
                addToast={addToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function KeyPointsView({ result, addToast }) {
  const { t } = useTranslation();
  return (
    <div>
      <SectionHeader title={t("results.keyPoints")} content={(result.keyPoints || []).join("\n")} addToast={addToast} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(result.keyPoints || []).map((point, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "12px 16px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <span style={{
              width: 24,
              height: 24,
              background: "var(--accent-light)",
              color: "var(--accent)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 12,
              flexShrink: 0,
              fontFamily: "'Geist Mono', monospace",
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, flex: 1 }}>
              {point}
            </span>
          </motion.div>
        ))}
      </div>

      {result.concepts?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 10 }}>
            {t("results.concepts")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {result.concepts.map((c, i) => (
              <span key={i} style={{
                padding: "4px 12px",
                background: "var(--accent-light)",
                color: "var(--accent)",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid rgba(37,99,235,0.2)",
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectivesView({ result }) {
  const { t } = useTranslation();
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        {t("results.objectives")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(result.learningObjectives || []).map((obj, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "14px 16px",
              background: "var(--accent-light)",
              borderRadius: 8,
              border: "1px solid rgba(37,99,235,0.15)",
            }}
          >
            <span style={{
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Geist Mono', monospace",
              minWidth: 20,
            }}>
              {i + 1}.
            </span>
            <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>
              {obj}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, content, addToast }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    addToast?.(t("actions.copied"), "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
      <button
        onClick={copy}
        style={{
          padding: "4px 10px",
          background: copied ? "var(--success-light)" : "var(--bg-secondary)",
          border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
          borderRadius: 6,
          fontSize: 12,
          color: copied ? "var(--success)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {copied ? "✓ " + t("actions.copied") : t("actions.copy")}
      </button>
    </div>
  );
}

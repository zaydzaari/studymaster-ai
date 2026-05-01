import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";
import SkeletonLoader from "./SkeletonLoader.jsx";
import ProgressBar from "./ProgressBar.jsx";
import SummaryView from "./SummaryView.jsx";
import FlashcardView from "./FlashcardView.jsx";
import QuizView from "./QuizView.jsx";
import QuestionsView from "./QuestionsView.jsx";
import MindMapView from "./MindMapView.jsx";
import PomodoroTimer from "./PomodoroTimer.jsx";
import ExportButton from "./ExportButton.jsx";
import { exportToPDF } from "../utils/pdfExport.js";

const DIFFICULTY_STYLE = {
  easy:         { bg: "#D1FAE5", color: "#065F46" },
  medium:       { bg: "#FEF3C7", color: "#78350F" },
  hard:         { bg: "#FEE2E2", color: "#7F1D1D" },
  beginner:     { bg: "#D1FAE5", color: "#065F46" },
  intermediate: { bg: "#FEF3C7", color: "#78350F" },
  advanced:     { bg: "#FEE2E2", color: "#7F1D1D" },
};

export default function ResultsPanel({
  result, streamText, streaming, error,
  lang, activeTab, setActiveTab,
  onQuizComplete, onFlashcardsViewed,
  onGenerateMoreFlashcards, onGenerateMoreQuiz,
  addToast, demoControl, onDeepDiveDebug,
}) {
  const { t } = useTranslation();
  const { isDesktop } = useIsMobile();
  const [visitedTabs, setVisitedTabs] = useState(new Set([0]));
  const [quizDone, setQuizDone] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const TABS = [
    { key: "summary",    label: t("results.tabs.summary") },
    { key: "keyPoints",  label: t("results.tabs.keyPoints") },
    { key: "objectives", label: t("results.tabs.objectives") },
    { key: "questions",  label: t("results.tabs.questions") },
    { key: "flashcards", label: t("results.tabs.flashcards") },
    { key: "quiz",       label: t("results.tabs.quiz") },
    { key: "mindmap",    label: "Mind Map" },
  ];

  const tabUnlocked = [true, !!result, !!result, !!result, !!result, !!result, !!result];

  useEffect(() => {
    if (result) setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab, result]);

  const handleQuizComplete = (score, total) => {
    setQuizDone(true);
    onQuizComplete?.(score, total);
  };

  const handleGenerateMoreFlashcards = async () => {
    if (generatingFlashcards) return;
    setGeneratingFlashcards(true);
    try { await onGenerateMoreFlashcards?.(); }
    finally { setGeneratingFlashcards(false); }
  };

  const handleGenerateMoreQuiz = async () => {
    if (generatingQuiz) return;
    setGeneratingQuiz(true);
    try { await onGenerateMoreQuiz?.(); }
    finally { setGeneratingQuiz(false); }
  };

  const progressPct = result ? Math.round((visitedTabs.size / TABS.length) * 100) : 0;

  if (error) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: 300, gap: 16, color: "var(--error)",
      }}>
        <div style={{ fontSize: 32 }}>!</div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{error}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Please try again</div>
      </div>
    );
  }

  const contentArea = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {activeTab === 0 && demoControl?.streamingSummary != null ? (
          <DemoStreamingView text={demoControl.streamingSummary} />
        ) : activeTab === 0 ? (
          <SummaryView result={result} lang={lang} addToast={addToast} demoControl={demoControl} onDebug={onDeepDiveDebug} />
        ) : null}
        {activeTab === 1 && <KeyPointsView result={result} addToast={addToast} />}
        {activeTab === 2 && <ObjectivesView result={result} />}
        {activeTab === 3 && <QuestionsView result={result} addToast={addToast} />}
        {activeTab === 4 && (
          <FlashcardView
            result={result}
            onViewed={onFlashcardsViewed}
            addToast={addToast}
            demoControl={demoControl}
            onGenerateMore={handleGenerateMoreFlashcards}
            generatingMore={generatingFlashcards}
          />
        )}
        {activeTab === 5 && (
          <QuizView
            result={result}
            onComplete={handleQuizComplete}
            addToast={addToast}
            demoControl={demoControl}
            onGenerateMore={handleGenerateMoreQuiz}
            generatingMore={generatingQuiz}
          />
        )}
        {activeTab === 6 && <MindMapView result={result} />}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Progress bar during streaming */}
      <ProgressBar streaming={streaming} streamText={streamText} />

      {/* Course Card */}
      {result && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
                  {result.meta?.title || "Study Package"}
                </h2>
                {result.meta?.difficulty && (
                  <span style={{
                    background: DIFFICULTY_STYLE[result.meta.difficulty]?.bg || "#EEF2FF",
                    color: DIFFICULTY_STYLE[result.meta.difficulty]?.color || "#4338CA",
                    padding: "2px 8px", borderRadius: 999,
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {t(`difficulty.${result.meta.difficulty}`, { defaultValue: result.meta.difficulty })}
                  </span>
                )}
                {result.meta?.subject && (
                  <span style={{
                    background: "var(--bg-secondary)", color: "var(--text-secondary)",
                    padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                    border: "1px solid var(--border)",
                  }}>
                    {result.meta.subject}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                {result.meta?.summaryReadingTime && <span>~{result.meta.summaryReadingTime} min summary</span>}
                {result.flashcards?.length > 0 && <span>{result.flashcards.length} flashcards</span>}
                {result.quiz?.length > 0 && <span>{result.quiz.length} quiz questions</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <PomodoroTimer addToast={addToast} />
              <ExportButton onExport={() => exportToPDF(result)} />
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
              <span>Your progress</span>
              <span style={{ fontWeight: 600, color: progressPct === 100 ? "var(--success)" : "var(--accent)" }}>{progressPct}%</span>
            </div>
            <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: 999 }}>
              <motion.div
                animate={{ width: `${progressPct}%` }}
                style={{
                  height: "100%", borderRadius: 999,
                  background: progressPct === 100 ? "var(--success)" : "var(--accent)",
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop: sidebar + content */}
      {isDesktop && result ? (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Sidebar */}
          <nav style={{
            width: 200, flexShrink: 0,
            position: "sticky", top: 20,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 0",
            overflow: "hidden",
          }}>
            {TABS.map((tab, i) => {
              const active = activeTab === i;
              const locked = !tabUnlocked[i];
              const done = visitedTabs.has(i);
              return (
                <button
                  key={i}
                  onClick={() => !locked && setActiveTab(i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8, padding: "10px 14px",
                    background: active ? "var(--accent-light)" : "transparent",
                    border: "none",
                    borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    color: active ? "var(--accent)" : locked ? "var(--text-muted)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    cursor: locked ? "not-allowed" : "pointer",
                    textAlign: "left", opacity: locked ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!active && !locked) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {done && !locked && (
                    <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                  {locked && streaming && (
                    <span style={{ width: 6, height: 6, background: "var(--accent)", borderRadius: "50%", animation: "pulse 1s infinite", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!result && streaming && <SkeletonLoader />}
            {result && contentArea}
          </div>
        </div>
      ) : (
        /* Mobile / tablet: horizontal tabs */
        <>
          {!result && streaming && <SkeletonLoader />}
          {result && (
            <>
              <div
                data-demo-id="tabs-row"
                className="tabs-scroll"
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 20,
                  overflowX: "auto",
                  gap: 0,
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {TABS.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => tabUnlocked[i] && setActiveTab(i)}
                    style={{
                      padding: "12px 14px", border: "none",
                      background: "transparent",
                      color: activeTab === i ? "var(--accent)" : tabUnlocked[i] ? "var(--text-secondary)" : "var(--text-muted)",
                      borderBottom: activeTab === i ? "2px solid var(--accent)" : "2px solid transparent",
                      fontSize: 13, fontWeight: activeTab === i ? 600 : 400,
                      cursor: tabUnlocked[i] ? "pointer" : "not-allowed",
                      transition: "color 0.15s", marginBottom: -1,
                      whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 6,
                      opacity: tabUnlocked[i] ? 1 : 0.5, minHeight: 44,
                      touchAction: "manipulation",
                    }}
                  >
                    {tab.label}
                    {visitedTabs.has(i) && tabUnlocked[i] && activeTab !== i && (
                      <span style={{ color: "var(--success)", fontSize: 10 }}>✓</span>
                    )}
                    {!tabUnlocked[i] && streaming && (
                      <span style={{ width: 6, height: 6, background: "var(--accent)", borderRadius: "50%", animation: "pulse 1s infinite" }} />
                    )}
                  </button>
                ))}
              </div>
              {contentArea}
            </>
          )}
        </>
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
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: "12px 16px",
              background: "var(--bg-secondary)", borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <span style={{
              width: 24, height: 24,
              background: "var(--accent-light)", color: "var(--accent)",
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 11, flexShrink: 0,
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
                background: "var(--accent-light)", color: "var(--accent)",
                borderRadius: 999, fontSize: 12, fontWeight: 500,
                border: "1px solid rgba(79,70,229,0.2)",
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
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: "14px 16px",
              background: "var(--accent-light)", borderRadius: 8,
              border: "1px solid rgba(79,70,229,0.15)",
            }}
          >
            <span style={{
              color: "var(--accent)", fontWeight: 700, fontSize: 14,
              fontFamily: "'Geist Mono', monospace", minWidth: 20,
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

function DemoStreamingView({ text }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Summary
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-primary)", whiteSpace: "pre-wrap", minHeight: 120 }}>
        {text}
        <span className="cursor" />
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
      <button
        onClick={copy}
        style={{
          padding: "4px 10px",
          background: copied ? "var(--success-light)" : "var(--bg-secondary)",
          border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
          borderRadius: 6, fontSize: 12,
          color: copied ? "var(--success)" : "var(--text-secondary)",
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        {copied ? "✓ " + t("actions.copied") : t("actions.copy")}
      </button>
    </div>
  );
}

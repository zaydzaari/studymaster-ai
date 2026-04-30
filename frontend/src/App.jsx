import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Header from "./components/Header.jsx";
import StatsBar from "./components/StatsBar.jsx";
import InputPanel from "./components/InputPanel.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import EmptyState from "./components/EmptyState.jsx";
import OnboardingTour from "./components/OnboardingTour.jsx";
import KeyboardShortcuts from "./components/KeyboardShortcuts.jsx";
import HamburgerMenu from "./components/HamburgerMenu.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Toast from "./components/Toast.jsx";
import DemoRunner from "./components/DemoRunner.jsx";
import VoiceTutor from "./components/VoiceTutor.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useLanguage } from "./hooks/useLanguage.js";
import { useStats } from "./hooks/useStats.js";
import { useStreak } from "./hooks/useStreak.js";
import { useHistory } from "./hooks/useHistory.js";
import { useStreaming } from "./hooks/useStreaming.js";
import { useKeyboard } from "./hooks/useKeyboard.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { getSummarizeTextUrl, getSummarizePDFUrl, getSummarizeURLUrl } from "./utils/api.js";

// Map bottom nav tab index → results panel tab index
const BOTTOM_TO_RESULTS = { 0: 0, 1: 3, 2: 4, 3: 5 };
const RESULTS_TO_BOTTOM = { 0: 0, 1: -1, 2: -1, 3: 1, 4: 2, 5: 3 };

export default function App() {
  const { t } = useTranslation();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, changeLanguage } = useLanguage();
  const { stats, increment } = useStats();
  const { streak, recordUsage } = useStreak();
  const { history, addEntry, removeEntry } = useHistory();
  const { stream, streamText, streaming, result, error, abort } = useStreaming();
  const { isMobile, isTablet, isDesktop } = useIsMobile();

  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState("text");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem("sm-tour-done"));
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const submitRef = useRef(null);

  // ── Demo mode state ───────────────────────────────────────────────
  const [demoActive, setDemoActive] = useState(false);
  const [demoKey, setDemoKey] = useState(0); // increment to force remount
  const [demoResult, setDemoResult] = useState(null);
  const [demoStreaming, setDemoStreaming] = useState(false);
  const [demoStreamingSummary, setDemoStreamingSummary] = useState(null);
  const [demoFlashcard, setDemoFlashcard] = useState(null);
  const [demoQuiz, setDemoQuiz] = useState(null);
  const [demoLangResult, setDemoLangResult] = useState(null); // overrides result during language showcase
  const [demoTtsActive, setDemoTtsActive] = useState(false);  // drives SummaryView listen button

  // Refs so resetDemoState (empty deps) can always see fresh values
  const preDemoLangRef = useRef("en"); // language before demo started
  const changeLangRef = useRef(changeLanguage);
  changeLangRef.current = changeLanguage;

  // Header height varies by breakpoint
  const headerHeight = isMobile ? 48 : isTablet ? 56 : 60;
  // On desktop, stats bar adds 48px
  const topOffset = isDesktop ? headerHeight + 48 : headerHeight;

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleSubmitText = useCallback(async (content, outputLang) => {
    if (!content.trim() || streaming) return;
    addEntry(content, "text");
    recordUsage();
    increment("summaries");
    await stream(getSummarizeTextUrl(), {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, language: outputLang }),
    });
  }, [streaming, stream, addEntry, recordUsage, increment]);

  const handleSubmitPDF = useCallback(async (file, outputLang) => {
    if (!file || streaming) return;
    addEntry(file.name, "pdf");
    recordUsage();
    increment("summaries");
    const form = new FormData();
    form.append("pdf", file);
    if (outputLang) form.append("language", outputLang);
    await stream(getSummarizePDFUrl(), { body: form });
  }, [streaming, stream, addEntry, recordUsage, increment]);

  const handleSubmitURL = useCallback(async (url, outputLang) => {
    if (!url.trim() || streaming) return;
    addEntry(url, "url");
    recordUsage();
    increment("summaries");
    await stream(getSummarizeURLUrl(), {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, language: outputLang }),
    });
  }, [streaming, stream, addEntry, recordUsage, increment]);

  const resetDemoState = useCallback(() => {
    changeLangRef.current(preDemoLangRef.current); // restore pre-demo language
    window.speechSynthesis?.cancel();              // stop any demo TTS
    setDemoActive(false);
    setDemoResult(null);
    setDemoStreaming(false);
    setDemoStreamingSummary(null);
    setDemoFlashcard(null);
    setDemoQuiz(null);
    setDemoLangResult(null);
    setDemoTtsActive(false);
    setInputText("");
    setActiveTab(0);
  }, []);

  const handleDemo = useCallback(() => {
    preDemoLangRef.current = lang; // save current language before demo touches it
    resetDemoState();
    setDemoKey(k => k + 1);
    setDemoActive(true);
  }, [resetDemoState, lang]);

  const handleDemoStop = useCallback(() => {
    resetDemoState();
  }, [resetDemoState]);

  const handleDemoRestart = useCallback(() => {
    resetDemoState();
    setTimeout(() => {
      setDemoKey(k => k + 1);
      setDemoActive(true);
    }, 80);
  }, [resetDemoState]);

  const handleQuizComplete = useCallback((score, total) => {
    increment("quizzes");
    if (score === total) {
      addToast(t("quiz.perfect"), "success");
    }
  }, [increment, addToast, t]);

  const handleFlashcardsViewed = useCallback(() => {
    increment("flashcards", 6);
  }, [increment]);

  // Bottom nav tab change: map bottom index → results panel index
  const handleBottomTabChange = useCallback((bottomIdx) => {
    const resultsIdx = BOTTOM_TO_RESULTS[bottomIdx] ?? 0;
    setActiveTab(resultsIdx);
  }, []);

  // Which bottom nav tab is active
  const activeBottomTab = RESULTS_TO_BOTTOM[activeTab] ?? -1;
  // Find the closest bottom nav tab index
  const displayedBottomTab = activeBottomTab >= 0 ? activeBottomTab : 0;

  useKeyboard([
    {
      key: "?",
      action: () => setShowShortcuts(true),
      allowTyping: false,
    },
    {
      key: "Escape",
      action: () => { setShowShortcuts(false); setMenuOpen(false); },
      allowTyping: true,
    },
    {
      key: "Enter",
      ctrl: true,
      action: () => submitRef.current?.click(),
      allowTyping: true,
    },
    ...([0, 1, 2, 3, 4, 5].map(i => ({
      key: String(i + 1),
      action: () => result && setActiveTab(i),
      allowTyping: false,
    }))),
  ]);

  const inputPanelProps = {
    inputText, setInputText,
    inputType, setInputType,
    onSubmitText: handleSubmitText,
    onSubmitPDF: handleSubmitPDF,
    onSubmitURL: handleSubmitURL,
    streaming, history,
    onRemoveHistory: removeEntry,
    lang, submitRef,
  };

  // In demo mode, override display state with demo-controlled values
  // demoLangResult overlays demoResult during the language showcase act
  const displayResult   = demoActive ? (demoLangResult || demoResult) : result;
  const displayStreaming = demoActive ? demoStreaming : streaming;
  const displayStreamText = demoActive ? "" : streamText;
  const displayError    = demoActive ? null         : error;
  const demoControl     = demoActive ? {
    flashcard: demoFlashcard,
    quiz: demoQuiz,
    streamingSummary: demoStreamingSummary,
    ttsActive: demoTtsActive,
  } : null;

  const resultsPanelProps = {
    result: displayResult,
    streamText: displayStreamText,
    streaming: displayStreaming,
    error: displayError,
    lang,
    activeTab, setActiveTab,
    onQuizComplete: handleQuizComplete,
    onFlashcardsViewed: handleFlashcardsViewed,
    addToast,
    demoControl,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        lang={lang}
        onChangeLang={changeLanguage}
        streak={streak}
        onOpenMenu={() => setMenuOpen(true)}
      />

      {/* Stats bar — desktop/tablet only (hidden on mobile via CSS) */}
      <StatsBar stats={stats} />

      {/* ── MOBILE LAYOUT ── */}
      {(isMobile || isTablet) && (
        <div style={{
          paddingTop: headerHeight,
          paddingBottom: isMobile ? "calc(56px + env(safe-area-inset-bottom, 0px))" : 0,
          minHeight: "100vh",
        }}>
          {/* Sticky input panel */}
          <div style={{
            position: "sticky",
            top: headerHeight,
            zIndex: 50,
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
          }}>
            <InputPanel {...inputPanelProps} />
          </div>

          {/* Results */}
          <div style={{
            padding: isMobile ? "16px 12px" : "20px 20px",
            minHeight: 200,
          }}>
            <AnimatePresence mode="wait">
              {!displayResult && !displayStreaming && !displayStreamText && !demoActive ? (
                <EmptyState key="empty" onDemo={handleDemo} />
              ) : (
                <ResultsPanel key="results" {...resultsPanelProps} />
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── DESKTOP LAYOUT ── */}
      {isDesktop && (
        <main style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "24px",
          marginTop: topOffset,
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
        }}>
          {/* Left panel */}
          <div style={{
            width: "40%",
            minWidth: 320,
            position: "sticky",
            top: topOffset + 16,
            flexShrink: 0,
          }}>
            <InputPanel {...inputPanelProps} />
          </div>

          {/* Right panel */}
          <div style={{
            flex: 1,
            minWidth: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
            minHeight: "calc(100vh - 160px)",
          }}>
            <AnimatePresence mode="wait">
              {!displayResult && !displayStreaming && !displayStreamText && !demoActive ? (
                <EmptyState key="empty" onDemo={handleDemo} />
              ) : (
                <ResultsPanel key="results" {...resultsPanelProps} />
              )}
            </AnimatePresence>
          </div>
        </main>
      )}

      {/* Bottom navigation — mobile only */}
      {isMobile && (
        <BottomNav
          activeTab={displayedBottomTab}
          onTabChange={handleBottomTabChange}
          hasResult={!!displayResult}
        />
      )}

      {/* Toasts */}
      <div style={{
        position: "fixed",
        bottom: demoActive ? 72 : (isMobile ? "calc(64px + env(safe-area-inset-bottom, 0px))" : 24),
        right: 24,
        zIndex: 10002,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} />
          ))}
        </AnimatePresence>
      </div>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>

      {/* Hamburger menu — mobile & tablet */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        lang={lang}
        onChangeLang={changeLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Onboarding tour */}
      <AnimatePresence>
        {showTour && (
          <OnboardingTour onDone={() => {
            setShowTour(false);
            localStorage.setItem("sm-tour-done", "1");
          }} />
        )}
      </AnimatePresence>

      {/* Cinematic demo runner */}
      {demoActive && (
        <DemoRunner
          key={demoKey}
          onSetInputText={setInputText}
          onSetResult={setDemoResult}
          onSetStreaming={setDemoStreaming}
          onSetStreamingSummary={setDemoStreamingSummary}
          onSetActiveTab={setActiveTab}
          onSetFlashcard={setDemoFlashcard}
          onSetQuiz={setDemoQuiz}
          onToggleTheme={toggleTheme}
          onChangeLanguage={changeLanguage}
          onSetDemoLangResult={setDemoLangResult}
          onSetDemoTtsActive={setDemoTtsActive}
          onStop={handleDemoStop}
          onRestart={handleDemoRestart}
          addToast={addToast}
        />
      )}
    </div>
  );
}

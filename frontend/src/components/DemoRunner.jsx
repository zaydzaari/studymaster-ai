import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import { DEMO_TYPING_TEXT, DEMO_RESULT } from "../data/demoData.js";

const ACT_NAMES = [
  "", "Input", "Loading", "Streaming Results",
  "Flashcards", "Quiz", "Celebration", "Premium Features", "Finale",
];

const LOADING_STEPS = [
  { label: "📄 Extracting content...",     progress: 15,  duration: 600  },
  { label: "🧠 Sending to Gemini AI...",   progress: 40,  duration: 1000 },
  { label: "✍️ Generating summary...",     progress: 60,  duration: 1000 },
  { label: "📇 Creating flashcards...",    progress: 80,  duration: 900  },
  { label: "📝 Building quiz...",          progress: 95,  duration: 800  },
  { label: "✅ Complete!",                  progress: 100, duration: 500  },
];

const ctrlBtn = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  transition: "background 0.15s",
};

export default function DemoRunner({
  onSetInputText,
  onSetResult,
  onSetStreaming,
  onSetStreamingSummary,
  onSetActiveTab,
  onSetFlashcard,
  onSetQuiz,
  onToggleTheme,
  onStop,
  onRestart,
  addToast,
}) {
  const [act, setAct] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [highlightRect, setHighlightRect] = useState(null);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState("");

  const pausedRef = useRef(false);
  const stoppedRef = useRef(false);

  // Pause-aware sleep
  const sleep = useCallback((ms) => {
    return new Promise(resolve => {
      let elapsed = 0;
      const TICK = 40;
      const step = () => {
        if (stoppedRef.current) { resolve(); return; }
        if (pausedRef.current) { setTimeout(step, TICK); return; }
        elapsed += TICK;
        if (elapsed >= ms) { resolve(); return; }
        setTimeout(step, TICK);
      };
      setTimeout(step, TICK);
    });
  }, []);

  // Type text character by character
  const typeText = useCallback(async (text) => {
    let current = "";
    onSetInputText("");
    for (const char of text) {
      if (stoppedRef.current) return;
      while (pausedRef.current && !stoppedRef.current) {
        await new Promise(r => setTimeout(r, 40));
      }
      if (stoppedRef.current) return;
      current += char;
      onSetInputText(current);
      const delay =
        char === "." || char === "!" || char === "?" ? 90 :
        char === "," ? 35 :
        char === " " ? 18 : 13;
      await new Promise(r => setTimeout(r, delay));
    }
  }, [onSetInputText]);

  // Stream words one by one
  const streamWords = useCallback(async (text, msPerWord = 55) => {
    const words = text.split(" ");
    let acc = "";
    onSetStreamingSummary("");
    for (const word of words) {
      if (stoppedRef.current) return;
      while (pausedRef.current && !stoppedRef.current) {
        await new Promise(r => setTimeout(r, 40));
      }
      if (stoppedRef.current) return;
      acc += (acc ? " " : "") + word;
      onSetStreamingSummary(acc);
      await new Promise(r => setTimeout(r, msPerWord));
    }
  }, [onSetStreamingSummary]);

  // Show tooltip near a DOM element
  const showTip = useCallback((text, selector) => {
    const el = document.querySelector(selector);
    if (!el) {
      setTooltip({ text, x: window.innerWidth / 2, y: 80 });
      return;
    }
    const rect = el.getBoundingClientRect();
    const x = Math.min(rect.left + rect.width / 2, window.innerWidth - 160);
    const y = rect.bottom + 10;
    setTooltip({ text, x, y });
  }, []);

  const hideTip = useCallback(() => setTooltip(null), []);

  // Show pulsing ring around a DOM element
  const showRing = useCallback((selector) => {
    const el = document.querySelector(selector);
    if (!el) { setHighlightRect(null); return; }
    const r = el.getBoundingClientRect();
    setHighlightRect({ top: r.top - 4, left: r.left - 4, width: r.width + 8, height: r.height + 8 });
  }, []);

  const hideRing = useCallback(() => setHighlightRect(null), []);

  // Main demo sequence
  useEffect(() => {
    const run = async () => {

      // ── ACT 1 — INPUT ─────────────────────────────────────────────
      setAct(1);
      await sleep(400);
      showRing('[data-demo-id="input-panel"]');
      showTip("Watch how easy it is to add content →", '[data-demo-id="input-panel"]');
      await sleep(1500);
      hideRing(); hideTip();
      await typeText(DEMO_TYPING_TEXT);
      if (stoppedRef.current) return;
      await sleep(300);
      showRing('[data-demo-id="submit-btn"]');
      showTip("Generating your full study package...", '[data-demo-id="submit-btn"]');
      await sleep(900);
      hideRing(); hideTip();

      // ── ACT 2 — LOADING ───────────────────────────────────────────
      setAct(2);
      onSetStreaming(true);
      setLoadingVisible(true);
      setLoadingProgress(0);
      for (const step of LOADING_STEPS) {
        if (stoppedRef.current) return;
        setLoadingLabel(step.label);
        setLoadingProgress(step.progress);
        await sleep(step.duration);
      }
      setLoadingVisible(false);
      onSetResult(DEMO_RESULT);
      onSetStreaming(false);
      await sleep(400);

      // ── ACT 3 — STREAMING RESULTS ─────────────────────────────────
      setAct(3);
      onSetActiveTab(0);
      onSetStreamingSummary(""); // immediately switch to streaming cursor view
      await sleep(400);
      showTip("Watch your summary appear in real time →", '[data-demo-id="tabs-row"]');
      await sleep(1000);
      hideTip();
      await streamWords(DEMO_RESULT.summary, 52);
      if (stoppedRef.current) return;
      onSetStreamingSummary(null);
      await sleep(1500);

      // ── ACT 4 — FLASHCARDS ────────────────────────────────────────
      setAct(4);
      onSetActiveTab(4);
      showTip("6 flashcards generated — tap to flip →", '[data-demo-id="tabs-row"]');
      await sleep(900);
      hideTip();

      onSetFlashcard({ index: 0, flipped: false, ratings: {} });
      await sleep(1000);
      onSetFlashcard({ index: 0, flipped: true, ratings: {} });
      await sleep(1100);
      onSetFlashcard({ index: 0, flipped: true, ratings: { 0: "easy" } });
      await sleep(700);

      onSetFlashcard({ index: 1, flipped: false, ratings: { 0: "easy" } });
      await sleep(900);
      onSetFlashcard({ index: 1, flipped: true, ratings: { 0: "easy" } });
      await sleep(900);
      onSetFlashcard({ index: 1, flipped: true, ratings: { 0: "easy", 1: "easy" } });
      await sleep(600);

      onSetFlashcard({ index: 2, flipped: false, ratings: { 0: "easy", 1: "easy" } });
      await sleep(800);
      onSetFlashcard({ index: 2, flipped: true, ratings: { 0: "easy", 1: "easy" } });
      await sleep(800);
      onSetFlashcard({ index: 2, flipped: true, ratings: { 0: "easy", 1: "easy", 2: "easy" } });
      await sleep(600);

      // ── ACT 5 — QUIZ ──────────────────────────────────────────────
      setAct(5);
      onSetActiveTab(5);
      showTip("Test your knowledge →", '[data-demo-id="tabs-row"]');
      await sleep(800);
      hideTip();

      const quizSteps = [
        { qIndex: 0, correctAnswer: 1, thinkMs: 900, revealMs: 900 },
        { qIndex: 1, correctAnswer: 2, thinkMs: 600, revealMs: 700 },
        { qIndex: 2, correctAnswer: 3, thinkMs: 500, revealMs: 650 },
        { qIndex: 3, correctAnswer: 2, thinkMs: 500, revealMs: 650 },
        { qIndex: 4, correctAnswer: 1, thinkMs: 700, revealMs: 1000 },
      ];

      let answers = [];
      for (const step of quizSteps) {
        if (stoppedRef.current) return;
        const { qIndex, correctAnswer, thinkMs, revealMs } = step;
        onSetQuiz({ qIndex, selected: null, submitted: false, answers, done: false });
        await sleep(thinkMs);
        onSetQuiz({ qIndex, selected: correctAnswer, submitted: false, answers, done: false });
        await sleep(450);
        answers = [...answers, { selected: correctAnswer, correct: true, qIndex }];
        onSetQuiz({ qIndex, selected: correctAnswer, submitted: true, answers, done: false });
        await sleep(revealMs);
      }

      // ── ACT 6 — CELEBRATION ───────────────────────────────────────
      setAct(6);
      onSetQuiz({ qIndex: 4, selected: 1, submitted: true, answers, done: true });
      await sleep(400);
      setShowConfetti(true);
      addToast("🏆 Perfect Score! You've mastered this content.", "success");
      await sleep(4000);
      setShowConfetti(false);

      // ── ACT 7 — PREMIUM FEATURES ──────────────────────────────────
      setAct(7);
      onSetActiveTab(0);
      await sleep(800);
      addToast("🎙 Playing your summary...", "info");
      await sleep(2000);
      addToast("📄 Study sheet downloaded!", "success");
      await sleep(1500);
      onToggleTheme();
      addToast("🌙 Dark mode looks great too!", "info");
      await sleep(2200);
      onToggleTheme();
      await sleep(800);

      // ── ACT 8 — FINALE ────────────────────────────────────────────
      setAct(8);
      await sleep(300);
      setShowFinale(true);
    };

    run();

    return () => {
      stoppedRef.current = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.matches("input, textarea");
      if (e.code === "Space" && !typing && !showFinale) {
        e.preventDefault();
        const next = !pausedRef.current;
        pausedRef.current = next;
        setPaused(next);
      } else if (e.code === "Escape" && !showFinale) {
        handleStop();
      } else if (e.code === "KeyR" && !typing && !showFinale) {
        handleWatchAgain();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFinale]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    onStop();
  }, [onStop]);

  const handlePauseResume = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
  }, []);

  const handleWatchAgain = useCallback(() => {
    stoppedRef.current = true;
    onRestart();
  }, [onRestart]);

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <ReactConfetti
          numberOfPieces={300}
          recycle={false}
          colors={["#2563EB", "#F59E0B", "#10B981", "#FFFFFF", "#8B5CF6", "#EC4899"]}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}
        />
      )}

      {/* Loading overlay */}
      <AnimatePresence>
        {loadingVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9100,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "28px 36px",
              minWidth: 300,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 14,
              minHeight: 22,
            }}>
              {loadingLabel}
            </div>
            <div style={{
              height: 6,
              background: "var(--bg-secondary)",
              borderRadius: 999,
              overflow: "hidden",
            }}>
              <motion.div
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: loadingProgress >= 100 ? "var(--success)" : "var(--accent)",
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 8,
              fontFamily: "'Geist Mono', monospace",
            }}>
              {loadingProgress}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key={tooltip.text}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed",
              top: Math.min(tooltip.y, window.innerHeight - 60),
              left: Math.max(16, Math.min(tooltip.x, window.innerWidth - 16)),
              transform: "translateX(-50%)",
              zIndex: 9200,
              background: "#18181B",
              color: "white",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              maxWidth: "min(320px, calc(100vw - 32px))",
            }}
          >
            {tooltip.text}
            <div style={{
              position: "absolute",
              top: -5,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderBottom: "5px solid #18181B",
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlight ring */}
      <AnimatePresence>
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="demo-ring"
            style={{
              position: "fixed",
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              borderRadius: 12,
              pointerEvents: "none",
              zIndex: 9190,
            }}
          />
        )}
      </AnimatePresence>

      {/* Finale overlay */}
      <AnimatePresence>
        {showFinale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(9,9,11,0.88)",
              backdropFilter: "blur(12px)",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              padding: 24,
              textAlign: "center",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "48px 40px",
                maxWidth: 440,
                width: "100%",
              }}
            >
              <div style={{ fontSize: 52, marginBottom: 20 }}>🎓</div>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}>
                StudyMaster AI
              </div>
              <div style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 32,
                lineHeight: 1.5,
              }}>
                Turn any content into a complete study package — in seconds.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStop}
                  style={{
                    padding: "12px 24px",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Start with my content
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWatchAgain}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255,255,255,0.12)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ↩ Watch again
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control bar */}
      {!showFinale && (
        <motion.div
          initial={{ y: 64 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9180,
            background: "rgba(9,9,11,0.94)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Progress section */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              marginBottom: 5,
            }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                Act {act} of 8 — {ACT_NAMES[act]}
              </span>
              {paused
                ? <span style={{ color: "#F59E0B", fontWeight: 500 }}>⏸ Paused</span>
                : <span style={{ color: "rgba(255,255,255,0.3)" }}>Space: pause · Esc: stop</span>
              }
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 999 }}>
              <motion.div
                animate={{ width: `${((act - 1) / 8) * 100}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #2563EB, #3B82F6)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={handlePauseResume}
              title={paused ? "Resume (Space)" : "Pause (Space)"}
              style={ctrlBtn}
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={handleStop}
              title="Stop (Esc)"
              style={{ ...ctrlBtn, color: "rgba(255,255,255,0.6)" }}
            >
              ⏹ Stop
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}

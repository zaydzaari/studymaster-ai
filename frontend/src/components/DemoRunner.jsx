import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import { DEMO_TYPING_TEXT, DEMO_RESULT } from "../data/demoData.js";

const ACT_NAMES = [
  "", "Input", "Loading", "Streaming Results",
  "Flashcards", "Quiz", "Celebration", "AI Tutor", "Finale",
];

const LOADING_STEPS = [
  { label: "📄 Extracting content...",    progress: 20,  duration: 400  },
  { label: "🧠 Sending to Gemini AI...", progress: 50,  duration: 700  },
  { label: "✍️ Generating summary...",   progress: 75,  duration: 700  },
  { label: "📇 Creating flashcards...",  progress: 92,  duration: 600  },
  { label: "✅ Complete!",               progress: 100, duration: 400  },
];

const TOTAL_ACTS = 8;

export default function DemoRunner({
  onSetInputText, onSetResult, onSetStreaming, onSetStreamingSummary,
  onSetActiveTab, onSetFlashcard, onSetQuiz, onToggleTheme,
  onChangeLanguage, onSetDemoLangResult, onSetDemoTtsActive,
  onStop, onRestart, addToast,
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

  // Generation counter — invalidates stale async runs (fixes React StrictMode double-invocation)
  const generationRef = useRef(0);
  const pausedRef = useRef(false);
  const propsRef = useRef({});
  propsRef.current = {
    onSetInputText, onSetResult, onSetStreaming, onSetStreamingSummary,
    onSetActiveTab, onSetFlashcard, onSetQuiz, onToggleTheme,
    onChangeLanguage, onSetDemoLangResult, onSetDemoTtsActive,
    addToast, onStop, onRestart,
  };

  // ── Main sequence ───────────────────────────────────────────────
  useEffect(() => {
    pausedRef.current = false;
    const gen = ++generationRef.current;

    function dead() { return generationRef.current !== gen; }

    async function sleep(ms) {
      let remaining = ms;
      let last = Date.now();
      while (remaining > 0) {
        await new Promise(r => setTimeout(r, 40));
        if (dead()) return;
        const now = Date.now();
        if (!pausedRef.current) remaining -= (now - last);
        last = now;
      }
    }

    function showTip(text, selector) {
      try {
        const el = selector ? document.querySelector(selector) : null;
        if (el) {
          const r = el.getBoundingClientRect();
          const x = Math.min(Math.max(r.left + r.width / 2, 160), window.innerWidth - 160);
          const y = Math.min(r.bottom + 12, window.innerHeight - 60);
          setTooltip({ text, x, y });
        } else {
          setTooltip({ text, x: window.innerWidth / 2, y: 120 });
        }
      } catch { setTooltip({ text, x: window.innerWidth / 2, y: 120 }); }
    }

    function showRing(selector) {
      try {
        const el = selector ? document.querySelector(selector) : null;
        if (el) {
          const r = el.getBoundingClientRect();
          setHighlightRect({ top: r.top - 4, left: r.left - 4, width: r.width + 8, height: r.height + 8 });
        }
      } catch { /* ignore */ }
    }

    async function run() {
      try {
        // ── ACT 1 — INPUT ─────────────────────────────────────────
        setAct(1);
        await sleep(400); if (dead()) return;

        showRing('[data-demo-id="input-panel"]');
        showTip("Paste any content — text, PDF, URL, image →", '[data-demo-id="input-panel"]');
        await sleep(1000); if (dead()) return;
        setHighlightRect(null); setTooltip(null);

        // Type faster (8ms per char)
        propsRef.current.onSetInputText?.("");
        let acc = "";
        for (const char of DEMO_TYPING_TEXT) {
          if (dead()) return;
          acc += char;
          propsRef.current.onSetInputText?.(acc);
          const ms = char === "." ? 60 : char === "," ? 22 : char === " " ? 12 : 8;
          await new Promise(r => setTimeout(r, ms));
        }
        if (dead()) return;

        showRing('[data-demo-id="submit-btn"]');
        showTip("Generating your full study package...", '[data-demo-id="submit-btn"]');
        await sleep(700); if (dead()) return;
        setHighlightRect(null); setTooltip(null);

        // ── ACT 2 — LOADING ───────────────────────────────────────
        setAct(2);
        propsRef.current.onSetStreaming?.(true);
        setLoadingVisible(true);
        setLoadingProgress(0);

        for (const step of LOADING_STEPS) {
          if (dead()) return;
          setLoadingLabel(step.label);
          setLoadingProgress(step.progress);
          await sleep(step.duration);
        }
        if (dead()) return;

        setLoadingVisible(false);
        propsRef.current.onSetResult?.(DEMO_RESULT);
        propsRef.current.onSetStreaming?.(false);
        await sleep(400); if (dead()) return;

        // ── ACT 3 — STREAMING RESULTS ─────────────────────────────
        setAct(3);
        propsRef.current.onSetActiveTab?.(0);
        propsRef.current.onSetStreamingSummary?.("");
        await sleep(300); if (dead()) return;

        showTip("Summary streaming in real time →", '[data-demo-id="tabs-row"]');
        await sleep(600); if (dead()) return;
        setTooltip(null);

        // Stream faster: 28ms/word
        const words = DEMO_RESULT.summary.split(" ");
        let sumAcc = "";
        propsRef.current.onSetStreamingSummary?.("");
        for (const word of words) {
          if (dead()) return;
          sumAcc += (sumAcc ? " " : "") + word;
          propsRef.current.onSetStreamingSummary?.(sumAcc);
          await new Promise(r => setTimeout(r, 28));
        }
        propsRef.current.onSetStreamingSummary?.(null);
        await sleep(800); if (dead()) return;

        // ── ACT 4 — FLASHCARDS ────────────────────────────────────
        setAct(4);
        propsRef.current.onSetActiveTab?.(4);
        showTip("Flip flashcards with spaced repetition →", '[data-demo-id="tabs-row"]');
        await sleep(700); if (dead()) return;
        setTooltip(null);

        const flipCard = async (idx, prevRatings) => {
          propsRef.current.onSetFlashcard?.({ index: idx, flipped: false, ratings: prevRatings });
          await sleep(1300); if (dead()) return null;
          propsRef.current.onSetFlashcard?.({ index: idx, flipped: true, ratings: prevRatings });
          await sleep(1500); if (dead()) return null;
          const next = { ...prevRatings, [idx]: "easy" };
          propsRef.current.onSetFlashcard?.({ index: idx, flipped: true, ratings: next });
          await sleep(700);
          return next;
        };

        let ratings = {};
        ratings = (await flipCard(0, ratings)) ?? ratings; if (dead()) return;
        ratings = (await flipCard(1, ratings)) ?? ratings; if (dead()) return;

        // ── ACT 5 — QUIZ ──────────────────────────────────────────
        setAct(5);
        propsRef.current.onSetActiveTab?.(5);
        showTip("Quiz yourself — plausible distractors →", '[data-demo-id="tabs-row"]');
        await sleep(800); if (dead()) return;
        setTooltip(null);

        const QUIZ_CORRECT = [1, 2, 3];
        const THINK_MS    = [1200, 1000, 900];
        const REVEAL_MS   = [1400, 1200, 1300];
        let answers = [];

        for (let qi = 0; qi < QUIZ_CORRECT.length; qi++) {
          if (dead()) return;
          const ca = QUIZ_CORRECT[qi];
          propsRef.current.onSetQuiz?.({ qIndex: qi, selected: null, submitted: false, answers, done: false });
          await sleep(THINK_MS[qi]); if (dead()) return;
          propsRef.current.onSetQuiz?.({ qIndex: qi, selected: ca, submitted: false, answers, done: false });
          await sleep(350); if (dead()) return;
          answers = [...answers, { selected: ca, correct: true, qIndex: qi }];
          propsRef.current.onSetQuiz?.({ qIndex: qi, selected: ca, submitted: true, answers, done: false });
          await sleep(REVEAL_MS[qi]); if (dead()) return;
        }

        // ── ACT 6 — CELEBRATION ───────────────────────────────────
        setAct(6);
        propsRef.current.onSetQuiz?.({ qIndex: 2, selected: 3, submitted: true, answers, done: true });
        await sleep(300); if (dead()) return;
        setShowConfetti(true);
        propsRef.current.addToast?.("🏆 Perfect Score! You've mastered this content.", "success");
        await sleep(2200); if (dead()) return;
        setShowConfetti(false);
        await sleep(200); if (dead()) return;

        // ── ACT 7 — AI TUTOR ──────────────────────────────────────
        setAct(7);
        propsRef.current.onSetActiveTab?.(0);
        await sleep(400); if (dead()) return;

        showRing('[data-demo-id="tutor-btn"]');
        showTip("Ask your AI Tutor anything about this material →", '[data-demo-id="tutor-btn"]');
        await sleep(1200); if (dead()) return;
        setHighlightRect(null); setTooltip(null);

        propsRef.current.addToast?.("🎤 \"What is overfitting?\" — AI Tutor answers instantly!", "info");
        await sleep(1600); if (dead()) return;

        showRing('[data-demo-id="listen-btn"]');
        showTip("Listen to your summary in any language →", '[data-demo-id="listen-btn"]');
        await sleep(900); if (dead()) return;
        setHighlightRect(null); setTooltip(null);

        propsRef.current.onSetDemoTtsActive?.(true);
        try {
          const firstSentence = DEMO_RESULT.summary.split(".")[0] + ".";
          const utterance = new window.SpeechSynthesisUtterance(firstSentence);
          utterance.rate = 1.0;
          utterance.lang = "en-US";
          utterance.onend = () => propsRef.current.onSetDemoTtsActive?.(false);
          utterance.onerror = () => propsRef.current.onSetDemoTtsActive?.(false);
          window.speechSynthesis?.cancel();
          window.speechSynthesis?.speak(utterance);
        } catch { /* TTS not supported */ }

        await sleep(2200); if (dead()) return;
        window.speechSynthesis?.cancel();
        propsRef.current.onSetDemoTtsActive?.(false);
        await sleep(300); if (dead()) return;

        // ── ACT 8 — FINALE ────────────────────────────────────────
        setAct(8);
        await sleep(200); if (dead()) return;
        setShowFinale(true);

      } catch (err) {
        console.error("[DemoRunner] sequence error:", err);
      }
    }

    run();

    return () => {
      generationRef.current++;
      window.speechSynthesis?.cancel();
      propsRef.current.onSetDemoTtsActive?.(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard controls ──────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (showFinale) return;
      const typing = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        const next = !pausedRef.current;
        pausedRef.current = next;
        setPaused(next);
      } else if (e.code === "Escape") {
        generationRef.current++;
        propsRef.current.onStop?.();
      } else if (e.code === "KeyR" && !typing) {
        generationRef.current++;
        propsRef.current.onRestart?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFinale]);

  function handlePauseResume() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
  }

  function handleStop() {
    generationRef.current++;
    propsRef.current.onStop?.();
  }

  function handleWatchAgain() {
    generationRef.current++;
    propsRef.current.onRestart?.();
  }

  // ── Render ─────────────────────────────────────────────────────
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
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 14, minHeight: 22 }}>
              {loadingLabel}
            </div>
            <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 999, overflow: "hidden" }}>
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
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, fontFamily: "'Geist Mono', monospace" }}>
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
              top: tooltip.y,
              left: tooltip.x,
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
              maxWidth: "min(360px, calc(100vw - 32px))",
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
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
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
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 52, marginBottom: 20 }}>🎓</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 8, letterSpacing: "-0.02em" }}>
                StudyMaster AI
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 8, lineHeight: 1.5 }}>
                Turn any content into a complete study package — in seconds.
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>
                🌍 English · Français · العربية · Español · and more
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
            zIndex: 9500,
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
          {/* Progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              marginBottom: 5,
            }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                Act {act} of {TOTAL_ACTS} — {ACT_NAMES[act]}
              </span>
              {paused
                ? <span style={{ color: "#F59E0B", fontWeight: 500 }}>⏸ Paused</span>
                : <span style={{ color: "rgba(255,255,255,0.3)" }}>Space: pause · Esc: stop</span>
              }
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 999 }}>
              <motion.div
                animate={{ width: `${((act - 1) / TOTAL_ACTS) * 100}%` }}
                transition={{ duration: 0.5 }}
                style={{ height: "100%", background: "linear-gradient(90deg, #2563EB, #3B82F6)", borderRadius: 999 }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={handlePauseResume}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={handleStop}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ⏹ Stop
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}

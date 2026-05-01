import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import ReactConfetti from "react-confetti";
import { useKeyboard } from "../hooks/useKeyboard.js";

export default function QuizView({ result, onComplete, addToast, demoControl, onGenerateMore, generatingMore }) {
  const { t } = useTranslation();
  const questions = result.quiz || [];
  const [localQIndex, setLocalQIndex] = useState(0);
  const [localSelected, setLocalSelected] = useState(null);
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [localAnswers, setLocalAnswers] = useState([]);
  const [localDone, setLocalDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminated, setEliminated] = useState([]);
  const [timePressure, setTimePressure] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const dc = demoControl?.quiz;
  const qIndex    = dc ? dc.qIndex    : localQIndex;
  const selected  = dc ? dc.selected  : localSelected;
  const submitted = dc ? dc.submitted : localSubmitted;
  const answers   = dc ? dc.answers   : localAnswers;
  const done      = dc ? dc.done      : localDone;
  const setQIndex    = dc ? () => {} : setLocalQIndex;
  const setSelected  = dc ? () => {} : setLocalSelected;
  const setSubmitted = dc ? () => {} : setLocalSubmitted;
  const setAnswers   = dc ? () => {} : setLocalAnswers;
  const setDone      = dc ? () => {} : setLocalDone;

  const q = questions[qIndex];

  useEffect(() => {
    if (!timePressure || !timerActive || submitted || done) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timePressure, timerActive, timeLeft, submitted, done]);

  useEffect(() => {
    if (timePressure) { setTimeLeft(30); setTimerActive(true); }
  }, [qIndex, timePressure]);

  const handleSubmit = useCallback((autoSubmit = false) => {
    if (submitted) return;
    const finalSelected = autoSubmit ? -1 : selected;
    setSubmitted(true);
    setTimerActive(false);
    const correct = finalSelected === q.correctAnswer;
    const newAnswers = [...answers, { selected: finalSelected, correct, qIndex }];
    setAnswers(newAnswers);
  }, [submitted, selected, q, answers]);

  const handleNext = useCallback(() => {
    if (qIndex < questions.length - 1) {
      setQIndex(i => i + 1);
      setSelected(null);
      setSubmitted(false);
      setHintUsed(false);
      setEliminated([]);
      setTimeLeft(30);
      setTimerActive(timePressure);
    } else {
      const finalScore = answers.filter(a => a.correct).length;
      setDone(true);
      onComplete?.(finalScore, questions.length);
      if (finalScore === questions.length) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
  }, [qIndex, questions.length, answers, onComplete, timePressure]);

  const handleHint = () => {
    if (hintUsed || submitted) return;
    const wrong = q.options.map((_, i) => i).filter(i => i !== q.correctAnswer && i !== selected);
    setEliminated(wrong.slice(0, 2));
    setHintUsed(true);
  };

  const reset = () => {
    setQIndex(0); setSelected(null); setSubmitted(false);
    setAnswers([]); setDone(false); setHintUsed(false);
    setEliminated([]); setTimeLeft(30);
  };

  useKeyboard([
    ...([0,1,2,3].map(i => ({
      key: String(i + 1),
      action: () => !submitted && !eliminated.includes(i) && setSelected(i),
      allowTyping: false,
    }))),
    {
      key: "Enter",
      action: () => {
        if (!submitted && selected !== null) handleSubmit();
        else if (submitted) handleNext();
      },
      allowTyping: false,
    },
  ]);

  if (done) {
    const score = answers.filter(a => a.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    const perfect = score === questions.length;

    return (
      <div>
        {showConfetti && (
          <ReactConfetti
            numberOfPieces={200} recycle={false}
            colors={["#4F46E5", "#F59E0B", "#FFFFFF", "#10B981"]}
            style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "40px 20px" }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{
              width: 100, height: 100, borderRadius: "50%",
              background: perfect ? "linear-gradient(135deg, #F59E0B, #FCD34D)" : "var(--accent-light)",
              border: `4px solid ${perfect ? "#F59E0B" : "var(--accent)"}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <div style={{
              fontSize: 28, fontWeight: 700,
              color: perfect ? "#92400E" : "var(--accent)",
              fontFamily: "'Geist Mono', monospace",
            }}>
              {pct}%
            </div>
          </motion.div>

          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
            {score}/{questions.length}
          </div>

          {perfect && (
            <div style={{ color: "#D97706", fontWeight: 500, marginBottom: 16, fontSize: 15 }}>
              {t("quiz.perfect")}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px", background: "var(--accent)", color: "white",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500,
              }}
            >
              Try Again
            </button>
            {onGenerateMore && (
              <button
                onClick={onGenerateMore}
                disabled={generatingMore}
                style={{
                  padding: "10px 20px",
                  background: generatingMore ? "var(--bg-secondary)" : "var(--accent-light)",
                  border: `1px solid ${generatingMore ? "var(--border)" : "rgba(79,70,229,0.3)"}`,
                  borderRadius: 8, cursor: generatingMore ? "wait" : "pointer",
                  fontSize: 14, fontWeight: 500,
                  color: generatingMore ? "var(--text-muted)" : "var(--accent)",
                  transition: "all 0.2s",
                }}
              >
                {generatingMore ? "Generating..." : "+ 5 New Questions"}
              </button>
            )}
            {perfect && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText("I just scored 100% on my StudyMaster AI quiz!");
                  addToast?.("Copied to clipboard!", "success");
                }}
                style={{
                  padding: "10px 20px", background: "var(--bg-secondary)",
                  border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 14,
                }}
              >
                {t("quiz.shareResult")}
              </button>
            )}
          </div>

          {answers.some(a => !a.correct) && (
            <div style={{ textAlign: "left", marginTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "var(--text-primary)" }}>
                {t("quiz.reviewMistakes")}
              </div>
              {answers.filter(a => !a.correct).map((a, i) => {
                const qq = questions[a.qIndex];
                return (
                  <div key={i} style={{
                    padding: 16, background: "var(--error-light)",
                    border: "1px solid rgba(220,38,38,0.2)",
                    borderRadius: 8, marginBottom: 10,
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>{qq.question}</div>
                    {a.selected >= 0 && (
                      <div style={{ fontSize: 13, color: "var(--error)", marginBottom: 4 }}>
                        Your answer: {qq.options[a.selected]}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "var(--success)", marginBottom: 8 }}>
                      Correct: {qq.options[qq.correctAnswer]}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>
                      {qq.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {t("quiz.question", { n: qIndex + 1, total: questions.length })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: "var(--text-secondary)" }}>
            <input
              type="checkbox" checked={timePressure}
              onChange={e => {
                setTimePressure(e.target.checked);
                setTimeLeft(30);
                setTimerActive(e.target.checked && !submitted);
              }}
              style={{ cursor: "pointer" }}
            />
            {t("quiz.timePressure")}
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: i < answers.length
                  ? (answers[i]?.correct ? "var(--success)" : "var(--error)")
                  : i === qIndex ? "var(--accent)" : "var(--border)",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Time pressure bar */}
      {timePressure && !submitted && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: timeLeft <= 10 ? "var(--error)" : "var(--text-muted)", marginBottom: 4 }}>
            <span>Time left</span>
            <span className="mono">{timeLeft}s</span>
          </div>
          <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: 999, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              style={{ height: "100%", background: timeLeft <= 10 ? "var(--error)" : "var(--accent)", borderRadius: 999 }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </div>
      )}

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20, lineHeight: 1.5 }}>
            {q.question}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {q.options.map((opt, i) => {
              const isElim = eliminated.includes(i);
              const isSelected = selected === i;
              const isCorrect = submitted && i === q.correctAnswer;
              const isWrong = submitted && isSelected && i !== q.correctAnswer;

              let bg = "var(--bg-secondary)";
              let border = "1px solid var(--border)";
              let color = "var(--text-primary)";
              let boxShadow = "none";

              if (!submitted && isSelected) {
                bg = "var(--accent-light)";
                border = "1px solid var(--accent)";
              } else if (isCorrect) {
                bg = "var(--success-light)";
                border = "2px solid var(--success)";
                color = "var(--success)";
                boxShadow = "0 0 0 3px rgba(22,163,74,0.15)";
              } else if (isWrong) {
                bg = "var(--error-light)";
                border = "2px solid var(--error)";
                color = "var(--error)";
                boxShadow = "0 0 0 3px rgba(220,38,38,0.15)";
              }

              return (
                <motion.button
                  key={i}
                  className="quiz-option"
                  animate={{ boxShadow }}
                  whileHover={!submitted && !isElim ? { scale: 1.005 } : {}}
                  onClick={() => !submitted && !isElim && setSelected(i)}
                  style={{
                    padding: "12px 16px", background: bg, border,
                    borderRadius: 8, cursor: submitted || isElim ? "default" : "pointer",
                    textAlign: "left", fontSize: 14, color,
                    opacity: isElim ? 0.3 : 1, transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: isSelected && !submitted ? "var(--accent)" : isCorrect ? "var(--success)" : isWrong ? "var(--error)" : "var(--border)",
                    color: (isSelected && !submitted) || isCorrect || isWrong ? "white" : "var(--text-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    fontFamily: "'Geist Mono', monospace",
                    transition: "all 0.15s",
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isCorrect && <span style={{ fontWeight: 700 }}>✓</span>}
                  {isWrong && <span style={{ fontWeight: 700 }}>✕</span>}
                </motion.button>
              );
            })}
          </div>

          {submitted && q.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "12px 16px", background: "var(--bg-secondary)",
                border: "1px solid var(--border)", borderRadius: 8,
                fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 16,
              }}
            >
              {q.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {!submitted ? (
          <>
            <button
              onClick={handleHint} disabled={hintUsed}
              style={{
                padding: "10px 16px", minHeight: 44, background: "var(--bg-secondary)",
                border: "1px solid var(--border)", borderRadius: 8,
                cursor: hintUsed ? "not-allowed" : "pointer", fontSize: 13,
                color: hintUsed ? "var(--text-muted)" : "var(--text-secondary)",
                opacity: hintUsed ? 0.6 : 1,
              }}
            >
              {hintUsed ? t("quiz.hintUsed") : t("quiz.hint")}
            </button>
            <button
              onClick={() => handleSubmit()} disabled={selected === null}
              style={{
                flex: 1, padding: "10px 16px", minHeight: 44,
                background: selected !== null ? "var(--accent)" : "var(--border)",
                color: selected !== null ? "white" : "var(--text-muted)",
                border: "none", borderRadius: 8,
                cursor: selected !== null ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 500, transition: "all 0.15s",
              }}
            >
              {t("quiz.submit")}
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            style={{
              flex: 1, padding: "10px 16px", minHeight: 44,
              background: "var(--accent)", color: "white",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontSize: 14, fontWeight: 500,
            }}
          >
            {qIndex < questions.length - 1 ? t("quiz.next") : t("quiz.finish")} →
          </button>
        )}
      </div>
    </div>
  );
}

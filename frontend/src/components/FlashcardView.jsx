import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useKeyboard } from "../hooks/useKeyboard.js";

export default function FlashcardView({ result, onViewed, addToast }) {
  const { t } = useTranslation();
  const cards = result.flashcards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({});
  const [viewed, setViewed] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (!viewed && cards.length > 0) {
      onViewed?.();
      setViewed(true);
    }
  }, [cards.length, viewed, onViewed]);

  const card = cards[index];
  const mastered = Object.values(ratings).filter(r => r === "easy").length;
  const hard = Object.values(ratings).filter(r => r === "hard").length;
  const okay = Object.values(ratings).filter(r => r === "okay").length;

  const go = (dir) => {
    setFlipped(false);
    setTimeout(() => {
      setIndex(i => {
        const next = i + dir;
        if (next < 0) return cards.length - 1;
        if (next >= cards.length) return 0;
        return next;
      });
    }, 150);
  };

  const rate = (rating) => {
    setRatings(prev => ({ ...prev, [index]: rating }));
    if (index < cards.length - 1) {
      setTimeout(() => go(1), 300);
    }
  };

  const studyHardOnly = () => {
    const hardIndices = Object.entries(ratings)
      .filter(([, r]) => r === "hard")
      .map(([i]) => Number(i));
    if (hardIndices.length === 0) return;
    setIndex(hardIndices[0]);
    setRatings({});
    setFlipped(false);
  };

  useKeyboard([
    { key: "ArrowLeft", action: () => go(-1), allowTyping: false },
    { key: "ArrowRight", action: () => go(1), allowTyping: false },
    { key: " ", action: () => setFlipped(f => !f), allowTyping: false },
  ]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) {
      if (diff > 0) go(1);
      else go(-1);
    }
    setTouchStartX(null);
  };

  const handleCopy = async () => {
    const text = cards.map(c => `Q: ${c.front}\nA: ${c.back}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    addToast?.(t("actions.copied"), "success");
  };

  if (!card) return null;

  const allRated = Object.keys(ratings).length === cards.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{t("results.flashcards")}</div>
        <button onClick={handleCopy} style={{
          padding: "4px 10px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          fontSize: 12,
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}>
          {t("actions.copy")}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 6,
        }}>
          <span>{t("flashcard.progress", { done: mastered, total: cards.length })}</span>
          <span className="mono">{index + 1} / {cards.length}</span>
        </div>
        <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: 999 }}>
          <motion.div
            animate={{ width: `${(mastered / cards.length) * 100}%` }}
            style={{ height: "100%", background: "var(--success)", borderRadius: 999 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="flip-card"
        onClick={() => setFlipped(f => !f)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: "100%",
          maxWidth: 500,
          margin: "0 auto 16px",
          aspectRatio: "16/10",
          userSelect: "none",
        }}
      >
        <div className={`flip-card-inner${flipped ? " flipped" : ""}`}>
          <div className="flip-card-front">
            <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", color: "var(--text-primary)" }}>
              {card.front}
            </div>
            <div style={{
              position: "absolute",
              bottom: 12,
              fontSize: 11,
              color: "var(--text-muted)",
            }}>
              {t("flashcard.front")}
            </div>
          </div>
          <div className="flip-card-back" style={{ background: "var(--accent-light)" }}>
            <div style={{ fontSize: 15, textAlign: "center", color: "var(--text-primary)", lineHeight: 1.6 }}>
              {card.back}
            </div>
            <div style={{
              position: "absolute",
              bottom: 12,
              fontSize: 11,
              color: "var(--text-muted)",
            }}>
              {t("flashcard.back")}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence buttons (show after flip) */}
      <AnimatePresence>
        {flipped && !ratings[index] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}
          >
            {[
              { key: "hard", emoji: "😓", label: t("flashcard.hard"), color: "#DC2626", bg: "#FEF2F2" },
              { key: "okay", emoji: "😐", label: t("flashcard.okay"), color: "#D97706", bg: "#FFFBEB" },
              { key: "easy", emoji: "😊", label: t("flashcard.easy"), color: "#16A34A", bg: "#F0FDF4" },
            ].map(btn => (
              <motion.button
                key={btn.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); rate(btn.key); }}
                style={{
                  padding: "8px 20px",
                  background: btn.bg,
                  border: `1px solid ${btn.color}40`,
                  borderRadius: 8,
                  color: btn.color,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {btn.emoji} {btn.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating badge */}
      {ratings[index] && !flipped && (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
          Marked as <strong>{ratings[index]}</strong>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => go(-1)}
          style={{
            padding: "8px 20px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          ← Prev
        </button>
        <button
          onClick={() => go(1)}
          style={{
            padding: "8px 20px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          Next →
        </button>
      </div>

      {/* Session complete summary */}
      {allRated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "16px",
            background: "var(--success-light)",
            border: "1px solid var(--success)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--success)", marginBottom: 8 }}>
            Session Complete!
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            {t("flashcard.summary", { hard, okay, easy: mastered })}
          </div>
          {hard > 0 && (
            <button
              onClick={studyHardOnly}
              style={{
                padding: "8px 16px",
                background: "var(--error-light)",
                border: "1px solid var(--error)",
                borderRadius: 6,
                color: "var(--error)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {t("flashcard.studyAgain")}
            </button>
          )}
        </motion.div>
      )}

      {/* Dot navigation */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFlipped(false); setIndex(i); }}
            style={{
              width: ratings[i] ? 10 : 8,
              height: ratings[i] ? 10 : 8,
              borderRadius: "50%",
              border: "none",
              background: i === index
                ? "var(--accent)"
                : ratings[i] === "easy"
                  ? "var(--success)"
                  : ratings[i] === "hard"
                    ? "var(--error)"
                    : ratings[i] === "okay"
                      ? "var(--warning)"
                      : "var(--border)",
              cursor: "pointer",
              transition: "all 0.2s",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { useSpacedRepetition } from "../hooks/useSpacedRepetition.js";

export default function FlashcardView({ result, onViewed, addToast, demoControl, onGenerateMore, generatingMore }) {
  const { t } = useTranslation();
  const rawCards = result.flashcards || [];
  const { recordAnswer, dueCount, sortedCards } = useSpacedRepetition(rawCards);
  const cards = demoControl?.flashcard ? rawCards : sortedCards;
  const [localIndex, setLocalIndex] = useState(0);
  const [localFlipped, setLocalFlipped] = useState(false);
  const [localRatings, setLocalRatings] = useState({});
  const [viewed, setViewed] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const dc = demoControl?.flashcard;
  const index    = dc ? dc.index   : localIndex;
  const flipped  = dc ? dc.flipped  : localFlipped;
  const ratings  = dc ? dc.ratings  : localRatings;
  const setIndex  = dc ? () => {} : setLocalIndex;
  const setFlipped = dc ? () => {} : setLocalFlipped;
  const setRatings = dc ? () => {} : setLocalRatings;

  useEffect(() => {
    if (!viewed && cards.length > 0) { onViewed?.(); setViewed(true); }
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
    if (!dc) recordAnswer(card.front, rating);
    if (index < cards.length - 1) setTimeout(() => go(1), 300);
  };

  const studyHardOnly = () => {
    const hardIndices = Object.entries(ratings)
      .filter(([, r]) => r === "hard").map(([i]) => Number(i));
    if (hardIndices.length === 0) return;
    setIndex(hardIndices[0]);
    setRatings({});
    setFlipped(false);
  };

  useKeyboard([
    { key: "ArrowLeft",  action: () => go(-1),                     allowTyping: false },
    { key: "ArrowRight", action: () => go(1),                      allowTyping: false },
    { key: " ",          action: () => setFlipped(f => !f),        allowTyping: false },
  ]);

  const handleTouchStart = (e) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) { if (diff > 0) go(1); else go(-1); }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{t("results.flashcards")}</div>
          {dueCount > 0 && !dc && (
            <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid #FDE68A" }}>
              {dueCount} due
            </span>
          )}
          {dueCount === 0 && rawCards.length > 0 && !dc && (
            <span style={{ background: "#D1FAE5", color: "#065F46", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
              All reviewed
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCopy} style={{ padding: "4px 10px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
            {t("actions.copy")}
          </button>
          {onGenerateMore && (
            <button
              onClick={onGenerateMore}
              disabled={generatingMore}
              style={{
                padding: "4px 10px",
                background: generatingMore ? "var(--bg-secondary)" : "var(--accent-light)",
                border: `1px solid ${generatingMore ? "var(--border)" : "rgba(79,70,229,0.3)"}`,
                borderRadius: 6, fontSize: 12,
                color: generatingMore ? "var(--text-muted)" : "var(--accent)",
                cursor: generatingMore ? "wait" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {generatingMore ? "Generating..." : "+ More Cards"}
            </button>
          )}
        </div>
      </div>

      {/* Counter */}
      <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontFamily: "'Geist Mono', monospace" }}>
        {index + 1} / {cards.length}
      </div>

      {/* Dot progress */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {cards.map((_, i) => {
          const rated = ratings[i];
          const isCurrent = i === index;
          return (
            <button
              key={i}
              onClick={() => { setFlipped(false); setIndex(i); }}
              style={{
                width: isCurrent ? 10 : 8,
                height: isCurrent ? 10 : 8,
                borderRadius: "50%", border: "none", padding: 0,
                background: isCurrent
                  ? "var(--accent)"
                  : rated === "easy" ? "var(--success)"
                  : rated === "hard" ? "var(--error)"
                  : rated === "okay" ? "var(--warning)"
                  : "var(--border)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            />
          );
        })}
      </div>

      {/* Card + arrow navigation row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {/* Left arrow */}
        <button
          onClick={() => go(-1)}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border)",
            background: "var(--bg-secondary)", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 18,
            color: "var(--text-secondary)", transition: "all 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          ‹
        </button>

        {/* Flashcard */}
        <div
          className="flip-card"
          onClick={() => setFlipped(f => !f)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ flex: 1, maxWidth: 520, aspectRatio: "16/10", userSelect: "none" }}
        >
          <div className={`flip-card-inner${flipped ? " flipped" : ""}`}>
            <div className="flip-card-front">
              <div style={{ fontSize: 17, fontWeight: 600, textAlign: "center", color: "var(--text-primary)", lineHeight: 1.45 }}>
                {card.front}
              </div>
              <div style={{ position: "absolute", bottom: 12, fontSize: 11, color: "var(--text-muted)" }}>
                {t("flashcard.front")}
              </div>
            </div>
            <div className="flip-card-back" style={{ background: "var(--accent-light)" }}>
              <div style={{ fontSize: 14, textAlign: "center", color: "var(--text-primary)", lineHeight: 1.65 }}>
                {card.back}
              </div>
              <div style={{ position: "absolute", bottom: 12, fontSize: 11, color: "var(--text-muted)" }}>
                {t("flashcard.back")}
              </div>
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => go(1)}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border)",
            background: "var(--bg-secondary)", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 18,
            color: "var(--text-secondary)", transition: "all 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          ›
        </button>
      </div>

      {/* Confidence buttons (show after flip) */}
      <AnimatePresence>
        {flipped && !ratings[index] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}
          >
            {[
              { key: "hard", label: t("flashcard.hard"), color: "#DC2626", bg: "#FEF2F2" },
              { key: "okay", label: t("flashcard.okay"), color: "#D97706", bg: "#FFFBEB" },
              { key: "easy", label: t("flashcard.easy"), color: "#16A34A", bg: "#F0FDF4" },
            ].map(btn => (
              <motion.button
                key={btn.key}
                className="flashcard-confidence-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); rate(btn.key); }}
                style={{
                  padding: "8px 20px", background: btn.bg,
                  border: `1px solid ${btn.color}40`, borderRadius: 8,
                  color: btn.color, fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                {btn.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating badge */}
      {ratings[index] && !flipped && (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          Marked as <strong>{ratings[index]}</strong>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          <span>{t("flashcard.progress", { done: mastered, total: cards.length })}</span>
          <span style={{ color: "var(--success)", fontWeight: 600 }}>{mastered}/{cards.length} mastered</span>
        </div>
        <div style={{ height: 3, background: "var(--bg-secondary)", borderRadius: 999 }}>
          <motion.div
            animate={{ width: `${(mastered / cards.length) * 100}%` }}
            style={{ height: "100%", background: "var(--success)", borderRadius: 999 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Session complete summary */}
      {allRated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "16px", background: "var(--success-light)",
            border: "1px solid var(--success)", borderRadius: 8, textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--success)", marginBottom: 8 }}>Session Complete!</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            {t("flashcard.summary", { hard, okay, easy: mastered })}
          </div>
          {hard > 0 && (
            <button
              onClick={studyHardOnly}
              style={{
                padding: "8px 16px", background: "var(--error-light)",
                border: "1px solid var(--error)", borderRadius: 6,
                color: "var(--error)", cursor: "pointer", fontSize: 13, fontWeight: 500,
              }}
            >
              {t("flashcard.studyAgain")}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

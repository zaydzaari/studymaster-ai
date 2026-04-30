import { useState, useCallback } from "react";

const STORAGE_KEY = "sm-spaced-rep";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

// SM-2 algorithm: grade 1=hard, 3=okay, 5=easy
function sm2(card, grade) {
  let { interval = 1, easeFactor = 2.5, repetitions = 0 } = card;

  if (grade < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions++;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { interval, easeFactor, repetitions, nextReview: nextReview.toISOString() };
}

export function useSpacedRepetition(flashcards = []) {
  const [data, setData] = useState(load);

  const save = useCallback((d) => {
    setData(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }, []);

  const recordAnswer = useCallback((front, rating) => {
    const grade = rating === "easy" ? 5 : rating === "okay" ? 3 : 1;
    const existing = data[front] || {};
    save({ ...data, [front]: sm2(existing, grade) });
  }, [data, save]);

  const now = new Date();

  const dueCount = flashcards.filter(c => {
    const d = data[c.front];
    return !d || new Date(d.nextReview) <= now;
  }).length;

  // Sort: new/overdue cards first, then by next review date
  const sortedCards = [...flashcards].sort((a, b) => {
    const da = data[a.front];
    const db = data[b.front];
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    return new Date(da.nextReview) - new Date(db.nextReview);
  });

  const getNextReview = (front) => {
    const d = data[front];
    if (!d) return null;
    return new Date(d.nextReview);
  };

  return { recordAnswer, dueCount, sortedCards, getNextReview };
}

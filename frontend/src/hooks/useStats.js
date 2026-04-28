import { useState, useEffect } from "react";

const SEED = { summaries: 247, flashcards: 1482, quizzes: 89 };

export function useStats() {
  const [stats, setStats] = useState(() => {
    const stored = localStorage.getItem("sm-stats");
    return stored ? JSON.parse(stored) : SEED;
  });

  const increment = (type, amount = 1) => {
    setStats(prev => {
      const next = { ...prev, [type]: prev[type] + amount };
      localStorage.setItem("sm-stats", JSON.stringify(next));
      return next;
    });
  };

  return { stats, increment };
}

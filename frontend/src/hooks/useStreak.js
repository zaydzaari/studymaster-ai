import { useState, useEffect } from "react";

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("sm-streak-date");
    const current = parseInt(localStorage.getItem("sm-streak-count") || "0", 10);

    if (!last) {
      setStreak(1);
      localStorage.setItem("sm-streak-date", today);
      localStorage.setItem("sm-streak-count", "1");
      return;
    }

    const lastDate = new Date(last);
    const now = new Date();
    const diff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (diff === 0) {
      setStreak(current);
    } else if (diff === 1) {
      const next = current + 1;
      setStreak(next);
      localStorage.setItem("sm-streak-date", today);
      localStorage.setItem("sm-streak-count", String(next));
    } else {
      setStreak(1);
      localStorage.setItem("sm-streak-date", today);
      localStorage.setItem("sm-streak-count", "1");
    }
  }, []);

  const recordUsage = () => {
    const today = new Date().toDateString();
    localStorage.setItem("sm-streak-date", today);
  };

  return { streak, recordUsage };
}

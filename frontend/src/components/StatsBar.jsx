import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function Counter({ target, duration = 1500 }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <span className="mono">{value.toLocaleString()}</span>;
}

export default function StatsBar({ stats }) {
  const { t } = useTranslation();

  const items = [
    { emoji: "📚", value: stats.summaries, label: t("stats.summaries") },
    { emoji: "📇", value: stats.flashcards, label: t("stats.flashcards") },
    { emoji: "📝", value: stats.quizzes, label: t("stats.quizzes") },
  ];

  return (
    <div className="stats-bar" style={{
      position: "fixed",
      top: 60,
      left: 0,
      right: 0,
      height: 48,
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border)",
      zIndex: 99,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 48,
      overflowX: "auto",
      padding: "0 24px",
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}>
          <span>{item.emoji}</span>
          <Counter target={item.value} duration={1500 + i * 200} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

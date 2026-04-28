import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { label: "Extracting content...", pct: 10, time: "~25 seconds" },
  { label: "Analyzing with Gemini...", pct: 40, time: "~20 seconds" },
  { label: "Generating materials...", pct: 75, time: "~10 seconds" },
  { label: "Finalizing...", pct: 92, time: "~5 seconds" },
];

export default function ProgressBar({ streaming, streamText }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!streaming) {
      setStepIndex(0);
      return;
    }
    const textLen = streamText?.length || 0;
    if (textLen > 2000) setStepIndex(3);
    else if (textLen > 800) setStepIndex(2);
    else if (textLen > 100) setStepIndex(1);
    else setStepIndex(0);
  }, [streaming, streamText]);

  if (!streaming) return null;

  const step = STEPS[stepIndex];

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        fontSize: 13,
      }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={stepIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ color: "var(--text-secondary)" }}
          >
            {step.label}
          </motion.span>
        </AnimatePresence>
        <span style={{ color: "var(--text-muted)" }}>{step.time}</span>
      </div>

      <div style={{
        height: 4,
        background: "var(--bg-secondary)",
        borderRadius: 999,
        overflow: "hidden",
      }}>
        <motion.div
          animate={{ width: `${step.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            height: "100%",
            background: "var(--accent)",
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

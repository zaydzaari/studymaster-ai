import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const STUDY = 25 * 60;
const BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export default function PomodoroTimer({ addToast }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("study"); // study | break | long
  const [time, setTime] = useState(STUDY);
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            playPing();
            if (mode === "study") {
              const newCycle = cycle + 1;
              setCycle(newCycle);
              if (newCycle % 4 === 0) {
                setMode("long");
                setTime(LONG_BREAK);
                addToast?.(t("pomodoro.longBreak"), "info");
              } else {
                setMode("break");
                setTime(BREAK);
                addToast?.(t("pomodoro.break"), "info");
              }
            } else {
              setMode("study");
              setTime(STUDY);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, cycle]);

  const toggle = () => setRunning(r => !r);

  const skipBreak = () => {
    setMode("study");
    setTime(STUDY);
    setRunning(false);
  };

  const total = mode === "long" ? LONG_BREAK : mode === "break" ? BREAK : STUDY;
  const progress = (total - time) / total;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);

  const mm = String(Math.floor(time / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "5px 12px",
          background: running ? "var(--accent-light)" : "var(--bg-secondary)",
          border: `1px solid ${running ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 6,
          fontSize: 12,
          color: running ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        🍅 {running ? `${mm}:${ss}` : t("pomodoro.focus")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              padding: 20,
              zIndex: 200,
              minWidth: 180,
              textAlign: "center",
            }}
          >
            {/* SVG ring */}
            <svg width={56} height={56} style={{ marginBottom: 8 }}>
              <circle cx={28} cy={28} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
              <circle
                cx={28}
                cy={28}
                r={r}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={4}
                strokeDasharray={circ}
                strokeDashoffset={dash}
                strokeLinecap="round"
                className="pomodoro-ring"
              />
              <text
                x={28}
                y={28}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontFamily="'Geist Mono', monospace"
                fill="var(--text-primary)"
                fontWeight={600}
              >
                {mm}:{ss}
              </text>
            </svg>

            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, textTransform: "capitalize" }}>
              {mode === "long" ? "Long break" : mode}
            </div>

            <button
              onClick={toggle}
              style={{
                width: "100%",
                padding: "8px",
                background: running ? "var(--bg-secondary)" : "var(--accent)",
                color: running ? "var(--text-primary)" : "white",
                border: `1px solid ${running ? "var(--border)" : "transparent"}`,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              {running ? "⏸ Pause" : "▶ Start"}
            </button>

            {mode !== "study" && (
              <button
                onClick={skipBreak}
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                {t("pomodoro.skipBreak")}
              </button>
            )}

            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
              Cycle {cycle + 1} · {4 - (cycle % 4)} until long break
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

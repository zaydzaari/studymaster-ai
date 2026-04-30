import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceTutor } from "../hooks/useVoiceTutor.js";

export default function VoiceTutor({ result, isMobile, onVoiceDebug }) {
  const { isOpen, status, transcript, errorMsg, audioLevel, supported, unavailableOnDeploy, open, close, retry, voiceDebug } =
    useVoiceTutor();

  // Forward debug info to parent whenever it changes
  React.useEffect(() => { onVoiceDebug?.(voiceDebug); }, [voiceDebug, onVoiceDebug]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!result) return null;

  // On Vercel / production: WebSockets need a persistent server — show grayed button
  if (unavailableOnDeploy) {
    return (
      <div
        title="Voice Tutor requires a persistent server — run locally with npm run dev"
        style={{
          position: "fixed",
          bottom: isMobile ? 88 : 24,
          right: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          background: "var(--bg-secondary)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: "not-allowed",
          zIndex: 900,
          userSelect: "none",
        }}
      >
        <MicIcon size={15} color="var(--text-muted)" />
        Tutor (local only)
      </div>
    );
  }

  if (!supported) return null;

  const studyData = {
    title: result.meta?.title || "",
    subject: result.meta?.subject || "",
    difficulty: result.meta?.difficulty || "",
    summary: result.summary || "",
    keyPoints: result.keyPoints || [],
    learningObjectives: result.learningObjectives || [],
  };

  const btnBottom = isMobile ? 88 : 24;

  return (
    <>
      {/* Floating button — visible when panel is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="tutor-btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => open(studyData)}
            style={{
              position: "fixed",
              bottom: btnBottom,
              right: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
              zIndex: 900,
              animation: "tutorPulse 2.5s ease-in-out infinite",
            }}
          >
            <MicIcon size={16} />
            Ask Tutor
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 2000,
            }}
          />
        )}
      </AnimatePresence>

      {/* Slide-up panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: isMobile ? "62vh" : "44vh",
              maxHeight: 520,
              background: "var(--bg-card)",
              borderRadius: "18px 18px 0 0",
              border: "1px solid var(--border)",
              borderBottom: "none",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
              zIndex: 2001,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusDot status={status} />
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                  AI Tutor
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {status === "connecting" ? "Connecting..."
                    : status === "reconnecting" ? "Reconnecting..."
                    : status === "listening" ? "Listening..."
                    : status === "speaking" ? "Speaking..."
                    : status === "error" ? "Error"
                    : ""}
                </span>
              </div>
              <button
                onClick={close}
                style={{
                  width: 32, height: 32,
                  border: "none", background: "var(--bg-secondary)",
                  borderRadius: 8, cursor: "pointer", fontSize: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-secondary)", lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Transcript */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {transcript.length === 0 && !errorMsg && (
                <EmptyConversation status={status} title={result?.meta?.title} />
              )}

              {errorMsg && (
                <ErrorState message={errorMsg} onRetry={retry} />
              )}

              {transcript.map((item, i) => (
                <Bubble key={i} item={item} />
              ))}
            </div>

            {/* Bottom mic row */}
            <div style={{
              padding: "12px 20px 18px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}>
              <AudioBars audioLevel={audioLevel} active={status === "listening"} />
              <MicButton status={status} />
              <AudioBars audioLevel={audioLevel} active={status === "listening"} mirror />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatusDot({ status }) {
  const color =
    status === "listening" || status === "speaking" ? "#16A34A"
      : status === "connecting" || status === "reconnecting" ? "#D97706"
      : status === "error" ? "#DC2626"
      : "var(--text-muted)";
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
      animation: status === "listening" ? "pulse 1.2s infinite" : "none",
    }} />
  );
}

function EmptyConversation({ status, title }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", gap: 10,
      color: "var(--text-muted)", textAlign: "center", padding: 24,
    }}>
      {status === "connecting" || status === "reconnecting" ? (
        <>
          <Spinner />
          <span style={{ fontSize: 14 }}>
            {status === "reconnecting" ? "Reconnecting..." : "Connecting to AI Tutor..."}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 36 }}>🎙</span>
          <span style={{ fontSize: 14, lineHeight: 1.6 }}>
            Ask me anything about<br />
            <strong style={{ color: "var(--text-secondary)" }}>
              {title || "your study material"}
            </strong>
          </span>
          <span style={{ fontSize: 12, marginTop: 4 }}>Just start speaking!</span>
        </>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 12, padding: 24, textAlign: "center",
    }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {message}
      </span>
      <button
        onClick={onRetry}
        style={{
          padding: "8px 20px", background: "var(--accent)", color: "#fff",
          border: "none", borderRadius: 8, cursor: "pointer",
          fontSize: 13, fontWeight: 600,
        }}
      >
        Try Again
      </button>
    </div>
  );
}

function Bubble({ item }) {
  const isUser = item.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div style={{
        maxWidth: "76%",
        padding: "10px 14px",
        borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
        background: isUser ? "var(--accent)" : "var(--bg-secondary)",
        color: isUser ? "#fff" : "var(--text-primary)",
        fontSize: 14,
        lineHeight: 1.55,
        border: isUser ? "none" : "1px solid var(--border)",
        opacity: item.final ? 1 : 0.75,
      }}>
        {item.text}
        {!item.final && <span style={{ opacity: 0.6 }}> ▋</span>}
      </div>
    </motion.div>
  );
}

function MicButton({ status }) {
  const isListening = status === "listening";
  const isSpeaking = status === "speaking";
  const isConnecting = status === "connecting" || status === "reconnecting";

  return (
    <div style={{
      width: 56, height: 56, borderRadius: "50%",
      background: isListening ? "#DC2626" : isSpeaking ? "#16A34A" : "var(--bg-secondary)",
      border: `2px solid ${isListening ? "#B91C1C" : isSpeaking ? "#15803D" : "var(--border)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.3s",
      boxShadow: isListening ? "0 0 0 6px rgba(220,38,38,0.15)" : "none",
    }}>
      {isConnecting ? (
        <Spinner size={20} />
      ) : isSpeaking ? (
        <SoundWave />
      ) : (
        <MicIcon size={22} color={isListening ? "#fff" : "var(--text-secondary)"} />
      )}
    </div>
  );
}

function AudioBars({ audioLevel, active, mirror }) {
  const bars = [0.4, 0.7, 1, 0.7, 0.4];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 3,
      transform: mirror ? "scaleX(-1)" : "none",
    }}>
      {bars.map((base, i) => {
        const h = active ? Math.max(4, base * audioLevel * 32) : 4;
        return (
          <div
            key={i}
            style={{
              width: 3, height: h, borderRadius: 99,
              background: active ? "var(--accent)" : "var(--border)",
              transition: "height 0.08s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function MicIcon({ size = 18, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SoundWave() {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 3, borderRadius: 99, background: "#fff",
          animation: `soundBar${i} 0.8s ease-in-out infinite`,
          height: 14,
        }} />
      ))}
    </div>
  );
}

function Spinner({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid var(--border)`,
      borderTopColor: "var(--accent)",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

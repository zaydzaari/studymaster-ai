import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceTutor } from "../hooks/useVoiceTutor.js";

const BASE = import.meta.env.VITE_API_URL || "";

export default function UnifiedTutor({ result, isMobile, onVoiceDebug }) {
  const {
    isOpen: voiceOpen,
    status,
    transcript,
    errorMsg,
    audioLevel,
    muted,
    supported,
    unavailableOnDeploy,
    open: voiceOpenFn,
    close: voiceClose,
    retry: voiceRetry,
    sendText,
    toggleMute,
    voiceDebug,
  } = useVoiceTutor();

  const [textInput, setTextInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sseMessages, setSseMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  const readFileAsBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      mimeType: file.type,
      base64: reader.result.split(',')[1],
    });
    reader.readAsDataURL(file);
  });

  const handleAttach = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const processed = await Promise.all(files.map(readFileAsBase64));
    setAttachedFiles(prev => [...prev, ...processed].slice(0, 3));
    e.target.value = '';
  };

  const removeAttachment = (i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i));

  // Reset conversation when a new study result is loaded
  const prevResultTitleRef = useRef(null);
  useEffect(() => {
    const title = result?.meta?.title || null;
    if (title && title !== prevResultTitleRef.current) {
      prevResultTitleRef.current = title;
      setSseMessages([]);
    }
  }, [result?.meta?.title]);

  const mergedMessages = [...transcript, ...sseMessages].sort((a, b) => (a.ts || 0) - (b.ts || 0));

  React.useEffect(() => { onVoiceDebug?.(voiceDebug); }, [voiceDebug, onVoiceDebug]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, sseMessages]);

  const context = result ? {
    title: result.meta?.title || "",
    subject: result.meta?.subject || "",
    difficulty: result.meta?.difficulty || "",
    summary: result.summary || "",
    keyPoints: result.keyPoints || [],
    learningObjectives: result.learningObjectives || [],
  } : null;

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (context && !voiceOpen) {
      voiceOpenFn(context);
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [context, voiceOpen, voiceOpenFn]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    // Save any voice transcript messages to sseMessages before disconnecting
    setSseMessages(prev => {
      if (transcript.length === 0) return prev;
      const existingTs = new Set(prev.map(m => m.ts));
      const toAdd = transcript.filter(m => !existingTs.has(m.ts));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
    voiceClose();
    setIsOpen(false);
    setTextInput("");
    // Intentionally NOT clearing sseMessages — conversation persists across open/close
  }, [voiceClose, transcript]);

  const handleSendText = useCallback(async () => {
    const msg = textInput.trim();
    if ((!msg && !attachedFiles.length) || sending) return;

    const connected = status === "listening" || status === "speaking";

    if (connected && !attachedFiles.length) {
      sendText(msg);
      setTextInput("");
      return;
    }

    const currentAttachments = [...attachedFiles];
    const userMsg = {
      role: "user",
      text: msg || `📎 ${currentAttachments.map(f => f.name).join(', ')}`,
      ts: Date.now(), final: true,
      attachments: currentAttachments.map(f => ({ name: f.name, mimeType: f.mimeType })),
    };
    setSseMessages(prev => [...prev, userMsg]);
    setTextInput("");
    setAttachedFiles([]);
    setSending(true);

    const assistantPlaceholder = { role: "tutor", text: "", ts: Date.now() + 1, final: false };
    setSseMessages(prev => [...prev, assistantPlaceholder]);
    let fullResponse = "";

    const controller = new AbortController();
    abortRef.current = controller;

    // Build full conversation history for context-aware replies
    const chatHistory = sseMessages
      .filter(m => m.final !== false)
      .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory, { role: "user", content: msg || " " }],
          context,
          attachments: currentAttachments.length
            ? currentAttachments.map(f => ({ mimeType: f.mimeType, data: f.base64, name: f.name }))
            : undefined,
        }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text, error } = JSON.parse(payload);
            if (error) throw new Error(error);
            if (text) {
              fullResponse += text;
              setSseMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "tutor", text: fullResponse, ts: userMsg.ts + 1, final: false };
                return updated;
              });
            }
          } catch {}
        }
      }

      setSseMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "tutor", text: fullResponse, ts: userMsg.ts + 1, final: true };
        return updated;
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setSseMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "tutor", text: "Sorry, I had trouble responding.", ts: userMsg.ts + 1, final: true };
          return updated;
        });
      }
    } finally {
      setSending(false);
    }
  }, [textInput, attachedFiles, sending, status, sendText, context, sseMessages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  if (!result) return null;

  if (unavailableOnDeploy) {
    return (
      <div
        title="Tutor requires a persistent server — run locally with npm run dev"
        style={{
          position: "fixed", bottom: isMobile ? 88 : 24,
          right: "calc(20px + env(safe-area-inset-right, 0px))",
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", background: "var(--bg-secondary)",
          color: "var(--text-muted)", border: "1px solid var(--border)",
          borderRadius: 999, fontSize: 13, fontWeight: 600,
          cursor: "not-allowed", zIndex: 900, userSelect: "none",
        }}
      >
        <MicIcon size={15} color="var(--text-muted)" />
        Tutor (local only)
      </div>
    );
  }

  if (!supported) return null;

  const connected = status === "listening" || status === "speaking";
  const connecting = status === "connecting" || status === "reconnecting";

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="unified-btn"
            data-demo-id="tutor-btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleOpen}
            style={{
              position: "fixed", bottom: isMobile ? 88 : 24,
              right: "calc(20px + env(safe-area-inset-right, 0px))",
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 999, fontSize: 14, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
              zIndex: 900, animation: "tutorPulse 2.5s ease-in-out infinite",
            }}
          >
            <ChatIcon size={16} />
            Ask Tutor
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="unified-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="unified-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              height: isMobile ? "70vh" : "58vh",
              maxHeight: 560, background: "var(--bg-card)",
              borderRadius: "18px 18px 0 0", border: "1px solid var(--border)",
              borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
              zIndex: 2001, display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusDot status={status} muted={muted} />
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                  AI Tutor
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {connecting ? "Connecting..."
                    : status === "listening" ? (muted ? "Mic muted" : "Listening...")
                    : status === "speaking" ? "Speaking..."
                    : status === "error" ? "Error"
                    : result.meta?.title ? `· ${result.meta.title}` : ""}
                </span>
              </div>
              <button onClick={handleClose} style={{
                width: 32, height: 32, border: "none", background: "var(--bg-secondary)",
                borderRadius: 8, cursor: "pointer", fontSize: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-secondary)", lineHeight: 1,
              }}>×</button>
            </div>

            <div ref={scrollRef} style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {mergedMessages.length === 0 && !errorMsg && (
                <EmptyState status={status} title={result?.meta?.title} />
              )}

              {errorMsg && (
                <ErrorState message={errorMsg} onRetry={voiceRetry} />
              )}

              {mergedMessages.map((item, i) => (
                <ChatBubble key={i} item={item} />
              ))}
            </div>

            <div style={{
              padding: "12px 20px",
              paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
              borderTop: "1px solid var(--border)", flexShrink: 0,
            }}>
              {/* Attached file chips */}
              {attachedFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {attachedFiles.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 8px 4px 6px",
                      background: "var(--accent-light)", border: "1px solid rgba(37,99,235,0.25)",
                      borderRadius: 6, fontSize: 12, color: "var(--accent)",
                      maxWidth: 180,
                    }}>
                      <span>{f.mimeType.startsWith("image/") ? "🖼️" : "📄"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {f.name}
                      </span>
                      <button onClick={() => removeAttachment(i)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--accent)", fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0,
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach image or PDF"
                style={{
                  width: 38, height: 38, border: "1px solid var(--border)",
                  borderRadius: 10, background: "var(--bg-secondary)",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, color: "var(--text-secondary)",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <PaperclipIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleAttach}
                style={{ display: "none" }}
              />

              <textarea
                ref={inputRef}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={connected ? "Type or speak... (Enter to send)" : connecting ? "Connecting to voice..." : "Ask anything, attach an image or PDF..."}
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
                  borderRadius: 12, fontSize: 14, background: "var(--bg-secondary)",
                  color: "var(--text-primary)", fontFamily: "inherit", outline: "none",
                  resize: "none", lineHeight: 1.5, maxHeight: 100, overflow: "auto",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              />

              <AudioBars audioLevel={audioLevel} active={!muted && connected} />
              <MicButton
                status={status}
                muted={muted}
                connected={connected}
                connecting={connecting}
                onToggle={toggleMute}
              />
              <AudioBars audioLevel={audioLevel} active={!muted && connected} mirror />

              <button
                onClick={handleSendText}
                disabled={(!textInput.trim() && !attachedFiles.length) || sending}
                style={{
                  width: 44, height: 44,
                  background: (textInput.trim() || attachedFiles.length) && !sending ? "var(--accent)" : "var(--border)",
                  border: "none", borderRadius: 10,
                  cursor: (textInput.trim() || attachedFiles.length) && !sending ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.2s",
                }}
              >
                {sending ? <Spinner size={16} borderColor="rgba(255,255,255,0.3)" borderTopColor="#fff" /> : <SendIcon />}
              </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatusDot({ status, muted }) {
  let color = "var(--text-muted)";
  let pulse = false;

  if (status === "listening" && !muted) {
    color = "#16A34A";
    pulse = true;
  } else if (status === "speaking") {
    color = "#16A34A";
  } else if (status === "listening" && muted) {
    color = "#D97706";
  } else if (status === "connecting" || status === "reconnecting") {
    color = "#D97706";
  } else if (status === "error") {
    color = "#DC2626";
  }

  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
      animation: pulse ? "pulse 1.2s infinite" : "none",
    }} />
  );
}

function EmptyState({ status, title }) {
  const connecting = status === "connecting" || status === "reconnecting";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", gap: 10,
      color: "var(--text-muted)", textAlign: "center", padding: 24,
    }}>
      {connecting ? (
        <>
          <Spinner size={24} />
          <span style={{ fontSize: 14 }}>
            {status === "reconnecting" ? "Reconnecting..." : "Connecting to AI Tutor..."}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 36 }}>💬</span>
          <span style={{ fontSize: 14, lineHeight: 1.6 }}>
            Ask me anything about<br />
            <strong style={{ color: "var(--text-secondary)" }}>
              {title || "your study material"}
            </strong>
          </span>
          <span style={{ fontSize: 12, marginTop: 4 }}>
            Type a message or tap the mic to speak!
          </span>
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
      <button onClick={onRetry} style={{
        padding: "8px 20px", background: "var(--accent)", color: "#fff",
        border: "none", borderRadius: 8, cursor: "pointer",
        fontSize: 13, fontWeight: 600,
      }}>Try Again</button>
    </div>
  );
}

function ChatBubble({ item }) {
  const isUser = item.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div style={{
        maxWidth: "78%",
        borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
        overflow: "hidden",
        opacity: item.final === false ? 0.75 : 1,
      }}>
        {item.attachments?.length > 0 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 12px 4px",
            background: isUser ? "var(--accent)" : "var(--bg-secondary)",
            borderBottom: isUser ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--border)",
          }}>
            {item.attachments.map((a, i) => (
              <span key={i} style={{
                fontSize: 11, padding: "2px 7px",
                background: isUser ? "rgba(255,255,255,0.15)" : "var(--bg-card)",
                borderRadius: 4, color: isUser ? "#fff" : "var(--text-secondary)",
                border: isUser ? "none" : "1px solid var(--border)",
              }}>
                {a.mimeType?.startsWith("image/") ? "🖼️" : "📄"} {a.name}
              </span>
            ))}
          </div>
        )}
        <div style={{
          padding: "10px 14px",
          background: isUser ? "var(--accent)" : "var(--bg-secondary)",
          color: isUser ? "#fff" : "var(--text-primary)",
          fontSize: 14, lineHeight: 1.55,
          border: isUser ? "none" : "1px solid var(--border)",
          borderTop: "none",
          whiteSpace: "pre-wrap",
        }}>
          {item.text}
          {item.final === false && <span style={{ opacity: 0.6 }}> ▋</span>}
        </div>
      </div>
    </motion.div>
  );
}

function PaperclipIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MicButton({ status, muted, connected, connecting, onToggle }) {
  const isListeningActive = connected && !muted;

  return (
    <button
      onClick={onToggle}
      disabled={connecting}
      title={muted ? "Unmute microphone" : "Mute microphone"}
      style={{
        width: 46, height: 46, borderRadius: "50%",
        background: isListeningActive ? "#DC2626" : connected ? "var(--bg-secondary)" : "var(--bg-secondary)",
        border: `2px solid ${isListeningActive ? "#B91C1C" : connected ? "var(--border)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: connecting ? "not-allowed" : "pointer",
        transition: "all 0.3s", flexShrink: 0,
        boxShadow: isListeningActive ? "0 0 0 6px rgba(220,38,38,0.15)" : "none",
      }}
    >
      {connecting ? (
        <Spinner size={18} />
      ) : (
        <MicIcon size={20} color={isListeningActive ? "#fff" : muted ? "#D97706" : "var(--text-secondary)"} />
      )}
    </button>
  );
}

function AudioBars({ active, audioLevel, mirror }) {
  const bars = [0.4, 0.7, 1, 0.7, 0.4];
  return (
    <div style={{
      display: "flex", alignItems: "center", alignSelf: "center", gap: 3,
      transform: mirror ? "scaleX(-1)" : "none",
    }}>
      {bars.map((base, i) => {
        const h = active ? Math.max(4, base * audioLevel * 32) : 4;
        return (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 99,
            background: active ? "var(--accent)" : "var(--border)",
            transition: "height 0.08s ease",
          }} />
        );
      })}
    </div>
  );
}

function ChatIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
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

function SendIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function Spinner({ size = 16, borderColor, borderTopColor }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${borderColor || "var(--text-muted)"}`,
      borderTopColor: borderTopColor || "var(--accent)",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

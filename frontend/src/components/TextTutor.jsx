import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.VITE_API_URL || "";

export default function TextTutor({ result, isMobile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const context = result ? {
    title: result.meta?.title || "",
    subject: result.meta?.subject || "",
    difficulty: result.meta?.difficulty || "",
    summary: result.summary || "",
    keyPoints: result.keyPoints || [],
    learningObjectives: result.learningObjectives || [],
  } : null;

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming) return;

    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Placeholder for streaming assistant reply
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context }),
        signal: abortRef.current.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

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
              assistantText += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText, streaming: true };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Mark final
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistantText, streaming: false };
        return updated;
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Sorry, I had trouble responding. Please try again.", streaming: false };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
    }
  }, [messages, context, streaming]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  if (!result) return null;

  const btnBottom = isMobile ? 88 : 24;
  const btnRight = isMobile ? 20 : 140; // offset from VoiceTutor button

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleOpen}
            style={{
              position: "fixed",
              bottom: btnBottom,
              right: btnRight,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "#16A34A",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(22,163,74,0.45)",
              zIndex: 900,
            }}
          >
            <ChatIcon size={16} />
            Ask (Text)
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000 }}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              height: isMobile ? "70vh" : "50vh",
              maxHeight: 560,
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
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>Text Tutor</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {result.meta?.title ? `· ${result.meta.title}` : ""}
                </span>
              </div>
              <button onClick={handleClose} style={{
                width: 32, height: 32, border: "none", background: "var(--bg-secondary)",
                borderRadius: 8, cursor: "pointer", fontSize: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-secondary)",
              }}>×</button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {messages.length === 0 && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: 10,
                  color: "var(--text-muted)", textAlign: "center", padding: 24,
                }}>
                  <span style={{ fontSize: 36 }}>💬</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6 }}>
                    Ask me anything about<br />
                    <strong style={{ color: "var(--text-secondary)" }}>{result.meta?.title || "your study material"}</strong>
                  </span>
                  <span style={{ fontSize: 12, marginTop: 4 }}>Type a question below!</span>
                </div>
              )}

              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: "12px 20px 18px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question... (Enter to send)"
                rows={1}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 14,
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.5,
                  maxHeight: 100,
                  overflow: "auto",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                style={{
                  width: 40, height: 40,
                  background: input.trim() && !streaming ? "#16A34A" : "var(--border)",
                  border: "none", borderRadius: 10, cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.2s",
                }}
              >
                {streaming ? <Spinner /> : <SendIcon />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div style={{
        maxWidth: "78%",
        padding: "10px 14px",
        borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
        background: isUser ? "#16A34A" : "var(--bg-secondary)",
        color: isUser ? "#fff" : "var(--text-primary)",
        fontSize: 14,
        lineHeight: 1.55,
        border: isUser ? "none" : "1px solid var(--border)",
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        {msg.streaming && <span style={{ opacity: 0.5 }}> ▋</span>}
      </div>
    </motion.div>
  );
}

function ChatIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

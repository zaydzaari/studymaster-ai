import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getReadingTime } from "../utils/readingTime.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

function detectLangSimple(text) {
  if (!text || text.length < 50) return null;
  const arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
  const frenchChars = (text.match(/[àâäéèêëîïôùûüç]/gi) || []).length;
  if (arabicChars > text.length * 0.1) return "ar";
  if (frenchChars > 5) return "fr";
  return "en";
}

function isValidURL(str) {
  return /^https?:\/\/\S+$/.test(str) && !str.includes("\n");
}

const MAX_FILES = 5;

export default function InputPanel({
  inputText, setInputText,
  onSubmitText, onSubmitPDF, onSubmitURL, onSubmitImage, onSubmitMerge,
  streaming, history, onRemoveHistory, lang, submitRef,
}) {
  const { t } = useTranslation();
  const { isMobile } = useIsMobile();
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [outputLang, setOutputLang] = useState(lang || "");
  const [detectedLang, setDetectedLang] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [attachError, setAttachError] = useState("");
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  useEffect(() => { setOutputLang(lang || ""); }, [lang]);

  useEffect(() => {
    if (streaming) setIsCollapsed(true);
  }, [streaming]);

  useEffect(() => {
    if (inputText.length > 200) setDetectedLang(detectLangSimple(inputText));
    else setDetectedLang(null);
  }, [inputText]);

  const readingTime = inputText ? getReadingTime(inputText) : 0;
  const charCount = inputText.length;
  const tooShort = charCount > 0 && charCount < 100;
  const tooLong = charCount > 50000;
  const urlDetected = isValidURL(inputText.trim());

  // Determine what the submit will do based on current state
  const submitMode = (() => {
    if (attachedFiles.length > 1) return "merge";
    if (attachedFiles.length === 1) return attachedFiles[0].kind === "image" ? "image" : "pdf";
    if (urlDetected) return "url";
    return "text";
  })();

  const modeLabel = {
    text: "✍️ Text",
    url: "🌐 URL",
    pdf: "📄 PDF",
    image: "🖼️ Image",
    merge: `📎 ${attachedFiles.length} files`,
  }[submitMode];

  const isDisabled = streaming
    || (submitMode === "text" && !inputText.trim())
    || (submitMode === "url" && !inputText.trim())
    || (submitMode === "pdf" && !attachedFiles.length)
    || (submitMode === "image" && !attachedFiles.length)
    || (submitMode === "merge" && attachedFiles.length < 2);

  const handleSubmit = useCallback(async () => {
    if (streaming || isDisabled) return;
    setAttachError("");
    if (submitMode === "merge") {
      await onSubmitMerge(attachedFiles.map(f => f.file), outputLang);
    } else if (submitMode === "pdf") {
      await onSubmitPDF(attachedFiles[0].file, outputLang);
    } else if (submitMode === "image") {
      await onSubmitImage(attachedFiles[0].file, outputLang);
    } else if (submitMode === "url") {
      await onSubmitURL(inputText.trim(), outputLang);
    } else {
      await onSubmitText(inputText, outputLang);
    }
  }, [streaming, isDisabled, submitMode, attachedFiles, inputText, outputLang,
      onSubmitMerge, onSubmitPDF, onSubmitImage, onSubmitURL, onSubmitText]);

  const attachFile = useCallback((file) => {
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPDF && !isImage) {
      setAttachError("Only PDF and image files accepted.");
      return;
    }
    const maxBytes = (isPDF ? 50 : 20) * 1024 * 1024;
    if (file.size > maxBytes) {
      setAttachError(`File too large (max ${isPDF ? "50" : "20"}MB)`);
      return;
    }
    setAttachedFiles(prev => {
      if (prev.length >= MAX_FILES) { setAttachError("Maximum 5 files"); return prev; }
      const kind = isPDF ? "pdf" : "image";
      const preview = isImage ? URL.createObjectURL(file) : null;
      return [...prev, { file, kind, preview, id: Date.now() + Math.random() }];
    });
    setAttachError("");
  }, []);

  const removeFile = useCallback((id) => {
    setAttachedFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleFileInput = (e) => {
    Array.from(e.target.files).forEach(attachFile);
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsDragging(false); }
  };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(attachFile);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) attachFile(f);
      }
    }
  };

  const panelStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: isMobile ? 0 : 12,
    padding: isMobile ? "12px 12px 0" : 24,
    ...(isMobile && { borderLeft: "none", borderRight: "none", borderTop: "none" }),
  };

  return (
    <div data-demo-id="input-panel" style={panelStyle}>
      {/* Mobile collapse toggle */}
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(c => !c)}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "4px 0 12px",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
          }}
        >
          <span>{isCollapsed ? "✏️ Tap to add content" : "📖 Add Content"}</span>
          <span style={{ fontSize: 16, transition: "transform 0.25s", transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {(!isMobile || !isCollapsed) && (
          <motion.div
            key="panel-content"
            initial={isMobile ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Unified input container */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: `2px solid ${isDragging ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                background: isDragging ? "rgba(37,99,235,0.04)" : "var(--bg-card)",
                transition: "border-color 0.15s, background 0.15s",
                overflow: "hidden",
              }}
            >
              {/* Textarea */}
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPaste={handlePaste}
                placeholder={
                  isDragging
                    ? "Drop your file here..."
                    : "Paste text, drop a PDF/image, or type a URL..."
                }
                style={{
                  width: "100%",
                  minHeight: isMobile ? 100 : 160,
                  resize: "vertical",
                  padding: "14px",
                  border: "none",
                  fontSize: 15,
                  lineHeight: 1.6,
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  display: "block",
                }}
              />

              {/* Attached file chips */}
              {attachedFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 12px 10px" }}>
                  {attachedFiles.map(af => (
                    <FileChip key={af.id} af={af} onRemove={() => removeFile(af.id)} />
                  ))}
                </div>
              )}

              {/* Bottom toolbar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 12px 12px",
                borderTop: "1px solid var(--border)",
                flexWrap: "wrap",
              }}>
                {/* Attach button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach PDF or image (or drag & drop)"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: isMobile ? "10px 14px" : "6px 11px", background: "var(--bg-secondary)",
                    border: "1px solid var(--border)", borderRadius: 7,
                    fontSize: 13, color: "var(--text-secondary)",
                    cursor: "pointer", fontWeight: 500,
                    transition: "border-color 0.15s, color 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  <PaperclipIcon />
                  {!isMobile && "Attach"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />

                {/* Mode badge */}
                <span style={{
                  fontSize: 11, padding: "4px 9px",
                  background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  borderRadius: 99, color: "var(--text-muted)", fontWeight: 500,
                  flexShrink: 0,
                }}>
                  {modeLabel}
                </span>

                <div style={{ flex: 1 }} />

                {/* Hints */}
                <div style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--text-muted)", alignItems: "center" }}>
                  {tooShort && <span style={{ color: "var(--warning)" }}>⚠ Too short</span>}
                  {tooLong && <span style={{ color: "var(--warning)" }}>Truncated</span>}
                  {detectedLang && (
                    <span style={{ color: "var(--accent)" }}>
                      🌍 {detectedLang === "ar" ? "AR" : detectedLang === "fr" ? "FR" : "EN"}
                    </span>
                  )}
                  {readingTime > 0 && !isMobile && <span>{readingTime}m read</span>}
                  {charCount > 0 && <span className="mono">{charCount.toLocaleString()}</span>}
                </div>

                {/* Submit */}
                <button
                  data-demo-id="submit-btn"
                  ref={submitRef}
                  onClick={handleSubmit}
                  disabled={isDisabled}
                  style={{
                    padding: "8px 18px",
                    background: streaming ? "var(--border)" : "var(--accent)",
                    color: streaming ? "var(--text-muted)" : "white",
                    border: "none", borderRadius: 8,
                    fontSize: 14, fontWeight: 600,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 6,
                    opacity: isDisabled ? 0.5 : 1,
                    minHeight: 44, whiteSpace: "nowrap",
                    touchAction: "manipulation",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
                >
                  {streaming ? (
                    <><Spinner /> {t("input.submitting")}</>
                  ) : (
                    <>
                      ✨ {t("input.submit")}
                      {!isMobile && (
                        <span style={{ fontSize: 11, opacity: 0.65, fontFamily: "'Geist Mono', monospace" }}>
                          Ctrl↵
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Attach error */}
            {attachError && (
              <div style={{ fontSize: 12, color: "var(--error, #DC2626)", marginTop: 4, padding: "0 4px" }}>
                {attachError}
              </div>
            )}

            {/* History */}
            {history.length > 0 && !isMobile && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", padding: 0 }}
                >
                  {t("input.history")} {showHistory ? "▲" : "▼"}
                </button>
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden", marginTop: 8 }}
                    >
                      {history.map(item => (
                        <div key={item.id} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 8px", borderRadius: 6,
                          background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 4,
                        }}>
                          <span style={{ fontSize: 14 }}>
                            {item.type === "pdf" ? "📄" : item.type === "url" ? "🌐" : item.type === "image" ? "🖼️" : "📝"}
                          </span>
                          <span
                            style={{
                              flex: 1, fontSize: 12, color: "var(--text-secondary)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              cursor: item.type === "text" ? "pointer" : "default",
                            }}
                            onClick={() => { if (item.type === "text") setInputText(item.content); }}
                          >
                            {item.content}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => onRemoveHistory(item.id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 4px", fontSize: 14, lineHeight: 1 }}
                          >×</button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FileChip({ af, onRemove }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "4px 8px 4px 6px",
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      borderRadius: 6, fontSize: 12, color: "var(--text-secondary)", maxWidth: 200,
    }}>
      {af.kind === "image" && af.preview
        ? <img src={af.preview} alt="" style={{ width: 18, height: 18, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
        : <span style={{ flexShrink: 0 }}>{af.kind === "pdf" ? "📄" : "🖼️"}</span>
      }
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {af.file.name}
      </span>
      <button
        onClick={onRemove}
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, fontSize: 15, lineHeight: 1, flexShrink: 0 }}
      >×</button>
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}

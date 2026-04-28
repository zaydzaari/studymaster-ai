import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import PDFUpload from "./PDFUpload.jsx";
import URLInput from "./URLInput.jsx";
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

export default function InputPanel({
  inputText, setInputText, inputType, setInputType,
  onSubmitText, onSubmitPDF, onSubmitURL,
  streaming, history, onRemoveHistory, lang, submitRef,
}) {
  const { t } = useTranslation();
  const { isMobile } = useIsMobile();
  const [activeTab, setActiveTab] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [detectedLang, setDetectedLang] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [outputLang, setOutputLang] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (inputText.length > 200) {
      setDetectedLang(detectLangSimple(inputText));
    } else {
      setDetectedLang(null);
    }
  }, [inputText]);

  // Expand panel when streaming starts so user can see what's happening
  useEffect(() => {
    if (streaming) setIsCollapsed(true);
  }, [streaming]);

  const readingTime = inputText ? getReadingTime(inputText) : 0;
  const charCount = inputText.length;
  const tooShort = charCount > 0 && charCount < 100;
  const tooLong = charCount > 50000;

  const handleSubmit = useCallback(async () => {
    if (streaming) return;
    if (activeTab === 0) {
      await onSubmitText(inputText, outputLang);
    } else if (activeTab === 1) {
      await onSubmitText(pdfText, outputLang);
    } else {
      await onSubmitURL(urlValue, outputLang);
    }
  }, [streaming, activeTab, inputText, pdfText, urlValue, outputLang, onSubmitText, onSubmitURL]);

  const tabLabel = [t("input.tabs.text"), t("input.tabs.pdf"), t("input.tabs.url")];

  const isDisabled = streaming
    || (activeTab === 0 && !inputText.trim())
    || (activeTab === 1 && !pdfText)
    || (activeTab === 2 && !urlValue.trim());

  const panelStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: isMobile ? 0 : 12,
    padding: isMobile ? "12px 12px 0" : 24,
    ...(isMobile && {
      borderLeft: "none",
      borderRight: "none",
      borderTop: "none",
    }),
  };

  return (
    <div data-demo-id="input-panel" style={panelStyle}>
      {/* Mobile collapse toggle */}
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(c => !c)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 0 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span>
            {isCollapsed
              ? "✏️ Tap to add content"
              : "📖 Add Content"}
          </span>
          <span style={{
            fontSize: 16,
            transition: "transform 0.25s",
            transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
          }}>
            ▾
          </span>
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
            {/* Tabs */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              marginBottom: 16,
              overflowX: "auto",
            }}>
              {tabLabel.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  style={{
                    padding: isMobile ? "12px 14px" : "10px 16px",
                    border: "none",
                    background: "transparent",
                    color: activeTab === i ? "var(--accent)" : "var(--text-secondary)",
                    borderBottom: activeTab === i ? "2px solid var(--accent)" : "2px solid transparent",
                    fontSize: 14,
                    fontWeight: activeTab === i ? 500 : 400,
                    cursor: "pointer",
                    transition: "color 0.15s",
                    marginBottom: -1,
                    whiteSpace: "nowrap",
                    touchAction: "manipulation",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Text input */}
            {activeTab === 0 && (
              <div>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={t("input.placeholder")}
                  style={{
                    width: "100%",
                    minHeight: isMobile ? 140 : 200,
                    resize: "vertical",
                    padding: "12px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 16,
                    lineHeight: 1.6,
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "var(--accent)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {/* Quality indicators */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  flexWrap: "wrap",
                  gap: 4,
                }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {tooShort && (
                      <span style={{ color: "var(--warning)" }}>
                        ⚠ {t("input.qualityShort")}
                      </span>
                    )}
                    {tooLong && (
                      <span style={{ color: "var(--warning)" }}>
                        {t("input.qualityLong")}
                      </span>
                    )}
                    {detectedLang && (
                      <span style={{ color: "var(--accent)" }}>
                        🌍 {t("input.detected", { lang: detectedLang === "ar" ? "Arabic" : detectedLang === "fr" ? "French" : "English" })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {readingTime > 0 && (
                      <span>{t("input.readingTime", { min: readingTime })}</span>
                    )}
                    <span className="mono">{charCount.toLocaleString()} chars</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <PDFUpload onFile={setPdfFile} onTextExtracted={setPdfText} />
            )}

            {activeTab === 2 && (
              <URLInput value={urlValue} onChange={setUrlValue} />
            )}

            {/* Submit */}
            <div style={{ marginTop: 12, paddingBottom: isMobile ? 12 : 0 }}>
              <button
                data-demo-id="submit-btn"
                ref={submitRef}
                onClick={handleSubmit}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: streaming ? "var(--border)" : "var(--accent)",
                  color: streaming ? "var(--text-muted)" : "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: streaming ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isDisabled ? 0.5 : 1,
                  minHeight: 48,
                  touchAction: "manipulation",
                }}
                onMouseEnter={e => {
                  if (!streaming) {
                    e.currentTarget.style.background = "var(--accent-hover)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={e => {
                  if (!streaming) {
                    e.currentTarget.style.background = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {streaming ? (
                  <>
                    <Spinner />
                    {t("input.submitting")}
                  </>
                ) : (
                  <>
                    ✨ {t("input.submit")}
                    {!isMobile && (
                      <span style={{ fontSize: 11, opacity: 0.7, fontFamily: "'Geist Mono', monospace" }}>
                        Ctrl ↵
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* History */}
            {history.length > 0 && !isMobile && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 0,
                  }}
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
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 6,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>
                            {item.type === "pdf" ? "📄" : item.type === "url" ? "🌐" : "📝"}
                          </span>
                          <span
                            style={{
                              flex: 1, fontSize: 12,
                              color: "var(--text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              if (item.type === "text") {
                                setInputText(item.content);
                                setActiveTab(0);
                              }
                            }}
                          >
                            {item.content}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => onRemoveHistory(item.id)}
                            style={{
                              background: "none", border: "none",
                              color: "var(--text-muted)", cursor: "pointer",
                              padding: "0 4px", fontSize: 14, lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
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

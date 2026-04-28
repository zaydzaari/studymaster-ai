import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  // Use the bundled worker
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).href;

  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    text += pageText + "\n";
  }

  return text.trim();
}

export default function PDFUpload({ onFile, onTextExtracted }) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setError("");
    setExtracted(false);

    if (f.type !== "application/pdf") {
      setError(t("error.pdfOnly"));
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError(t("error.pdfSize"));
      return;
    }

    setFile(f);
    setExtracting(true);

    try {
      const text = await extractTextFromPDF(f);
      if (!text || text.trim().length < 20) {
        setError("Could not extract text from this PDF. It may be image-based or encrypted.");
        setFile(null);
        onFile(null);
        return;
      }
      setExtracted(true);
      onFile(f);
      onTextExtracted(text);
    } catch (err) {
      console.error("PDF extract error:", err);
      setError("Failed to read PDF. Please try a different file.");
      setFile(null);
      onFile(null);
    } finally {
      setExtracting(false);
    }
  }, [onFile, onTextExtracted, t]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const reset = useCallback((e) => {
    e.stopPropagation();
    setFile(null);
    setExtracted(false);
    setError("");
    onFile(null);
    onTextExtracted("");
  }, [onFile, onTextExtracted]);

  return (
    <div>
      <motion.div animate={error ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.3 }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && !extracting && inputRef.current?.click()}
          style={{
            border: `2px ${dragOver ? "solid var(--accent)" : "dashed var(--border)"}`,
            borderRadius: 8,
            padding: "32px 24px",
            textAlign: "center",
            background: dragOver ? "var(--accent-light)" : "var(--bg-card)",
            cursor: file || extracting ? "default" : "pointer",
            transition: "all 0.2s",
          }}
        >
          <motion.div animate={{ scale: dragOver ? 1.08 : 1 }}>
            {extracting ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 28 }}>⏳</div>
                <div style={{ fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>
                  Extracting text from PDF...
                </div>
                <div style={{ width: 120, height: 4, background: "var(--bg-secondary)", borderRadius: 999, overflow: "hidden" }}>
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "50%", height: "100%", background: "var(--accent)", borderRadius: 999 }}
                  />
                </div>
              </div>
            ) : extracted ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 32 }}>✅</div>
                <div style={{ fontWeight: 600, color: "var(--success)", fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Text extracted
                </div>
                <button onClick={reset} style={{ fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 32 }}>{dragOver ? "⬇️" : "📄"}</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {dragOver ? "Drop to upload" : "Drag & drop your PDF here"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>or click to browse · max 50MB</div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 8, fontSize: 12, color: "var(--error)" }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

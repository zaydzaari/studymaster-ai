import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILES = 5;
const MAX_SIZE = 20 * 1024 * 1024;

const ACCEPTED = new Set([
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif",
]);

function fileIcon(mimetype) {
  return mimetype === "application/pdf" ? "📄" : "🖼️";
}

export default function MultiUpload({ onFiles }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const addFiles = useCallback((incoming) => {
    setError("");
    const toAdd = [];
    for (const f of incoming) {
      if (!ACCEPTED.has(f.type)) { setError(`"${f.name}" is not a supported format.`); continue; }
      if (f.size > MAX_SIZE) { setError(`"${f.name}" exceeds 20 MB.`); continue; }
      toAdd.push(f);
    }
    setFiles(prev => {
      const merged = [...prev, ...toAdd].slice(0, MAX_FILES);
      onFiles(merged.length >= 2 ? merged : null);
      return merged;
    });
  }, [onFiles]);

  const remove = useCallback((idx) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      onFiles(next.length >= 2 ? next : null);
      return next;
    });
  }, [onFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  return (
    <div>
      {/* Drop zone */}
      <motion.div
        animate={error ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
          style={{
            border: `2px ${dragOver ? "solid var(--accent)" : "dashed var(--border)"}`,
            borderRadius: 8,
            padding: files.length ? "16px" : "28px 24px",
            textAlign: "center",
            background: dragOver ? "var(--accent-light)" : "var(--bg-card)",
            cursor: files.length >= MAX_FILES ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {files.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 32 }}>{dragOver ? "⬇️" : "📚"}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                {dragOver ? "Drop files here" : "Drag & drop 2–5 files to merge"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                PDF or images · max 20MB each
              </div>
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500, marginTop: 4 }}>
                ✨ Gemini synthesizes all files into one study package
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: "var(--bg-secondary)",
                  borderRadius: 8, border: "1px solid var(--border)", textAlign: "left",
                }}>
                  <span style={{ fontSize: 20 }}>{fileIcon(f.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); remove(i); }}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
                  >×</button>
                </div>
              ))}
              {files.length < MAX_FILES && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "8px", fontSize: 12, color: "var(--accent)",
                  border: "1px dashed var(--accent)", borderRadius: 8, opacity: 0.7,
                }}>
                  + Add more ({files.length}/{MAX_FILES})
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {files.length === 1 && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--warning)" }}>
          ⚠ Add at least one more file to merge
        </div>
      )}

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

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,image/gif,image/heic"
        style={{ display: "none" }}
        onChange={e => { addFiles(Array.from(e.target.files)); e.target.value = ""; }}
      />
    </div>
  );
}

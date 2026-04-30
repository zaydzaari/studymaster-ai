import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPTED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif",
]);

export default function ImageUpload({ onFile }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setError("");

    if (!ACCEPTED_TYPES.has(f.type)) {
      setError("Accepted formats: JPEG, PNG, WebP, GIF, HEIC.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Image must be under 20 MB.");
      return;
    }

    setFile(f);
    onFile(f);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, [onFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const reset = useCallback((e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setError("");
    onFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFile]);

  return (
    <div>
      <motion.div animate={error ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.3 }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
          style={{
            border: `2px ${dragOver ? "solid var(--accent)" : "dashed var(--border)"}`,
            borderRadius: 8,
            padding: file ? "16px" : "32px 24px",
            textAlign: "center",
            background: dragOver ? "var(--accent-light)" : "var(--bg-card)",
            cursor: file ? "default" : "pointer",
            transition: "all 0.2s",
          }}
        >
          <motion.div animate={{ scale: dragOver ? 1.08 : 1 }}>
            {file ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 6,
                      objectFit: "contain",
                      border: "1px solid var(--border)",
                    }}
                  />
                )}
                <div style={{ fontWeight: 600, color: "var(--success)", fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze
                </div>
                <button onClick={reset} style={{ fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 36 }}>{dragOver ? "⬇️" : "🖼️"}</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {dragOver ? "Drop to upload" : "Drag & drop an image here"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  or click to browse · JPEG, PNG, WebP, GIF, HEIC · max 20MB
                </div>
                <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontWeight: 500 }}>
                  📸 Textbook pages · 📋 Whiteboards · ✍️ Handwritten notes
                </div>
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

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}

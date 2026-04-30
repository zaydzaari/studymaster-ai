import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VERSIONS } from "../data/versions.js";

export default function ChangelogModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 5000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 480,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                What's New
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                StudyMaster AI — Release History
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, border: "none",
                background: "var(--bg-secondary)", borderRadius: 8,
                cursor: "pointer", fontSize: 18, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              ×
            </button>
          </div>

          {/* Versions list */}
          <div style={{ overflowY: "auto", padding: "8px 0 16px" }}>
            {VERSIONS.map((v, vi) => (
              <div key={v.version} style={{ padding: "16px 20px" }}>
                {/* Version header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontWeight: 700, fontSize: 15,
                    color: "var(--text-primary)",
                  }}>
                    v{v.version}
                  </span>
                  {v.label && (
                    <span style={{
                      background: vi === 0 ? "var(--accent)" : "var(--bg-secondary)",
                      color: vi === 0 ? "#fff" : "var(--text-secondary)",
                      border: vi === 0 ? "none" : "1px solid var(--border)",
                      padding: "2px 8px", borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {v.label}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                    {v.date}
                  </span>
                </div>

                {/* Changes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {v.changes.map((change, ci) => (
                    <div key={ci} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{
                        color: "var(--accent)", fontWeight: 700,
                        fontSize: 13, flexShrink: 0, marginTop: 1,
                      }}>
                        +
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {change}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Divider between versions */}
                {vi < VERSIONS.length - 1 && (
                  <div style={{
                    height: 1, background: "var(--border)",
                    marginTop: 16, marginLeft: -20, marginRight: -20,
                  }} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { deepDive } from "../utils/api.js";

export default function DeepDivePanel({ concept, subject, onClose, onDebug }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    deepDive(concept, subject)
      .then(d => {
        if (cancelled) return;
        const { __debug, ...rest } = d;
        if (__debug && onDebug) onDebug(__debug);
        setData(rest);
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [concept, subject]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      style={{
        position: "fixed",
        top: 120,
        right: 24,
        width: 340,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        padding: 20,
        zIndex: 500,
        maxHeight: "calc(100vh - 160px)",
        overflowY: "auto",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 4 }}>
            Deep Dive
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{concept}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--bg-secondary)",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
          }}
        >
          ×
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: "100%" }} />
          <div className="skeleton" style={{ height: 14, width: "90%" }} />
          <div className="skeleton" style={{ height: 14, width: "95%" }} />
          <div className="skeleton" style={{ height: 14, width: "80%" }} />
        </div>
      )}

      {error && (
        <div style={{ color: "var(--error)", fontSize: 13 }}>{error}</div>
      )}

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
              Definition
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)" }}>{data.definition}</p>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
              Real-world Example
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)" }}>{data.example}</p>
          </div>

          <div style={{
            background: "var(--accent-light)",
            border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: 8,
            padding: "12px 14px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
              Why it Matters
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>{data.importance}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { deepDive } from "../utils/api.js";

export default function DeepDivePanel({ concept, subject, onClose, onDebug }) {
  const { t } = useTranslation();
  const { isMobile } = useIsMobile();
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

  const panelStyle = isMobile ? {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "var(--bg-card)",
    borderRadius: "16px 16px 0 0",
    borderTop: "1px solid var(--border)",
    borderLeft: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
    padding: 20,
    paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
    zIndex: 600,
    maxHeight: "70vh",
    overflowY: "auto",
  } : {
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
  };

  const motionProps = isMobile ? {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
    transition: { type: "spring", damping: 30, stiffness: 350 },
  } : {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 599,
          }}
        />
      )}

      <motion.div {...motionProps} style={panelStyle}>
        {/* Drag handle (mobile only) */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, marginTop: -4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
          </div>
        )}

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
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>{concept}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg-secondary)",
              cursor: "pointer",
              fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)",
              flexShrink: 0,
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
          <div style={{ color: "var(--error)", fontSize: 14 }}>{error}</div>
        )}

        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                Definition
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-primary)", margin: 0 }}>{data.definition}</p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                Real-world Example
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-primary)", margin: 0 }}>{data.example}</p>
            </div>

            <div style={{
              background: "var(--accent-light)",
              border: "1px solid rgba(37,99,235,0.15)",
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
                Why it Matters
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)", margin: 0 }}>{data.importance}</p>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

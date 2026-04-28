import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ExportButton({ onExport }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onExport();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      style={{
        padding: "5px 12px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        fontSize: 12,
        color: "var(--text-secondary)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--border)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
      title="Ctrl+P"
    >
      {loading ? "⏳" : "⬇"} {t("actions.exportPdf")}
    </button>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";

export default function URLInput({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={t("input.urlPlaceholder")}
        style={{
          width: "100%",
          height: 40,
          padding: "0 12px",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 14,
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
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
        📌 Wikipedia, news articles, documentation pages — any public URL
      </div>
    </div>
  );
}

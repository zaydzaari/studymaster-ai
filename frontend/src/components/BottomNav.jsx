import React from "react";
import { useTranslation } from "react-i18next";

const TABS = [
  { icon: "📚", labelKey: "results.tabs.summary", tabIndex: 0 },
  { icon: "❓", labelKey: "results.tabs.questions", tabIndex: 3 },
  { icon: "📇", labelKey: "results.tabs.flashcards", tabIndex: 4 },
  { icon: "📝", labelKey: "results.tabs.quiz", tabIndex: 5 },
];

export default function BottomNav({ activeTab, onTabChange, hasResult }) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(56px + env(safe-area-inset-bottom, 0px))`,
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.tabIndex;
        return (
          <button
            key={tab.tabIndex}
            onClick={() => hasResult && onTabChange(tab.tabIndex)}
            aria-label={t(tab.labelKey)}
            style={{
              flex: 1,
              height: 56,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              border: "none",
              background: "none",
              cursor: hasResult ? "pointer" : "default",
              opacity: hasResult ? 1 : 0.35,
              color: isActive && hasResult ? "var(--accent)" : "var(--text-muted)",
              fontSize: 10,
              fontWeight: isActive && hasResult ? 600 : 400,
              transition: "color 0.15s, opacity 0.15s",
              touchAction: "manipulation",
            }}
          >
            {/* Active indicator */}
            {isActive && hasResult && (
              <div style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: 2,
                background: "var(--accent)",
                borderRadius: "0 0 3px 3px",
              }} />
            )}
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, lineHeight: 1 }}>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

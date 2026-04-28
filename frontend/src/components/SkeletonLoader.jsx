import React from "react";

function Bar({ width, delay = 0 }) {
  return (
    <div
      className="skeleton"
      style={{
        height: 16,
        width,
        borderRadius: 4,
        animationDelay: `${delay}s`,
        marginBottom: 8,
      }}
    />
  );
}

export default function SkeletonLoader() {
  return (
    <div style={{ padding: "8px 0" }}>
      {/* Summary */}
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ height: 20, width: "40%", marginBottom: 16, borderRadius: 4 }} />
        <Bar width="90%" delay={0} />
        <Bar width="85%" delay={0.1} />
        <Bar width="88%" delay={0.2} />
        <Bar width="60%" delay={0.3} />
      </div>

      {/* Key points */}
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ height: 20, width: "35%", marginBottom: 16, borderRadius: 4 }} />
        {[0.4, 0.5, 0.6, 0.7, 0.8].map((delay, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, animationDelay: `${delay}s` }} />
            <Bar width={`${75 + i * 4}%`} delay={delay} />
          </div>
        ))}
      </div>

      {/* Flashcard placeholder */}
      <div className="skeleton" style={{ height: 140, borderRadius: 12, width: "100%", animationDelay: "0.9s" }} />
    </div>
  );
}

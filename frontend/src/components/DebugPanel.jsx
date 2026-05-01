import React, { useState } from "react";

function ms(val) {
  if (val == null) return "—";
  if (val >= 1000) return `${(val / 1000).toFixed(2)}s`;
  return `${val}ms`;
}

function Badge({ children, color }) {
  const colors = {
    green:  { bg: "#dcfce7", text: "#16a34a", border: "#bbf7d0" },
    orange: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
    blue:   { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
    red:    { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    purple: { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700,
      fontFamily: "'Geist Mono', monospace", letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{label}</span>
      <span style={{
        color: "var(--text-primary)", fontSize: 11, fontWeight: 600,
        fontFamily: mono ? "'Geist Mono', monospace" : undefined,
        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textAlign: "right",
      }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-secondary)", marginBottom: 4, opacity: 0.7,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function bytes(n) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export default function DebugPanel({ streamDebug, deepDiveDebug, voiceDebug, streaming, visible }) {
  const [open, setOpen] = useState(true);

  if (!visible) return null;

  const d = streamDebug;
  const dd = deepDiveDebug;

  return (
    <div style={{
      position: "fixed",
      bottom: 80,
      left: 16,
      zIndex: 9999,
      fontFamily: "'Geist Mono', monospace",
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: open ? "8px 8px 0 0" : 8,
          padding: "5px 10px",
          cursor: "pointer",
          fontSize: 10, fontWeight: 700,
          color: "var(--text-secondary)",
          letterSpacing: "0.05em",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: streaming ? "#22c55e" : (d ? "#2563eb" : "#94a3b8"),
            boxShadow: streaming ? "0 0 6px #22c55e" : "none",
            animation: streaming ? "pulse 1s infinite" : "none",
          }} />
          DEBUG
        </span>
        <span>{open ? "▼" : "▲"}</span>
      </button>

      {open && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          padding: "12px 14px",
          width: 240,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}>

          {/* ── MAIN AI ── */}
          <Section title="AI Model">
            {d ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.modelUsed}
                  </span>
                  <Badge color={d.fallback ? "orange" : "green"}>
                    {d.fallback ? "FALLBACK" : "PRIMARY"}
                  </Badge>
                </div>
                {d.fallback && d.primaryError && (
                  <div style={{
                    fontSize: 10, color: "#dc2626",
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 4, padding: "3px 6px", marginBottom: 4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }} title={d.primaryError}>
                    ⚠ {d.primaryError}
                  </div>
                )}
                <Row label="Primary" value={d.primaryModel} mono />
                <Row label="Fallback" value={d.fallbackModel} mono />
              </>
            ) : (
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>No request yet</span>
            )}
          </Section>

          {/* ── TIMING ── */}
          {d && (
            <Section title="Timing">
              <Row label="Time to first token" value={ms(d.ttft)} mono />
              <Row label="Server duration" value={ms(d.duration)} mono />
              <Row label="Client duration" value={ms(d.clientDuration)} mono />
            </Section>
          )}

          {/* ── STREAM ── */}
          {d && (
            <Section title="Stream">
              <Row label="Chunks received" value={d.chunks ?? "—"} mono />
              <Row label="Input type" value={d.inputType} />
              <Row label="Input length" value={d.inputLength ? `${d.inputLength.toLocaleString()} chars` : "—"} />
            </Section>
          )}

          {/* ── DEEP DIVE ── */}
          {dd && (
            <Section title="Last Deep Dive">
              <Row label="Model" value={dd.modelUsed} mono />
              <Badge color={dd.fallback ? "orange" : "green"}>
                {dd.fallback ? "FALLBACK" : "PRIMARY"}
              </Badge>
              <div style={{ marginTop: 4 }}>
                <Row label="Duration" value={ms(dd.duration)} mono />
              </div>
              {dd.fallback && dd.primaryError && (
                <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={dd.primaryError}>
                  ⚠ {dd.primaryError}
                </div>
              )}
            </Section>
          )}

          {/* ── REQUEST TIME ── */}
          {d?.requestedAt && (
            <Section title="Last Request">
              <Row label="Time" value={new Date(d.requestedAt).toLocaleTimeString()} />
            </Section>
          )}

          {/* ── VOICE TUTOR ── */}
          {voiceDebug && (
            <Section title="Voice Tutor">
              {/* WS state */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background:
                    voiceDebug.wsState === "open" ? "#22c55e"
                    : voiceDebug.wsState === "connecting" ? "#f59e0b"
                    : voiceDebug.wsState === "error" ? "#ef4444"
                    : "#94a3b8",
                }} />
                <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>
                  WS: {voiceDebug.wsState}
                </span>
                {voiceDebug.sessionConnected && (
                  <Badge color="green">SESSION OK</Badge>
                )}
              </div>

              <Row label="Mic" value={
                voiceDebug.micGranted === null ? "not asked"
                : voiceDebug.micGranted ? `granted (${voiceDebug.micSampleRate || "?"}Hz)`
                : "DENIED"
              } />
              <Row label="WS URL" value={voiceDebug.wsUrl ? voiceDebug.wsUrl.replace("ws://", "").replace("wss://", "") : "—"} mono />
              <Row label="Audio → server" value={`${voiceDebug.chunksSent ?? 0} chunks / ${bytes(voiceDebug.bytesSent)}`} mono />
              <Row label="Audio ← server" value={`${voiceDebug.chunksReceived ?? 0} chunks / ${bytes(voiceDebug.bytesReceived)}`} mono />
              {voiceDebug.openedAt && (
                <Row label="Opened at" value={new Date(voiceDebug.openedAt).toLocaleTimeString()} />
              )}
              {voiceDebug.lastError && (
                <div style={{
                  fontSize: 10, color: "#dc2626",
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 4, padding: "3px 6px", marginTop: 4,
                  wordBreak: "break-word", lineHeight: 1.4,
                }}>
                  ⚠ {voiceDebug.lastError}
                </div>
              )}
            </Section>
          )}

          {/* Status */}
          <div style={{
            borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4,
            display: "flex", alignItems: "center", gap: 6, fontSize: 10,
            color: "var(--text-secondary)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: streaming ? "#22c55e" : "#94a3b8",
            }} />
            {streaming ? "Streaming…" : "Idle"}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

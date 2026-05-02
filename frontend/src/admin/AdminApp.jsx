import React, { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

const TYPE_LABELS = {
  text: "Text",
  pdf: "PDF",
  url: "URL",
  image: "Image",
  merge: "Multi-Doc",
  deepdive: "Deep Dive",
  chat: "AI Tutor",
  flashcards_more: "+ Flashcards",
  quiz_more: "+ Quiz",
};

const TYPE_COLORS = {
  text: "#3b82f6",
  pdf: "#f59e0b",
  url: "#10b981",
  image: "#8b5cf6",
  merge: "#06b6d4",
  deepdive: "#0284c7",
  chat: "#ec4899",
  flashcards_more: "#059669",
  quiz_more: "#d97706",
};

const LANG_LABELS = { en: "English 🇬🇧", fr: "French 🇫🇷", ar: "Arabic 🇸🇦" };
const LANG_COLORS = { en: "#3b82f6", fr: "#f59e0b", ar: "#10b981" };

// ── Styles ───────────────────────────────────────────────────────
const S = {
  bg:     "#0f172a",
  card:   "#1e293b",
  border: "#334155",
  accent: "#3b82f6",
  text:   "#f1f5f9",
  muted:  "#94a3b8",
  error:  "#ef4444",
  success:"#10b981",
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${S.bg}; color: ${S.text}; font-family: system-ui, sans-serif; font-size: 14px; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: ${S.border}; border-radius: 4px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
`;

function formatUptime(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Login Screen ──────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.status === 401) { setErr("Wrong admin key."); return; }
      if (!res.ok) throw new Error("Server error");
      sessionStorage.setItem("adminKey", key);
      onLogin(key);
    } catch {
      setErr("Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: S.card, border: `1px solid ${S.border}`, borderRadius: 16,
        padding: "40px 36px", width: "100%", maxWidth: 380,
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: S.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 16px",
          }}>🎓</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>StudyMaster Admin</div>
          <div style={{ color: S.muted, fontSize: 13, marginTop: 6 }}>Enter your admin key to continue</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Admin key"
            autoFocus
            style={{
              padding: "12px 16px", background: S.bg, border: `1px solid ${err ? S.error : S.border}`,
              borderRadius: 10, fontSize: 14, color: S.text, outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = S.accent; }}
            onBlur={e => { e.target.style.borderColor = err ? S.error : S.border; }}
          />
          {err && <div style={{ color: S.error, fontSize: 12 }}>{err}</div>}
          <button type="submit" disabled={loading || !key.trim()} style={{
            padding: "12px", background: S.accent, color: "#fff", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: loading || !key.trim() ? "not-allowed" : "pointer",
            opacity: loading || !key.trim() ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}>
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = S.accent, icon }) {
  return (
    <div style={{
      background: S.card, border: `1px solid ${S.border}`,
      borderRadius: 12, padding: "20px 24px",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: S.muted }}>
          {label}
        </div>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: S.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Bar Chart by Type ─────────────────────────────────────────────
function TypeChart({ byType }) {
  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 20 }}>Requests by Type</div>
      {entries.length === 0 && (
        <div style={{ color: S.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No data yet</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map(([type, count]) => (
          <div key={type}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: TYPE_COLORS[type] || S.muted, fontWeight: 600 }}>
                {TYPE_LABELS[type] || type}
              </span>
              <span style={{ color: S.muted, fontFamily: "monospace" }}>{count}</span>
            </div>
            <div style={{ height: 8, background: S.bg, borderRadius: 999 }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: TYPE_COLORS[type] || S.accent,
                width: `${(count / max) * 100}%`,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Language Breakdown ────────────────────────────────────────────
function LangChart({ byLang }) {
  const entries = Object.entries(byLang).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 20 }}>Output Language</div>
      {entries.length === 0 && (
        <div style={{ color: S.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No data yet</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {entries.map(([lang, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={lang} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${LANG_COLORS[lang] || S.muted}22`,
                border: `1px solid ${LANG_COLORS[lang] || S.muted}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>
                {lang === "ar" ? "🇸🇦" : lang === "fr" ? "🇫🇷" : "🇬🇧"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{LANG_LABELS[lang] || lang}</span>
                  <span style={{ color: S.muted }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: S.bg, borderRadius: 999 }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    background: LANG_COLORS[lang] || S.muted,
                    width: `${pct}%`, transition: "width 0.6s",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Daily Activity SVG Chart ──────────────────────────────────────
function DailyChart({ daily }) {
  const W = 600, H = 120, PAD = { top: 12, right: 16, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const values = days.map(d => daily[d] || 0);
  const maxVal = Math.max(...values, 1);

  const pts = values.map((v, i) => ({
    x: PAD.left + (i / (days.length - 1)) * innerW,
    y: PAD.top + innerH - (v / maxVal) * innerH,
    v, date: days[i],
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + innerH} L ${pts[0].x} ${PAD.top + innerH} Z`;

  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>Daily Activity (last 14 days)</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={S.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={S.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = PAD.top + innerH * (1 - frac);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke={S.border} strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                fill={S.muted} fontSize="9">
                {Math.round(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={S.accent} strokeWidth="2" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p, i) => p.v > 0 && (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={S.accent} stroke={S.card} strokeWidth="2" />
        ))}

        {/* X-axis labels — every 2 days */}
        {pts.filter((_, i) => i % 2 === 0).map((p, i) => (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fill={S.muted} fontSize="9">
            {p.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Recent Activity Table ─────────────────────────────────────────
function RecentActivity({ events }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>Recent Activity</div>
      {events.length === 0 && (
        <div style={{ color: S.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No activity yet</div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Type", "Language", "Duration", "Status", "When"].map(h => (
                <th key={h} style={{
                  textAlign: "left", padding: "6px 12px 10px 0",
                  color: S.muted, fontWeight: 600, fontSize: 11,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  borderBottom: `1px solid ${S.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 20).map((ev, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${S.border}22` }}>
                <td style={{ padding: "9px 12px 9px 0" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: `${TYPE_COLORS[ev.type] || S.muted}22`,
                    color: TYPE_COLORS[ev.type] || S.muted,
                    border: `1px solid ${TYPE_COLORS[ev.type] || S.muted}44`,
                  }}>
                    {TYPE_LABELS[ev.type] || ev.type}
                  </span>
                </td>
                <td style={{ padding: "9px 12px 9px 0", color: S.muted }}>
                  {ev.lang ? (LANG_LABELS[ev.lang] || ev.lang) : "—"}
                </td>
                <td style={{ padding: "9px 12px 9px 0", color: S.muted, fontFamily: "monospace" }}>
                  {ev.durationMs > 0 ? `${(ev.durationMs / 1000).toFixed(1)}s` : "—"}
                </td>
                <td style={{ padding: "9px 12px 9px 0" }}>
                  {ev.isError
                    ? <span style={{ color: S.error, fontWeight: 600 }}>✕ Error</span>
                    : <span style={{ color: S.success }}>✓ OK</span>}
                </td>
                <td style={{ padding: "9px 0", color: S.muted, whiteSpace: "nowrap" }}>
                  {timeAgo(ev.ts)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
function Dashboard({ adminKey, onLogout }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error("Failed to fetch stats");
      setStats(await res.json());
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [adminKey, onLogout]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = stats?.daily?.[today] || 0;
  const errorRate = stats?.totalRequests > 0
    ? `${Math.round((stats.errors / stats.totalRequests) * 100)}%` : "0%";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: S.card, borderBottom: `1px solid ${S.border}`,
        padding: "0 32px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, maxWidth: 1200, margin: "0 auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎓</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>StudyMaster</span>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "2px 8px", borderRadius: 5,
              background: `${S.accent}22`, color: S.accent, border: `1px solid ${S.accent}44`,
            }}>Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {lastUpdated && (
              <span style={{ fontSize: 12, color: S.muted }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {stats?.persisted === false && (
              <span style={{
                fontSize: 11, color: "#f59e0b", padding: "2px 8px",
                background: "#f59e0b22", borderRadius: 4, border: "1px solid #f59e0b44",
              }}>
                ⚠ In-memory only
              </span>
            )}
            <button
              onClick={() => fetchStats()}
              disabled={refreshing}
              style={{
                padding: "7px 16px", background: S.bg, border: `1px solid ${S.border}`,
                borderRadius: 8, color: S.text, cursor: refreshing ? "not-allowed" : "pointer",
                fontSize: 13, opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? (
                <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>↻</span>
              ) : "↻ Refresh"}
            </button>
            <button onClick={onLogout} style={{
              padding: "7px 16px", background: "transparent",
              border: `1px solid ${S.border}`, borderRadius: 8,
              color: S.muted, cursor: "pointer", fontSize: 13,
            }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        {error && (
          <div style={{
            padding: "12px 16px", background: `${S.error}18`, border: `1px solid ${S.error}44`,
            borderRadius: 8, color: S.error, marginBottom: 24, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!stats && !error && (
          <div style={{ textAlign: "center", padding: "80px 0", color: S.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>↻</div>
            <div>Loading stats…</div>
          </div>
        )}

        {stats && (
          <>
            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} icon="📊" color={S.accent} sub="all time" />
              <StatCard label="Today" value={todayCount.toLocaleString()} icon="📅" color="#10b981" sub={today} />
              <StatCard label="Errors" value={stats.errors} icon="⚠️" color={stats.errors > 0 ? S.error : "#10b981"} sub={`${errorRate} error rate`} />
              <StatCard label="Uptime" value={formatUptime(stats.uptimeSeconds)} icon="⏱️" color="#f59e0b" sub={`since ${new Date(stats.startedAt).toLocaleDateString()}`} />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <TypeChart byType={stats.byType} />
              <LangChart byLang={stats.byLang} />
            </div>

            {/* Daily chart */}
            <div style={{ marginBottom: 24 }}>
              <DailyChart daily={stats.daily} />
            </div>

            {/* Recent activity */}
            <RecentActivity events={stats.recentActivity} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────
export default function AdminApp() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("adminKey") || null);

  const handleLogin = (key) => setAdminKey(key);
  const handleLogout = () => { sessionStorage.removeItem("adminKey"); setAdminKey(null); };

  return (
    <>
      <style>{css}</style>
      {adminKey
        ? <Dashboard adminKey={adminKey} onLogout={handleLogout} />
        : <LoginScreen onLogin={handleLogin} />
      }
    </>
  );
}

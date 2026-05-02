import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

const freshStats = () => ({
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  errors: 0,
  byType: {},
  byLang: {},
  daily: {},       // "YYYY-MM-DD" → count
  recentActivity: [], // last 100 events
});

let stats = freshStats();
let canPersist = true;

// Load existing stats from disk
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(STATS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    stats = { ...freshStats(), ...saved, startedAt: new Date().toISOString() };
  }
} catch {
  canPersist = false;
}

let saveTimer = null;
function scheduleSave() {
  if (!canPersist || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch { canPersist = false; }
  }, 2000);
}

export function recordRequest(type, lang, durationMs = 0, isError = false) {
  stats.totalRequests++;
  if (isError) stats.errors++;

  stats.byType[type] = (stats.byType[type] || 0) + 1;
  if (lang && lang !== 'auto') stats.byLang[lang] = (stats.byLang[lang] || 0) + 1;

  const today = new Date().toISOString().slice(0, 10);
  stats.daily[today] = (stats.daily[today] || 0) + 1;

  stats.recentActivity.unshift({ type, lang: lang || null, durationMs, isError, ts: Date.now() });
  if (stats.recentActivity.length > 100) stats.recentActivity.length = 100;

  scheduleSave();
}

export function getStats() {
  return {
    ...stats,
    uptimeSeconds: Math.floor((Date.now() - new Date(stats.startedAt)) / 1000),
    persisted: canPersist,
  };
}

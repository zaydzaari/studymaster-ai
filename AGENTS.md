# AGENTS.md

## Project architecture

- **Dual-package repo, NOT an npm workspace.** `backend/` and `frontend/` have independent `package.json` and `node_modules/`. The root `package.json` is a placeholder. All `npm` commands must run inside the correct subdirectory.
- **Pure JavaScript/JSX** — no TypeScript. No build step for the backend; it runs directly via `node server.js`.
- **No tests, no lint, no typecheck.** There is no ESLint, Prettier, Jest, Vitest, or CI workflow configured.

## Commands

```bash
# Backend (port 5000)
cd backend
cp .env.example .env          # then edit .env with your GEMINI_API_KEY
npm install
npm start                      # production
npm run dev                    # development (node --watch, auto-restart)

# Frontend (port 5173)
cd frontend
npm install
npm run dev                    # Vite dev server, proxies /api → localhost:5000
npm run build                  # production build → frontend/dist/
```

Both must run simultaneously in development (two terminals). Order doesn't matter, but the backend must be running before the frontend can proxy API calls.

## Environment variables

Backend `.env` (required):

```
GEMINI_API_KEY=your_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Vercel deploy: also set `VITE_API_URL` in frontend env to the Render/Railway backend URL.

## AI SDK (Gemini)

- **Primary SDK:** `@google/genai` (`GoogleGenAI`). The older `@google/generative-ai` is installed but not used in current code.
- **Automatic model fallback** built into `backend/utils/gemini.js`: `gemini-3-flash-preview` → `gemini-2.5-flash`. Both `streamContent()` and `generateContent()` try the primary model first, then fall back silently on error.
- **Voice** uses `gemini-3.1-flash-live-preview`. **TTS** uses `gemini-2.5-flash-preview-tts`. These are separate model constants in the voice/tts route files, not in `gemini.js`.
- **`openai` and `@openrouter/sdk`** are installed in backend deps but not currently wired into any route. Don't remove them unless you've verified they're unused by planned features.

## Vercel serverless mode

When `process.env.VERCEL` is set, `server.js` **does not start an HTTP listener** — it only exports the Express `app`. The Vercel passthrough is `api/[...path].js` which re-exports `backend/server.js`.  
**The WebSocket voice feature (`/api/voice`) does not work on Vercel** — it requires `http.createServer` + `ws` upgrade handling, which only runs in standalone mode.

## Frontend quirks

- **Tailwind CSS 4 via Vite plugin** (`@tailwindcss/vite`) — NOT PostCSS-based. No `tailwind.config.js` or `postcss.config.js` needed.
- **i18n init must happen before `<App />` renders.** `frontend/src/main.jsx` imports `./i18n/i18n.js` and then renders `<App />`. If you change the import order, i18n will break.
- **Vite proxies `/api`** to `localhost:5000` in dev (see `vite.config.js`). In production, the frontend uses `VITE_API_URL` to reach the backend directly.

## Key files by concern

| Concern | File |
|---|---|
| Server entry + Vercel split | `backend/server.js` |
| Gemini client (stream + non-stream) | `backend/utils/gemini.js` |
| Summarization (text/PDF/URL/image/merge) | `backend/routes/summarize.js` |
| SSE streaming chat | `backend/routes/chat.js` |
| WebSocket voice tutor | `backend/routes/voice.js` |
| Rate limiting config | `backend/middleware/rateLimit.js` |
| File upload config (PDF/image/multi) | `backend/middleware/upload.js` |
| Master prompt templates | `backend/utils/gemini.js` (`buildMasterPrompt`, `buildMultimodalPrompt`, `buildDeepDivePrompt`, `buildVoiceTutorPrompt`) |
| App component (tabs, state, keyboard shortcuts) | `frontend/src/App.jsx` |
| API client (fetch wrappers) | `frontend/src/utils/api.js` |
| i18n translations | `frontend/src/i18n/en.json`, `fr.json`, `ar.json` |
| Vite config + dev proxy | `frontend/vite.config.js` |

## Rate limiting

- Summarize endpoints: 10 requests per 15 minutes per IP
- Chat endpoints: 50 requests per 15 minutes per IP
- Health endpoint: unlimited

## Upload limits (Multer)

- PDF: 5 MB, `.pdf` only
- Image: 10 MB, image mime types only
- Multi-file merge: 50 MB combined

## Gemini response format

All summarization and deep-dive prompts instruct Gemini to return **raw JSON only (no markdown, no code blocks)**. The routes attempt `JSON.parse()` after stripping potential ` ```json ` wrappers. If you modify a prompt, ensure it still demands raw JSON — the frontend expects structured `meta`, `summary`, `keyPoints`, `flashcards`, `quiz`, and `mindmap` fields.

## Deployment configs

- `vercel.json` — builds frontend, installs backend deps, rewrites `/api/*` to the serverless function
- `render.yaml` — backend-only Node.js web service, free tier, `GEMINI_API_KEY` set manually
- `railway.json` — backend-only, uses Nixpacks builder

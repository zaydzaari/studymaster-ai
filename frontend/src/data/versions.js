export const CURRENT_VERSION = "1.2.1";

export const VERSIONS = [
  {
    version: "1.2.1",
    date: "2026-04-30",
    label: "Latest",
    changes: [
      "Upgraded primary AI to Gemini 3 Flash — latest model from Google AI",
      "Fallback on rate limit now uses Gemma 4 31B — always stays responsive",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-30",
    label: null,
    changes: [
      "Switched AI engine to Gemini 2.0 Flash for faster, smarter responses",
      "Auto-fallback to Gemini 1.5 Flash when rate limited — no interruptions",
      "Added AI Voice Tutor (speak with an AI that knows your material)",
      "Deployed to Vercel with GitHub auto-deploy on every push",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-29",
    label: null,
    changes: [
      "Full Vercel deployment with backend serverless functions",
      "GitHub CI/CD — every push to master auto-deploys",
      "WebSocket proxy for real-time voice support",
      "Vite proxy updated to support WebSocket connections",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-28",
    label: "Initial Release",
    changes: [
      "AI-powered text summarization with key points and learning objectives",
      "Auto-generated flashcards and interactive quiz",
      "Deep-dive concept explanation panel",
      "PDF upload and URL scraping support",
      "Multi-language support (English, French, Arabic)",
      "Dark mode, streaks, history, and Pomodoro timer",
    ],
  },
];

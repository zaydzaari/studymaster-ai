export const CURRENT_VERSION = "1.2.0";

export const VERSIONS = [
  {
    version: "1.2.0",
    date: "2026-04-30",
    label: "Latest",
    changes: [
      "Switched AI engine to Gemini 3 Flash Live for faster, smarter responses",
      "Auto-fallback to Gemma 4 32B when rate limited — no interruptions",
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

# StudyMaster AI — Quick Start

## 1. Get your free Gemini API key
Go to: https://aistudio.google.com/app/apikey → "Create API key"

## 2. Set up the backend
```bash
cd backend
cp .env.example .env
# Edit .env and paste your Gemini API key
npm start
```

## 3. Start the frontend (new terminal)
```bash
cd frontend
npm run dev
```

## 4. Open
http://localhost:5173

## Deploy to Vercel + Render
See section 12 of STUDYMASTER_FINAL.md

## Environment variables needed
Backend `.env`:
```
GEMINI_API_KEY=your_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Vercel (frontend):
```
VITE_API_URL=https://your-backend.render.com
```

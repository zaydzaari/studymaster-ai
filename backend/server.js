import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import healthRouter from './routes/health.js';
import summarizeRouter from './routes/summarize.js';
import deepdiveRouter from './routes/deepdive.js';
import ttsRouter from './routes/tts.js';
import chatRouter from './routes/chat.js';
import flashcardsMoreRouter from './routes/flashcardsMore.js';
import quizMoreRouter from './routes/quizMore.js';
import adminRouter from './routes/admin.js';
import { setupVoiceWebSocket } from './routes/voice.js';
import { recordRequest } from './utils/statsStore.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.VERCEL ? true : 'http://localhost:5173'),
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Stats tracking middleware ────────────────────────────────────
const TRACKED = {
  '/api/summarize/text':    'text',
  '/api/summarize/pdf':     'pdf',
  '/api/summarize/url':     'url',
  '/api/summarize/image':   'image',
  '/api/summarize/merge':   'merge',
  '/api/deepdive':          'deepdive',
  '/api/chat':              'chat',
  '/api/flashcards/more':   'flashcards_more',
  '/api/quiz/more':         'quiz_more',
};
app.use((req, res, next) => {
  const type = TRACKED[req.path];
  if (!type || req.method !== 'POST') return next();
  const start = Date.now();
  res.on('finish', () => {
    const lang = req.body?.language || null;
    recordRequest(type, lang, Date.now() - start, res.statusCode >= 500);
  });
  next();
});

app.use('/api/health', healthRouter);
app.use('/api/summarize', summarizeRouter);
app.use('/api/deepdive', deepdiveRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/flashcards/more', flashcardsMoreRouter);
app.use('/api/quiz/more', quizMoreRouter);
app.use('/api/admin', adminRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

if (!process.env.VERCEL) {
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  setupVoiceWebSocket(wss);

  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url === '/api/voice') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`StudyMaster backend running on http://localhost:${PORT}`);
  });
}

export default app;

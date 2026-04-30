import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import healthRouter from './routes/health.js';
import summarizeRouter from './routes/summarize.js';
import deepdiveRouter from './routes/deepdive.js';
import { setupVoiceWebSocket } from './routes/voice.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.VERCEL ? true : 'http://localhost:5173'),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRouter);
app.use('/api/summarize', summarizeRouter);
app.use('/api/deepdive', deepdiveRouter);

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

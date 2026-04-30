import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildVoiceTutorPrompt } from '../utils/gemini.js';
import { deepDiveLimiter } from '../middleware/rateLimit.js';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3-flash-preview';

function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.flushHeaders();
}

router.post('/', deepDiveLimiter, async (req, res) => {
  const { messages, context } = req.body;
  if (!messages?.length) {
    return res.status(400).json({ error: 'Messages required.' });
  }

  try {
    sseHeaders(res);

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction: { parts: [{ text: buildVoiceTutorPrompt(context) }] },
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) return res.status(500).json({ error: 'Chat failed.' });
    res.write(`data: ${JSON.stringify({ error: 'Chat error.' })}\n\n`);
    res.end();
  }
});

export default router;

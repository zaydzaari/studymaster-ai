import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { deepDiveLimiter } from '../middleware/rateLimit.js';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const VOICES = { en: 'Aoede', fr: 'Aoede', ar: 'Aoede' };

router.post('/', deepDiveLimiter, async (req, res) => {
  const { text, lang = 'en' } = req.body;
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  try {
    const result = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ role: 'user', parts: [{ text: text.slice(0, 3000) }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES[lang] || 'Aoede' } },
        },
      },
    });

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const audioPart = parts.find(p => p.inlineData?.mimeType?.startsWith('audio/'));

    if (!audioPart) {
      return res.status(500).json({ error: 'No audio returned from TTS model.' });
    }

    res.json({ audio: audioPart.inlineData.data, mimeType: audioPart.inlineData.mimeType });
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: 'TTS generation failed.' });
  }
});

export default router;

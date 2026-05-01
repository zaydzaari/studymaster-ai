import express from 'express';
import { buildMoreFlashcardsPrompt, generateContent } from '../utils/gemini.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { summary, keyPoints, concepts, subject, language, existingFronts } = req.body;
    if (!summary) return res.status(400).json({ error: 'summary is required' });

    const prompt = buildMoreFlashcardsPrompt({
      summary,
      keyPoints: keyPoints || [],
      concepts: concepts || [],
      subject: subject || 'General',
      language: language || 'en',
      existingFronts: existingFronts || [],
    });

    const debug = {};
    const raw = await generateContent(prompt, debug);
    const cleaned = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const data = JSON.parse(cleaned);

    if (!Array.isArray(data.flashcards)) {
      return res.status(500).json({ error: 'Invalid AI response format' });
    }

    res.json({ flashcards: data.flashcards });
  } catch (err) {
    console.error('flashcards/more error:', err);
    res.status(500).json({ error: 'Failed to generate more flashcards. Please try again.' });
  }
});

export default router;

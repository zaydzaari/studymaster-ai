import express from 'express';
import { buildMoreQuizPrompt, generateContent } from '../utils/gemini.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { summary, keyPoints, concepts, subject, language, existingQuestions } = req.body;
    if (!summary) return res.status(400).json({ error: 'summary is required' });

    const prompt = buildMoreQuizPrompt({
      summary,
      keyPoints: keyPoints || [],
      concepts: concepts || [],
      subject: subject || 'General',
      language: language || 'en',
      existingQuestions: existingQuestions || [],
    });

    const debug = {};
    const raw = await generateContent(prompt, debug);
    const cleaned = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const data = JSON.parse(cleaned);

    if (!Array.isArray(data.quiz)) {
      return res.status(500).json({ error: 'Invalid AI response format' });
    }

    res.json({ quiz: data.quiz });
  } catch (err) {
    console.error('quiz/more error:', err);
    res.status(500).json({ error: 'Failed to generate more quiz questions. Please try again.' });
  }
});

export default router;

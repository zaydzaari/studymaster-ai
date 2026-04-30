import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const MODEL = 'gemini-3-flash-live';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, maxAttempts = 3) {
  const delays = [3000, 6000, 10000];
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.status === 429 || String(err?.message).includes('429');
      if (!is429 || i === maxAttempts - 1) throw err;
      console.log(`Rate limited — retrying in ${delays[i] / 1000}s (attempt ${i + 1}/${maxAttempts})`);
      await sleep(delays[i]);
    }
  }
}

export async function* streamContent(prompt) {
  const stream = await withRetry(() =>
    ai.models.generateContentStream({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
  );
  for await (const chunk of stream) {
    const text = chunk.text || '';
    if (text) yield text;
  }
}

export async function generateContent(prompt) {
  const result = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
  );
  return result.text || '';
}

export function buildMasterPrompt(content, outputLanguage = 'same as input') {
  return `You are StudyMaster AI — an expert educational content analyzer.

Analyze the content below and generate a complete study package.

OUTPUT LANGUAGE: ${outputLanguage}

CONTENT:
"""
${content.slice(0, 50000)}
"""

Return EXACTLY this JSON. No markdown. No code blocks. Valid JSON only:

{
  "meta": {
    "title": "Short descriptive title (max 8 words)",
    "difficulty": "beginner",
    "readingTime": 3,
    "summaryReadingTime": 0.5,
    "subject": "Technology",
    "language": "en"
  },
  "summary": "2-3 paragraph summary. Clear. Simple. Covers main ideas and conclusions.",
  "keyPoints": [
    "First key concept — specific and informative",
    "Second key concept",
    "Third key concept",
    "Fourth key concept",
    "Fifth key concept"
  ],
  "learningObjectives": [
    "Understand the fundamentals of the topic",
    "Learn how the core concepts work in practice",
    "Master the relationship between key ideas"
  ],
  "concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "keyQuote": "The single most important sentence from the content",
  "studyQuestions": [
    { "question": "Simple recall question?", "difficulty": "easy" },
    { "question": "Understanding question?", "difficulty": "medium" },
    { "question": "Application question?", "difficulty": "hard" },
    { "question": "Another easy question?", "difficulty": "easy" },
    { "question": "Analysis question?", "difficulty": "medium" }
  ],
  "flashcards": [
    { "front": "Term or question", "back": "Definition or answer" },
    { "front": "Term or question", "back": "Definition or answer" },
    { "front": "Term or question", "back": "Definition or answer" },
    { "front": "Term or question", "back": "Definition or answer" },
    { "front": "Term or question", "back": "Definition or answer" },
    { "front": "Term or question", "back": "Definition or answer" }
  ],
  "quiz": [
    {
      "question": "Question about a core concept?",
      "options": ["Correct answer", "Wrong answer", "Wrong answer", "Wrong answer"],
      "correctAnswer": 0,
      "explanation": "Why this is correct and why others are wrong."
    },
    {
      "question": "Second question?",
      "options": ["Wrong", "Wrong", "Correct", "Wrong"],
      "correctAnswer": 2,
      "explanation": "Explanation."
    },
    {
      "question": "Third question?",
      "options": ["Wrong", "Correct", "Wrong", "Wrong"],
      "correctAnswer": 1,
      "explanation": "Explanation."
    },
    {
      "question": "Fourth question?",
      "options": ["Wrong", "Wrong", "Wrong", "Correct"],
      "correctAnswer": 3,
      "explanation": "Explanation."
    },
    {
      "question": "Fifth question?",
      "options": ["Correct", "Wrong", "Wrong", "Wrong"],
      "correctAnswer": 0,
      "explanation": "Explanation."
    }
  ]
}`;
}

export function buildDeepDivePrompt(concept, subject) {
  return `Explain the concept "${concept}" in simple terms for a student studying ${subject}.

Return only this JSON (no markdown, no code blocks):
{
  "definition": "Simple 2-sentence definition",
  "example": "One concrete real-world example",
  "importance": "Why this concept matters in this subject (1 sentence)"
}`;
}

export function buildVoiceTutorPrompt(studyData) {
  if (!studyData) return 'You are a helpful study tutor.';
  const {
    title = '', subject = '', difficulty = '',
    summary = '', keyPoints = [], learningObjectives = [],
  } = studyData;

  return `You are an AI study tutor for StudyMaster AI.
You are helping a student understand their course material.

The student is currently studying this content:

TITLE: ${title}
SUBJECT: ${subject}
DIFFICULTY: ${difficulty}

SUMMARY OF THE CONTENT:
${summary}

KEY POINTS:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

LEARNING OBJECTIVES:
${learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Your personality and behavior:
- You are warm, patient, and encouraging like a great teacher
- You give clear, simple explanations with real examples
- You keep each response short — maximum 30 to 45 seconds of speaking
- You stay focused on this specific course content
- If asked something unrelated, gently redirect back to the course material
- You automatically match the language the student uses — Arabic, French, or English
- You speak naturally in full sentences, never using bullet points or lists
- You never use markdown formatting — only natural spoken language
- You celebrate when the student understands something correctly`;
}

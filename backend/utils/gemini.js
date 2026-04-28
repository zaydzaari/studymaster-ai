import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const MODEL = "google/gemma-4-31b-it:free";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, maxAttempts = 3) {
  const delays = [3000, 6000, 10000];
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.status === 429 || String(err?.message).includes("429");
      if (!is429 || i === maxAttempts - 1) throw err;
      console.log(`Rate limited — retrying in ${delays[i] / 1000}s (attempt ${i + 1}/${maxAttempts})`);
      await sleep(delays[i]);
    }
  }
}

export async function streamContent(prompt) {
  return withRetry(() =>
    openrouter.chat.send({
      chatRequest: {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      },
    })
  );
}

export async function generateContent(prompt) {
  const resp = await withRetry(() =>
    openrouter.chat.send({
      chatRequest: {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      },
    })
  );
  return resp.choices[0]?.message?.content || "";
}

export function buildMasterPrompt(content, outputLanguage = "same as input") {
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

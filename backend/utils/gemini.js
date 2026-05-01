import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_PRIMARY  = 'gemini-3-flash-preview';
const MODEL_FALLBACK = 'gemini-2.5-flash';
export const MODEL   = MODEL_PRIMARY;

// Accept a string prompt or an array of parts (for multimodal requests)
function buildContents(promptOrParts) {
  if (typeof promptOrParts === 'string') {
    return [{ role: 'user', parts: [{ text: promptOrParts }] }];
  }
  return [{ role: 'user', parts: promptOrParts }];
}

export async function* streamContent(promptOrParts, debug = {}) {
  debug.primaryModel  = MODEL_PRIMARY;
  debug.fallbackModel = MODEL_FALLBACK;
  debug.modelUsed     = MODEL_PRIMARY;
  debug.fallback      = false;
  debug.primaryError  = null;
  debug.chunks        = 0;
  debug.ttft          = null;
  debug.startTime     = Date.now();

  const contents = buildContents(promptOrParts);

  for (const model of [MODEL_PRIMARY, MODEL_FALLBACK]) {
    try {
      debug.modelUsed = model;
      if (model === MODEL_FALLBACK) debug.fallback = true;

      const stream = await ai.models.generateContentStream({ model, contents });

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          if (debug.ttft === null) debug.ttft = Date.now() - debug.startTime;
          debug.chunks++;
          yield text;
        }
      }

      debug.duration = Date.now() - debug.startTime;
      return;
    } catch (err) {
      if (model === MODEL_PRIMARY) {
        debug.primaryError = `${err?.status ?? 'error'} — ${String(err?.message).slice(0, 100)}`;
        console.log(`${MODEL_PRIMARY} failed (${err?.status ?? err?.message?.slice(0, 60)}) — switching to ${MODEL_FALLBACK}`);
        continue;
      }
      throw err;
    }
  }
}

export async function generateContent(promptOrParts, debug = {}) {
  debug.primaryModel  = MODEL_PRIMARY;
  debug.fallbackModel = MODEL_FALLBACK;
  debug.modelUsed     = MODEL_PRIMARY;
  debug.fallback      = false;
  debug.primaryError  = null;
  debug.startTime     = Date.now();

  const contents = buildContents(promptOrParts);

  for (const model of [MODEL_PRIMARY, MODEL_FALLBACK]) {
    try {
      debug.modelUsed = model;
      if (model === MODEL_FALLBACK) debug.fallback = true;

      const result = await ai.models.generateContent({ model, contents });
      debug.duration = Date.now() - debug.startTime;
      return result.text || '';
    } catch (err) {
      if (model === MODEL_PRIMARY) {
        debug.primaryError = `${err?.status ?? 'error'} — ${String(err?.message).slice(0, 100)}`;
        console.log(`${MODEL_PRIMARY} failed (${err?.status ?? err?.message?.slice(0, 60)}) — switching to ${MODEL_FALLBACK}`);
        continue;
      }
      throw err;
    }
  }
  return '';
}

const MINDMAP_SCHEMA = `,
  "mindmap": {
    "center": "Central Topic (max 4 words)",
    "branches": [
      { "label": "Branch A (max 4 words)", "children": ["Sub-topic 1", "Sub-topic 2", "Sub-topic 3"] },
      { "label": "Branch B (max 4 words)", "children": ["Sub-topic 4", "Sub-topic 5", "Sub-topic 6"] },
      { "label": "Branch C (max 4 words)", "children": ["Sub-topic 7", "Sub-topic 8"] },
      { "label": "Branch D (max 4 words)", "children": ["Sub-topic 9", "Sub-topic 10"] },
      { "label": "Branch E (max 4 words)", "children": ["Sub-topic 11", "Sub-topic 12"] }
    ]
  }
}

MIND MAP RULES: Generate 3-5 branches, 2-4 children each. Children are plain strings (not objects). All labels max 4 words. All labels in OUTPUT LANGUAGE.`;

export function buildMasterPrompt(content, outputLanguage = 'same as input') {
  return `You are an expert university professor building a complete, high-quality study package.

Your philosophy: students learn by understanding WHY things work, not just what they are.
Write at the level of a motivated university student. Every explanation must build genuine understanding.

OUTPUT LANGUAGE: ${outputLanguage}

CONTENT:
"""
${content.slice(0, 50000)}
"""

Return EXACTLY this JSON. No markdown. No code blocks. Valid JSON only:

{
  "meta": {
    "title": "Descriptive title capturing the core idea (max 8 words)",
    "difficulty": "beginner|intermediate|advanced",
    "readingTime": 5,
    "summaryReadingTime": 2,
    "subject": "Precise subject area (e.g. Neuroscience, Constitutional Law, Thermodynamics)",
    "language": "en"
  },
  "summary": "Write 3-4 rich paragraphs totaling 300+ words. Paragraph 1: introduce the core idea and its significance — WHY does this topic matter? Paragraph 2: explain the main mechanisms, how key concepts interrelate, and the underlying logic. Paragraph 3: examine real-world implications, applications, or consequences. Paragraph 4 (optional): connect to broader context or synthesize the key insight. Use precise vocabulary but define terms as you introduce them. Do NOT use bullet points — only flowing prose.",
  "keyPoints": [
    "Non-obvious insight that explains WHY or HOW — not just a restatement of a fact",
    "A key mechanism explained in one compelling sentence",
    "A surprising consequence or implication of the main idea",
    "A common misconception corrected with the real explanation",
    "The single most important principle a student must internalize",
    "How two core concepts connect in a way that isn't immediately obvious"
  ],
  "learningObjectives": [
    "Analyze [specific concept] and explain why it produces [specific outcome]",
    "Distinguish between [A] and [B] and identify the conditions where each applies",
    "Apply [core principle] to evaluate [type of real-world scenario]"
  ],
  "concepts": ["5-8 key technical terms from the content"],
  "keyQuote": "The single most important, memorable sentence from the content itself",
  "studyQuestions": [
    { "question": "Direct recall question about a key definition?", "difficulty": "easy" },
    { "question": "Question requiring the student to explain a mechanism in their own words?", "difficulty": "medium" },
    { "question": "Question asking the student to apply a concept to a new scenario?", "difficulty": "hard" },
    { "question": "Another recall question about a second key term?", "difficulty": "easy" },
    { "question": "Question connecting two concepts from the content?", "difficulty": "medium" }
  ],
  "flashcards": [
    { "front": "Why does [mechanism] produce [result]?", "back": "Because [underlying cause]. This works through [specific mechanism]. In practice, this means [real consequence]." },
    { "front": "How does [process] differ from [related process]?", "back": "[Process A] works by [explanation]. [Process B] instead [explanation]. The key distinction is [core difference]." },
    { "front": "What is [key concept] and why does it matter?", "back": "[Precise definition in one sentence]. It matters because [implication or consequence]. Without it, [what would fail or change]." },
    { "front": "When should you use [approach] instead of [alternative]?", "back": "Use [approach] when [condition]. The reason is [explanation of why it fits better]. [Alternative] is better when [different condition]." },
    { "front": "What causes [common problem or failure mode]?", "back": "[Problem] occurs when [underlying cause]. The mechanism is [explanation]. To prevent it, [specific remedy or insight]." },
    { "front": "How does [core concept] relate to [another concept]?", "back": "[Concept A] enables [Concept B] by [mechanism]. They interact through [explanation]. Understanding this connection explains why [insight]." }
  ],
  "quiz": [
    {
      "question": "Question testing genuine understanding — not surface recall?",
      "options": [
        "Correct answer with precise, accurate wording",
        "Plausible distractor: a student who partially understands might choose this",
        "Plausible distractor: confuses a closely related concept",
        "Plausible distractor: represents the most common misconception"
      ],
      "correctAnswer": 0,
      "explanation": "The correct answer is [answer] because [deep explanation]. Option B is tempting but wrong because [distinction]. The key insight is [principle]."
    },
    {
      "question": "Second question — tests a different concept?",
      "options": ["Wrong but plausible", "Wrong but plausible", "Correct", "Wrong but plausible"],
      "correctAnswer": 2,
      "explanation": "Explanation connecting the concept to the underlying principle."
    },
    {
      "question": "Third question — requires applying knowledge to a scenario?",
      "options": ["Wrong but plausible", "Correct", "Wrong but plausible", "Wrong but plausible"],
      "correctAnswer": 1,
      "explanation": "Explanation of why this is the right choice in this context."
    },
    {
      "question": "Fourth question — tests a subtle but important distinction?",
      "options": ["Wrong but plausible", "Wrong but plausible", "Wrong but plausible", "Correct"],
      "correctAnswer": 3,
      "explanation": "Explanation of the distinction and why it matters."
    },
    {
      "question": "Fifth question — synthesizes multiple concepts?",
      "options": ["Correct", "Wrong but plausible", "Wrong but plausible", "Wrong but plausible"],
      "correctAnswer": 0,
      "explanation": "Explanation showing how multiple concepts connect to reach this answer."
    }
  ]${MINDMAP_SCHEMA}`;
}

// Prompt for multimodal inputs (PDF, image) — content is passed as inline data, not in the text
export function buildMultimodalPrompt(outputLanguage = 'same as input') {
  return `You are an expert university professor building a complete, high-quality study package.

Your philosophy: students learn by understanding WHY things work, not just what they are.
Analyze the provided document, image, or handwritten notes carefully.

OUTPUT LANGUAGE: ${outputLanguage}

Return EXACTLY this JSON. No markdown. No code blocks. Valid JSON only:

{
  "meta": {
    "title": "Descriptive title capturing the core idea (max 8 words)",
    "difficulty": "beginner|intermediate|advanced",
    "readingTime": 5,
    "summaryReadingTime": 2,
    "subject": "Precise subject area",
    "language": "en"
  },
  "summary": "Write 3-4 rich paragraphs totaling 300+ words. Paragraph 1: introduce the core idea and WHY this topic matters. Paragraph 2: explain the main mechanisms and how key concepts interrelate. Paragraph 3: examine real-world implications and applications. Paragraph 4: synthesize the key insight or connect to broader context. Flowing prose only — no bullet points.",
  "keyPoints": [
    "Non-obvious insight explaining WHY or HOW — not a restatement of fact",
    "A key mechanism explained in one compelling sentence",
    "A surprising consequence or implication",
    "A common misconception corrected with the real explanation",
    "The single most important principle to internalize",
    "How two core concepts connect in a non-obvious way"
  ],
  "learningObjectives": [
    "Analyze [specific concept] and explain why it produces [specific outcome]",
    "Distinguish between [A] and [B] and identify when each applies",
    "Apply [core principle] to evaluate [type of real-world scenario]"
  ],
  "concepts": ["5-8 key technical terms"],
  "keyQuote": "The single most important, memorable sentence from the content",
  "studyQuestions": [
    { "question": "Direct recall question?", "difficulty": "easy" },
    { "question": "Question requiring explanation of a mechanism?", "difficulty": "medium" },
    { "question": "Application question with a new scenario?", "difficulty": "hard" },
    { "question": "Another recall question?", "difficulty": "easy" },
    { "question": "Question connecting two concepts?", "difficulty": "medium" }
  ],
  "flashcards": [
    { "front": "Why does [mechanism] produce [result]?", "back": "Because [cause]. This works through [mechanism]. In practice, [real consequence]." },
    { "front": "How does [process] differ from [related process]?", "back": "[A] works by [explanation]. [B] instead [explanation]. The key distinction is [difference]." },
    { "front": "What is [key concept] and why does it matter?", "back": "[Definition]. It matters because [implication]. Without it, [consequence]." },
    { "front": "When should you use [approach] instead of [alternative]?", "back": "Use [approach] when [condition]. The reason is [explanation]. [Alternative] is better when [condition]." },
    { "front": "What causes [common problem or failure mode]?", "back": "[Problem] occurs when [cause]. The mechanism is [explanation]. To prevent it, [remedy]." },
    { "front": "How does [concept A] relate to [concept B]?", "back": "[A] enables [B] by [mechanism]. They interact through [explanation]. This connection explains why [insight]." }
  ],
  "quiz": [
    {
      "question": "Question testing genuine understanding?",
      "options": ["Correct answer", "Plausible distractor — partial understanding", "Plausible distractor — related concept confusion", "Plausible distractor — common misconception"],
      "correctAnswer": 0,
      "explanation": "The correct answer is [answer] because [deep explanation]. The key insight is [principle]."
    },
    {
      "question": "Second question on a different concept?",
      "options": ["Wrong but plausible", "Wrong but plausible", "Correct", "Wrong but plausible"],
      "correctAnswer": 2,
      "explanation": "Explanation."
    },
    {
      "question": "Third question — application scenario?",
      "options": ["Wrong but plausible", "Correct", "Wrong but plausible", "Wrong but plausible"],
      "correctAnswer": 1,
      "explanation": "Explanation."
    },
    {
      "question": "Fourth question — subtle distinction?",
      "options": ["Wrong but plausible", "Wrong but plausible", "Wrong but plausible", "Correct"],
      "correctAnswer": 3,
      "explanation": "Explanation."
    },
    {
      "question": "Fifth question — synthesis?",
      "options": ["Correct", "Wrong but plausible", "Wrong but plausible", "Wrong but plausible"],
      "correctAnswer": 0,
      "explanation": "Explanation."
    }
  ]${MINDMAP_SCHEMA}`;
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
  if (!studyData) return 'You are a helpful, encouraging study tutor. Answer questions clearly and concisely in natural spoken language.';
  const {
    title = '', subject = '', difficulty = '',
    summary = '', keyPoints = [], learningObjectives = [], concepts = [],
  } = studyData;

  return `You are an expert university professor and personal tutor helping a student master their course material.

COURSE CONTEXT:
Title: ${title}
Subject: ${subject}
Difficulty: ${difficulty}

CONTENT SUMMARY:
${summary}

KEY CONCEPTS TO MASTER:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

LEARNING OBJECTIVES:
${learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

CORE VOCABULARY:
${concepts.join(', ')}

YOUR TEACHING APPROACH:
- You teach by first asking the student what they already understand, then building on that
- When explaining a concept, always start with WHY it matters before explaining HOW it works
- Use concrete, real-world examples and analogies to make abstract ideas tangible
- After explaining something, ask a follow-up question to check understanding
- If the student seems confused, try a completely different angle or analogy
- When the student gets something right, acknowledge it specifically: "Exactly — and the reason that works is..."
- If the student makes a mistake, don't just correct them — diagnose the misconception: "That's a common confusion. The reason people think X is... but actually..."

YOUR COMMUNICATION STYLE:
- Keep each response to 30-45 seconds of speaking (about 80-120 words)
- Speak in natural, flowing sentences — never bullet points, never lists, never markdown
- Match the language the student uses (Arabic, French, English, or other)
- Be warm and encouraging without being condescending
- Stay focused on this specific course material — if asked something unrelated, gently redirect
- End responses with a brief check-in question when appropriate: "Does that make sense?" or "Can you tell me how you'd apply that?"`;
}

export function buildMoreFlashcardsPrompt({ summary, keyPoints, concepts, subject, language, existingFronts }) {
  return `You are a university professor creating additional flashcards for a student who has already studied this material.

Subject: ${subject}
Output language: ${language}

CONTENT SUMMARY:
${summary}

KEY POINTS:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

CONCEPTS: ${concepts.join(', ')}

EXISTING FLASHCARD FRONTS (do NOT duplicate these angles):
${existingFronts.map(f => `- ${f}`).join('\n')}

Generate 6 NEW flashcards covering different angles not yet covered.
Focus on WHY/HOW questions with 2-3 sentence answers.
Return ONLY this JSON (no markdown, no code blocks):
{
  "flashcards": [
    { "front": "Why does X produce Y?", "back": "Because [cause]. This works through [mechanism]. In practice, [consequence]." },
    { "front": "How does A differ from B?", "back": "[A explanation]. [B explanation]. The key distinction is [difference]." },
    { "front": "What is [concept] and why does it matter?", "back": "[Definition]. It matters because [implication]. Without it, [consequence]." },
    { "front": "When should you use X instead of Y?", "back": "Use X when [condition]. The reason is [explanation]. Y is better when [condition]." },
    { "front": "What causes [problem or edge case]?", "back": "[Problem] occurs when [cause]. The mechanism is [explanation]. To handle it, [approach]." },
    { "front": "How does [concept A] enable [concept B]?", "back": "[A] enables [B] by [mechanism]. They interact through [explanation]. This means [insight]." }
  ]
}`;
}

export function buildMoreQuizPrompt({ summary, keyPoints, concepts, subject, language, existingQuestions }) {
  return `You are a university professor creating additional quiz questions for a student who has already answered some questions.

Subject: ${subject}
Output language: ${language}

CONTENT SUMMARY:
${summary}

KEY POINTS:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

EXISTING QUESTIONS (do NOT duplicate these):
${existingQuestions.map(q => `- ${q.question}`).join('\n')}

Generate 5 NEW quiz questions covering untested angles.
Use plausible distractors that test genuine understanding (not obvious wrong answers).
Vary correctAnswer positions (0, 1, 2, or 3).
Return ONLY this JSON (no markdown, no code blocks):
{
  "quiz": [
    {
      "question": "Question testing genuine understanding?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct and what the key insight is."
    }
  ]
}`;
}

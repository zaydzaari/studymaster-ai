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
  return `You are an expert study assistant. Analyze the content and produce a complete study package as JSON.

OUTPUT LANGUAGE: ${outputLanguage}

CONTENT:
"""
${content.slice(0, 50000)}
"""

RULES — read all before writing:

SUMMARY: Write 3-4 paragraphs, minimum 300 words, flowing prose. Cover: (a) what this topic is and why it matters, (b) how the core mechanisms work and how key concepts interrelate, (c) real-world applications. No bullet points, no headers.

CONCEPT RELATIONS: Extract 6-10 meaningful relationships between concepts from the content. Each relation must be a real logical link — causal, hierarchical, sequential, or functional. Format: { "from": "Concept A", "relation": "verb phrase", "to": "Concept B" }. Example relations: "is a type of", "depends on", "enables", "prevents", "is measured by", "leads to", "is caused by", "contrasts with". These must come from the actual content, not be made up.

KEY POINTS: 6 concrete insights. Each must name a specific mechanism, consequence, or principle. No filler.

FLASHCARDS: 6 cards. Front = question starting with What/Why/How/When. Back = 2 complete sentences with real content.

QUIZ — CRITICAL RULES:
- Write 5 questions testing understanding, not memorization.
- For EACH question, decide the correct answer FIRST, then place it at a RANDOM position (0, 1, 2, or 3). Do NOT use a repeating pattern. The positions across 5 questions must vary — avoid always using 0 or always incrementing.
- ALL 4 options must use the same grammatical structure, similar length (within 20% of each other), and the same level of specificity. A student MUST read the content of each option to distinguish them — they cannot guess by appearance, length, or style.
- Wrong options must be things a real student who studied but made a mistake would choose — partial truths, confusions between related concepts, correct statements about the wrong context.
- explanation: 2 sentences. First: why the correct answer is right. Second: why the most tempting wrong option is wrong.

All text fields must be in the OUTPUT LANGUAGE.
Output valid JSON only — no markdown, no code fences, no commentary.

{
  "meta": {
    "title": "...",
    "difficulty": "beginner",
    "readingTime": 5,
    "summaryReadingTime": 2,
    "subject": "...",
    "language": "en"
  },
  "summary": "...",
  "conceptRelations": [
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." }
  ],
  "keyPoints": ["...", "...", "...", "...", "...", "..."],
  "learningObjectives": ["...", "...", "..."],
  "concepts": ["...", "...", "...", "...", "..."],
  "keyQuote": "...",
  "studyQuestions": [
    { "question": "...", "difficulty": "easy" },
    { "question": "...", "difficulty": "medium" },
    { "question": "...", "difficulty": "hard" },
    { "question": "...", "difficulty": "easy" },
    { "question": "...", "difficulty": "medium" }
  ],
  "flashcards": [
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." }
  ],
  "quiz": [
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 1, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 3, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 2, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 1, "explanation": "..." }
  ]${MINDMAP_SCHEMA}`;
}

// Prompt for multimodal inputs (PDF, image) — content is passed as inline data, not in the text
export function buildMultimodalPrompt(outputLanguage = 'same as input') {
  return `You are an expert study assistant. Analyze the provided document or image and produce a complete study package as JSON.

OUTPUT LANGUAGE: ${outputLanguage}

RULES — read all before writing:

SUMMARY: 3-4 paragraphs, minimum 300 words, flowing prose. Cover: (a) what this topic is and why it matters, (b) how the core mechanisms work and how concepts interrelate, (c) real-world applications. No bullet points, no headers.

CONCEPT RELATIONS: 6-10 real logical links between concepts found in the content. Each must be a genuine causal, hierarchical, sequential, or functional relationship. Format: { "from": "A", "relation": "verb phrase", "to": "B" }.

KEY POINTS: 6 concrete insights naming specific mechanisms, consequences, or principles. No filler.

FLASHCARDS: 6 cards. Front = question starting with What/Why/How/When. Back = 2 complete sentences with real content.

QUIZ — CRITICAL:
- 5 questions testing understanding.
- Place the correct answer at a RANDOM position for each question. Vary the correctAnswer indices — do NOT use a repeating pattern.
- All 4 options must use identical grammatical structure and similar length. Wrong options must be plausible — partial truths or concept confusions, not obviously wrong.
- explanation: 2 sentences (why correct is right, why the tempting wrong option fails).

All text in OUTPUT LANGUAGE. Valid JSON only — no markdown, no code fences.

{
  "meta": { "title": "...", "difficulty": "beginner", "readingTime": 5, "summaryReadingTime": 2, "subject": "...", "language": "en" },
  "summary": "...",
  "conceptRelations": [
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." },
    { "from": "...", "relation": "...", "to": "..." }
  ],
  "keyPoints": ["...", "...", "...", "...", "...", "..."],
  "learningObjectives": ["...", "...", "..."],
  "concepts": ["...", "...", "...", "...", "..."],
  "keyQuote": "...",
  "studyQuestions": [
    { "question": "...", "difficulty": "easy" },
    { "question": "...", "difficulty": "medium" },
    { "question": "...", "difficulty": "hard" },
    { "question": "...", "difficulty": "easy" },
    { "question": "...", "difficulty": "medium" }
  ],
  "flashcards": [
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." },
    { "front": "...", "back": "..." }
  ],
  "quiz": [
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 2, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 3, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 1, "explanation": "..." },
    { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 2, "explanation": "..." }
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

YOUR SCOPE:
- Answer freely about the course material AND anything related: the author, historical context, biography, related works, background events, literary movements, scientific principles, etc.
- If the student asks about the author (e.g. Victor Hugo, Einstein, etc.) — answer fully, it is directly relevant to understanding the text
- If the student asks about events, themes, or concepts mentioned in the material but not deeply explained — answer using your general knowledge
- Only gently redirect if the question is completely unrelated to learning (e.g. "write my essay for me")

YOUR COMMUNICATION STYLE:
- Keep each response to 30-45 seconds of speaking (about 80-120 words)
- Speak in natural, flowing sentences — never bullet points, never lists, never markdown
- Match the language the student uses (Arabic, French, English, or other)
- Be warm and encouraging without being condescending
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

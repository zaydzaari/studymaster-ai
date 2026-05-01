const BASE = import.meta.env.VITE_API_URL || "";

export async function deepDive(concept, subject) {
  const res = await fetch(`${BASE}/api/deepdive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept, subject }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    throw new Error(err.error || "Deep dive failed.");
  }
  return res.json();
}

export function getSummarizeTextUrl() {
  return `${BASE}/api/summarize/text`;
}
export function getSummarizePDFUrl() {
  return `${BASE}/api/summarize/pdf`;
}
export function getSummarizeURLUrl() {
  return `${BASE}/api/summarize/url`;
}
export function getSummarizeImageUrl() {
  return `${BASE}/api/summarize/image`;
}
export function getSummarizeMergeUrl() {
  return `${BASE}/api/summarize/merge`;
}
export function getFlashcardsMoreUrl() {
  return `${BASE}/api/flashcards/more`;
}
export function getQuizMoreUrl() {
  return `${BASE}/api/quiz/more`;
}

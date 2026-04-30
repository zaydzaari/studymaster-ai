import { Router } from "express";
import { generateContent, buildDeepDivePrompt } from "../utils/gemini.js";
import { deepDiveLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/", deepDiveLimiter, async (req, res) => {
  const { concept, subject = "general study" } = req.body;

  if (!concept || typeof concept !== "string") {
    return res.status(400).json({ error: "Concept is required." });
  }

  try {
    const debug = { inputType: 'deepdive', requestedAt: new Date().toISOString() };
    const prompt = buildDeepDivePrompt(concept.slice(0, 200), subject.slice(0, 100));
    const text = await generateContent(prompt, debug);
    const cleaned = text.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(cleaned);
    res.json({ ...parsed, __debug: debug });
  } catch (error) {
    console.error("Deep dive error:", error.message);
    res.status(500).json({ error: "Failed to get explanation. Please try again." });
  }
});

export default router;

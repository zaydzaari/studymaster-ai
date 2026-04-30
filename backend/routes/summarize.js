import { Router } from "express";
import { streamContent, buildMasterPrompt } from "../utils/gemini.js";
import { extractTextFromPDF } from "../utils/pdfExtract.js";
import { scrapeURL } from "../utils/urlScrape.js";
import { apiLimiter } from "../middleware/rateLimit.js";
import { upload } from "../middleware/upload.js";

const router = Router();

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.flushHeaders();
}

async function pipeStream(stream, res) {
  for await (const text of stream) {
    if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
}

// Text summarization (streaming SSE)
router.post("/text", apiLimiter, async (req, res) => {
  const { content, language } = req.body;

  if (!content || content.trim().length < 50) {
    return res.status(400).json({ error: "Content is too short. Please provide more text." });
  }

  try {
    sseHeaders(res);
    const prompt = buildMasterPrompt(content.slice(0, 50000), language || "same as input");
    const stream = await streamContent(prompt);
    await pipeStream(stream, res);
  } catch (error) {
    console.error("Summarize error:", error.message);
    if (!res.headersSent) {
      if (error.message?.includes("429")) {
        return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      }
      return res.status(500).json({ error: "Processing failed. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "Processing failed." })}\n\n`);
    res.end();
  }
});

// PDF summarization
router.post("/pdf", apiLimiter, upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }

  try {
    const text = await extractTextFromPDF(req.file.buffer);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract readable text from this PDF." });
    }

    sseHeaders(res);
    const { language } = req.body;
    const prompt = buildMasterPrompt(text, language || "same as input");
    const stream = await streamContent(prompt);
    await pipeStream(stream, res);
  } catch (error) {
    console.error("PDF error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to process PDF. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "PDF processing failed." })}\n\n`);
    res.end();
  }
});

// URL summarization
router.post("/url", apiLimiter, async (req, res) => {
  const { url, language } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required." });

  try {
    const text = await scrapeURL(url);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract readable content from this URL." });
    }

    sseHeaders(res);
    const prompt = buildMasterPrompt(text, language || "same as input");
    const stream = await streamContent(prompt);
    await pipeStream(stream, res);
  } catch (error) {
    console.error("URL error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to fetch URL content. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "URL processing failed." })}\n\n`);
    res.end();
  }
});

export default router;

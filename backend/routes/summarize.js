import { Router } from "express";
import axios from "axios";
import { streamContent, buildMasterPrompt, buildMultimodalPrompt } from "../utils/gemini.js";
import { apiLimiter } from "../middleware/rateLimit.js";
import { upload, uploadImage } from "../middleware/upload.js";

const router = Router();

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.flushHeaders();
}

async function pipeStream(stream, res, debug) {
  for await (const text of stream) {
    if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ __debug: debug })}\n\n`);
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
    const debug = { inputType: 'text', inputLength: content.length, requestedAt: new Date().toISOString() };
    const prompt = buildMasterPrompt(content.slice(0, 50000), language || "same as input");
    const stream = streamContent(prompt, debug);
    await pipeStream(stream, res, debug);
  } catch (error) {
    console.error("Summarize error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Processing failed. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "Processing failed." })}\n\n`);
    res.end();
  }
});

// PDF summarization — send raw PDF directly to Gemini (no text extraction)
router.post("/pdf", apiLimiter, upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded." });
  }

  try {
    sseHeaders(res);
    const { language } = req.body;
    const base64 = req.file.buffer.toString("base64");
    const parts = [
      { inlineData: { mimeType: "application/pdf", data: base64 } },
      { text: buildMultimodalPrompt(language || "same as input") },
    ];
    const debug = { inputType: 'pdf', inputLength: req.file.size, requestedAt: new Date().toISOString() };
    const stream = streamContent(parts, debug);
    await pipeStream(stream, res, debug);
  } catch (error) {
    console.error("PDF error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to process PDF. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "PDF processing failed." })}\n\n`);
    res.end();
  }
});

// URL summarization — fetch raw HTML and send to Gemini directly (no cheerio parsing)
router.post("/url", apiLimiter, async (req, res) => {
  const { url, language } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required." });

  try {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: { "User-Agent": "Mozilla/5.0 StudyMasterAI/2.0" },
      maxContentLength: 5 * 1024 * 1024, // 5MB raw HTML cap
    });

    const html = typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data);

    if (!html || html.trim().length < 50) {
      return res.status(400).json({ error: "Could not fetch content from this URL." });
    }

    sseHeaders(res);
    const debug = { inputType: 'url', inputLength: html.length, requestedAt: new Date().toISOString() };
    // Send raw HTML — Gemini reads and extracts what matters automatically
    const prompt = buildMasterPrompt(html, language || "same as input");
    const stream = streamContent(prompt, debug);
    await pipeStream(stream, res, debug);
  } catch (error) {
    console.error("URL error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to fetch URL content. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "URL processing failed." })}\n\n`);
    res.end();
  }
});

// Image summarization — send image directly to Gemini (photo, whiteboard, handwriting)
router.post("/image", apiLimiter, uploadImage.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded." });
  }

  try {
    sseHeaders(res);
    const { language } = req.body;
    const base64 = req.file.buffer.toString("base64");
    const parts = [
      { inlineData: { mimeType: req.file.mimetype, data: base64 } },
      { text: buildMultimodalPrompt(language || "same as input") },
    ];
    const debug = { inputType: 'image', inputLength: req.file.size, requestedAt: new Date().toISOString() };
    const stream = streamContent(parts, debug);
    await pipeStream(stream, res, debug);
  } catch (error) {
    console.error("Image error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to process image. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "Image processing failed." })}\n\n`);
    res.end();
  }
});

export default router;

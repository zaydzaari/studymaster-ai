export function validateContent(req, res, next) {
  const { content } = req.body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Content is required." });
  }
  if (content.trim().length < 50) {
    return res.status(400).json({ error: "Content is too short. Please provide more text." });
  }
  req.body.content = content.slice(0, 50000);
  next();
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import summarizeRouter from "./routes/summarize.js";
import deepdiveRouter from "./routes/deepdive.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRouter);
app.use("/api/summarize", summarizeRouter);
app.use("/api/deepdive", deepdiveRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error. Please try again." });
});

app.listen(PORT, () => {
  console.log(`StudyMaster backend running on http://localhost:${PORT}`);
});

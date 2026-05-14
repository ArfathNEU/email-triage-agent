import "dotenv/config";
import express from "express";
import cors from "cors";
import uploadsRouter from "./routes/uploads.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/uploads", uploadsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});
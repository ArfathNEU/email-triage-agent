import "./env.js";
import express from "express";
import cors from "cors";
import uploadsRouter from "./routes/uploads.js";
import emailsRouter from "./routes/emails.js";
import agentRouter from "./routes/agent.js";
import toolsRouter from "./routes/tools.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin.split(",") }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/uploads", uploadsRouter);
app.use("/emails", emailsRouter);
app.use("/agent", agentRouter);
app.use("/tools", toolsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});
import { Router } from "express";
import { listEmails } from "../db/queries.js";
import { runAgentForEmails, getProgress } from "../agent/run.js";

const router = Router();

router.post("/run", async (_req, res) => {
  const emails = listEmails();
  if (emails.length === 0) {
    return res.status(400).json({
      error: "no_emails",
      message: "Upload a CSV first.",
    });
  }

  try {
    const summary = await runAgentForEmails(emails);
    res.json(summary);
  } catch (err) {
    res.status(500).json({
      error: "agent_run_failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get("/status", (_req, res) => {
  res.json(getProgress());
});

export default router;
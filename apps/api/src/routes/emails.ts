import { Router } from "express";
import {
  listEmails,
  getEmailById,
  getToolCallsForEmail,
} from "../db/queries.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ emails: listEmails() });
});

router.get("/:id", (req, res) => {
  const id = req.params.id;
  const email = getEmailById(id);
  if (!email) {
    return res.status(404).json({ error: "not_found", id });
  }
  const toolCalls = getToolCallsForEmail(id);
  res.json({ ...email, toolCalls });
});

export default router;
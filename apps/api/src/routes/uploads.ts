import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { insertEmailsBatch, countEmails } from "../db/queries.js";
import type { Email } from "@app/shared";

const router = Router();

// 10MB cap — generous; a 200-email CSV is ~250KB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const rowSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string(),
  cc: z.string().optional().default(""),
  subject: z.string(),
  date: z.string(),
  body: z.string().min(1),
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "no_file", message: "Expected a file field named 'file'." });
  }

  let raw: unknown[];
  try {
    raw = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
  } catch (err) {
    return res.status(400).json({
      error: "csv_parse_failed",
      message: err instanceof Error ? err.message : "Unable to parse CSV.",
    });
  }

  const emails: Email[] = [];
  const errors: { row: number; reason: string }[] = [];

  raw.forEach((row, idx) => {
    const result = rowSchema.safeParse(row);
    if (result.success) {
      emails.push(result.data);
    } else {
      errors.push({ row: idx + 2, reason: result.error.errors[0]?.message ?? "invalid row" });
    }
  });

  if (emails.length === 0) {
    return res.status(400).json({
      error: "no_valid_rows",
      message: "CSV contained no valid email rows.",
      errors: errors.slice(0, 5),
    });
  }

  insertEmailsBatch(emails);

  res.json({
    inserted: emails.length,
    skipped: errors.length,
    totalEmailsInDb: countEmails(),
    errors: errors.slice(0, 10),
  });
});

export default router;
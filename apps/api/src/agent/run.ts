import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";
import type { Email } from "@app/shared";
import { TOOLS } from "./tools.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import {
  insertToolCall,
  getToolCallsForEmail,
} from "../db/queries.js";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
const maxBodyChars = Number(process.env.MAX_EMAIL_BODY_CHARS) || 4000;
const concurrency = Number(process.env.AGENT_CONCURRENCY) || 5;

if (!apiKey) {
  console.warn("ANTHROPIC_API_KEY missing — agent calls will fail.");
}

const client = new Anthropic({ apiKey: apiKey ?? "missing" });

interface RunResult {
  emailId: string;
  toolCallCount: number;
  error?: string;
}

function formatEmail(email: Email): string {
  const body = email.body.slice(0, maxBodyChars);
  return [
    `Email id: ${email.id}`,
    `From: ${email.from}`,
    `To: ${email.to}`,
    email.cc ? `Cc: ${email.cc}` : null,
    `Subject: ${email.subject}`,
    `Date: ${email.date}`,
    "",
    body,
  ]
    .filter(Boolean)
    .join("\n");
}

async function triageOne(email: Email): Promise<RunResult> {
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: formatEmail(email) }],
    });

    let count = 0;
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const input = (block.input ?? {}) as Record<string, unknown>;
      const rationale = String(input.rationale ?? "");
      const args = { ...input };
      delete args.rationale;

      insertToolCall(email.id, block.name as never, args, rationale);
      count++;
    }

    return { emailId: email.id, toolCallCount: count };
  } catch (err) {
    return {
      emailId: email.id,
      toolCallCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runAgentForEmails(emails: Email[]): Promise<{
  processed: number;
  toolCallsTotal: number;
  failures: { emailId: string; error: string }[];
}> {
  const limit = pLimit(concurrency);

  const results = await Promise.all(
    emails.map((email) =>
      limit(async () => {
        // Skip emails that already have tool calls (idempotency)
        const existing = getToolCallsForEmail(email.id);
        if (existing.length > 0) {
          return { emailId: email.id, toolCallCount: existing.length };
        }
        return triageOne(email);
      }),
    ),
  );

  const failures = results
    .filter((r) => r.error)
    .map((r) => ({ emailId: r.emailId, error: r.error! }));

  const toolCallsTotal = results.reduce(
    (sum, r) => sum + r.toolCallCount,
    0,
  );

  return {
    processed: results.length,
    toolCallsTotal,
    failures,
  };
}
import type { Email, ToolCall, ToolExecution, ToolName } from "@app/shared";
import { db } from "./index.js";

// Row shapes as stored in SQLite (snake_case, JSON as TEXT)
interface EmailRow {
  id: string;
  from_addr: string;
  to_addrs: string;
  cc: string;
  subject: string;
  date: string;
  body: string;
  uploaded_at: string;
}

interface ToolCallRow {
  id: number;
  email_id: string;
  tool: string;
  arguments: string; // JSON-encoded
  rationale: string;
  created_at: string;
}

interface ToolExecutionRow {
  id: number;
  tool_call_id: number;
  result: string; // JSON-encoded
  executed_at: string;
}

// ---------- Mappers ----------

function rowToEmail(row: EmailRow): Email {
  return {
    id: row.id,
    from: row.from_addr,
    to: row.to_addrs,
    cc: row.cc,
    subject: row.subject,
    date: row.date,
    body: row.body,
  };
}

function rowToToolCall(row: ToolCallRow): ToolCall {
  return {
    id: row.id,
    emailId: row.email_id,
    tool: row.tool as ToolName,
    arguments: JSON.parse(row.arguments),
    rationale: row.rationale,
    createdAt: row.created_at,
  };
}

function rowToToolExecution(row: ToolExecutionRow): ToolExecution {
  return {
    id: row.id,
    toolCallId: row.tool_call_id,
    result: JSON.parse(row.result),
    executedAt: row.executed_at,
  };
}

// ---------- Emails ----------

const insertEmailStmt = db.prepare<EmailRow>(`
  INSERT OR REPLACE INTO emails (id, from_addr, to_addrs, cc, subject, date, body)
  VALUES (@id, @from_addr, @to_addrs, @cc, @subject, @date, @body)
`);

export function insertEmail(email: Email): void {
  insertEmailStmt.run({
    id: email.id,
    from_addr: email.from,
    to_addrs: email.to,
    cc: email.cc,
    subject: email.subject,
    date: email.date,
    body: email.body,
    uploaded_at: "", // ignored, default kicks in
  });
}

export const insertEmailsBatch = db.transaction((emails: Email[]) => {
  for (const e of emails) insertEmail(e);
});

const listEmailsStmt = db.prepare<[], EmailRow>(`
  SELECT * FROM emails ORDER BY date DESC
`);

export function listEmails(): Email[] {
  return listEmailsStmt.all().map(rowToEmail);
}

const getEmailByIdStmt = db.prepare<[string], EmailRow>(`
  SELECT * FROM emails WHERE id = ?
`);

export function getEmailById(id: string): Email | null {
  const row = getEmailByIdStmt.get(id);
  return row ? rowToEmail(row) : null;
}

const deleteAllEmailsStmt = db.prepare("DELETE FROM emails");

export function deleteAllEmails(): void {
  deleteAllEmailsStmt.run();
}

// ---------- Tool calls ----------

const insertToolCallStmt = db.prepare<{
  email_id: string;
  tool: string;
  arguments: string;
  rationale: string;
}>(`
  INSERT INTO tool_calls (email_id, tool, arguments, rationale)
  VALUES (@email_id, @tool, @arguments, @rationale)
`);

export function insertToolCall(
  emailId: string,
  tool: ToolName,
  args: Record<string, unknown>,
  rationale: string,
): number {
  const info = insertToolCallStmt.run({
    email_id: emailId,
    tool,
    arguments: JSON.stringify(args),
    rationale,
  });
  return info.lastInsertRowid as number;
}

const getToolCallsForEmailStmt = db.prepare<[string], ToolCallRow>(`
  SELECT * FROM tool_calls WHERE email_id = ? ORDER BY id ASC
`);

export function getToolCallsForEmail(emailId: string): ToolCall[] {
  return getToolCallsForEmailStmt.all(emailId).map(rowToToolCall);
}

const getToolCallByIdStmt = db.prepare<[number], ToolCallRow>(`
  SELECT * FROM tool_calls WHERE id = ?
`);

export function getToolCallById(id: number): ToolCall | null {
  const row = getToolCallByIdStmt.get(id);
  return row ? rowToToolCall(row) : null;
}

// ---------- Tool executions ----------

const insertToolExecutionStmt = db.prepare<{
  tool_call_id: number;
  result: string;
}>(`
  INSERT INTO tool_executions (tool_call_id, result)
  VALUES (@tool_call_id, @result)
`);

export function insertToolExecution(
  toolCallId: number,
  result: Record<string, unknown>,
): ToolExecution {
  const info = insertToolExecutionStmt.run({
    tool_call_id: toolCallId,
    result: JSON.stringify(result),
  });
  return {
    id: info.lastInsertRowid as number,
    toolCallId,
    result,
    executedAt: new Date().toISOString(),
  };
}

const getExecutionsForToolCallStmt = db.prepare<[number], ToolExecutionRow>(`
  SELECT * FROM tool_executions WHERE tool_call_id = ? ORDER BY id DESC
`);

export function getExecutionsForToolCall(
  toolCallId: number,
): ToolExecution[] {
  return getExecutionsForToolCallStmt.all(toolCallId).map(rowToToolExecution);
}

// ---------- Aggregate stats ----------

export function countEmails(): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM emails").get() as { c: number })
    .c;
}

export function countToolCalls(): number {
  return (
    db.prepare("SELECT COUNT(*) AS c FROM tool_calls").get() as { c: number }
  ).c;
}
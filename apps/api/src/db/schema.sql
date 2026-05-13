CREATE TABLE IF NOT EXISTS emails (
  id          TEXT PRIMARY KEY,
  from_addr   TEXT NOT NULL,
  to_addrs    TEXT NOT NULL,
  cc          TEXT NOT NULL DEFAULT '',
  subject     TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL,
  body        TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id    TEXT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  tool        TEXT NOT NULL,
  arguments   TEXT NOT NULL,
  rationale   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tool_executions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_call_id INTEGER NOT NULL REFERENCES tool_calls(id) ON DELETE CASCADE,
  result       TEXT NOT NULL,
  executed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_email_id ON tool_calls(email_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tool ON tool_calls(tool);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_call_id ON tool_executions(tool_call_id);
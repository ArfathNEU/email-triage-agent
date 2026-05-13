import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve from the API package root, not the user's CWD.
// __dirname is .../apps/api/src/db, so three levels up = the monorepo root.
const repoRoot = resolve(__dirname, "../../../..");

const dbPath = process.env.DATABASE_PATH
  ? resolve(repoRoot, process.env.DATABASE_PATH)
  : resolve(repoRoot, "data/triage.db");

// Ensure the parent directory exists (idempotent)
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schemaPath = resolve(__dirname, "schema.sql");
const schema = readFileSync(schemaPath, "utf-8");
db.exec(schema);

console.log(`db ready at ${dbPath}`);
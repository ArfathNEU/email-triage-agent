import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMA } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve from the API package root, not the user's CWD.
// __dirname is .../apps/api/src/db (in dev) or .../apps/api/dist/db (in prod),
// so three levels up reaches the monorepo root in both cases.
const repoRoot = resolve(__dirname, "../../../..");

const dbPath = process.env.DATABASE_PATH
  ? resolve(repoRoot, process.env.DATABASE_PATH)
  : resolve(repoRoot, "data/triage.db");

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(SCHEMA);

console.log(`db ready at ${dbPath}`);
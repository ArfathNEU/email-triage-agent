import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env from the repo root, regardless of cwd.
// __dirname here is .../apps/api/src
const repoRoot = resolve(__dirname, "../../..");
config({ path: resolve(repoRoot, ".env") });
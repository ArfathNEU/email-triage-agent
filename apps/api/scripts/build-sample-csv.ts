import { readdirSync, readFileSync, statSync, mkdirSync, createWriteStream } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { simpleParser } from "mailparser";
import { stringify } from "csv-stringify";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

const MAILDIR = resolve(REPO_ROOT, "maildir");
const OUTPUT = resolve(REPO_ROOT, "data/sample_emails.csv");

const PER_BUCKET = 25;

const BUCKETS: Record<string, RegExp[]> = {
  schedule_meeting: [
    /\b(meeting|meet|schedule|calendar|conference call|zoom|teleconference)\b/i,
    /\b(can we set up|let'?s set up|propose a time|find a time)\b/i,
  ],
  draft_response: [
    /\?\s*$/m,
    /\b(can you|could you|would you|please (let me know|advise|confirm|reply))\b/i,
    /\b(any thoughts|what do you think|your thoughts)\b/i,
  ],
  escalate_to_manager: [
    /\b(unacceptable|disappointed|complaint|escalat|outraged|furious|concerned)\b/i,
    /\b(switching vendors|going elsewhere|cancel.{0,15}contract|breach)\b/i,
    /\b(this is (a |an )?(serious|major) (issue|problem))\b/i,
  ],
  create_task: [
    /\b(action item|follow[- ]up|todo|to do|next steps)\b/i,
    /\b(by (eod|cob|monday|tuesday|wednesday|thursday|friday|end of day|tomorrow))\b/i,
    /\b(deliverable|deadline)\b/i,
  ],
  flag_urgent: [
    /\b(urgent|asap|time[- ]sensitive|immediately|right away)\b/i,
    /\b(critical|emergency)\b/i,
  ],
  archive_no_action: [
    /^(no[- ]reply|do[- ]not[- ]reply|automated|notification|newsletter|fyi)\b/i,
    /\b(unsubscribe|click here to opt out)\b/i,
  ],
};

interface Sample {
  id: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  body: string;
  bucket: string;
}

function classify(subject: string, body: string): string | null {
  const haystack = `${subject}\n${body}`;
  for (const [bucket, patterns] of Object.entries(BUCKETS)) {
    if (patterns.some((p) => p.test(haystack))) return bucket;
  }
  return null;
}

function cleanBody(raw: string): string {
  return raw
    .replace(/-{5,}.*?-{5,}/gs, "")
    .replace(/^>.*$/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);
}

async function parseEmailFile(path: string): Promise<Sample | null> {
  try {
    const raw = readFileSync(path);
    const parsed = await simpleParser(raw);

    const from = parsed.from?.text ?? "";
    const to = Array.isArray(parsed.to)
      ? parsed.to.map((a) => a.text).join(", ")
      : (parsed.to?.text ?? "");
    const cc = Array.isArray(parsed.cc)
      ? parsed.cc.map((a) => a.text).join(", ")
      : (parsed.cc?.text ?? "");
    const subject = parsed.subject ?? "";
    const date = parsed.date?.toISOString() ?? "";
    const body = cleanBody(parsed.text ?? "");

    if (!from || !date || body.length < 30) return null;

    const bucket = classify(subject, body);
    if (!bucket) return null;

    return { id: "", from, to, cc, subject, date, body, bucket };
  } catch {
    return null;
  }
}

function* walk(root: string): Generator<string> {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const e of entries) {
    const full = join(root, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

async function main(): Promise<void> {
  if (!statSync(MAILDIR, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`maildir not found at ${MAILDIR}`);
    console.error(`expected: extract enron_mail.tar.gz into ${REPO_ROOT}`);
    process.exit(1);
  }

  const buckets: Record<string, Sample[]> = {};
  for (const k of Object.keys(BUCKETS)) buckets[k] = [];

  let scanned = 0;
  for (const path of walk(MAILDIR)) {
    scanned++;
    if (scanned % 5000 === 0) console.log(`scanned ${scanned}...`);

    if (Object.values(buckets).every((b) => b.length >= PER_BUCKET)) break;

    const sample = await parseEmailFile(path);
    if (!sample) continue;

    const target = buckets[sample.bucket]!;
    if (target.length < PER_BUCKET) {
      target.push(sample);
    }
  }

  console.log(`\nscanned ${scanned} emails total`);
  for (const [bucket, items] of Object.entries(buckets)) {
    console.log(`  ${bucket}: ${items.length}`);
  }

  const all: Sample[] = [];
  let n = 1;
  for (const items of Object.values(buckets)) {
    for (const s of items) {
      all.push({ ...s, id: `enron_${String(n).padStart(5, "0")}` });
      n++;
    }
  }

  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  const writer = createWriteStream(OUTPUT);
  const stringifier = stringify({
    header: true,
    columns: ["id", "from", "to", "cc", "subject", "date", "body"],
  });
  stringifier.pipe(writer);

  for (const s of all) {
    stringifier.write({
      id: s.id,
      from: s.from,
      to: s.to,
      cc: s.cc,
      subject: s.subject,
      date: s.date,
      body: s.body,
    });
  }
  stringifier.end();

  writer.on("finish", () => {
    console.log(`\nwrote ${all.length} emails to ${OUTPUT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
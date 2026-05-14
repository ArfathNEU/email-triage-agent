import "../src/env.js";
import { listEmails } from "../src/db/queries.js";
import { runAgentForEmails } from "../src/agent/run.js";

const emails = listEmails();
console.log(`db has ${emails.length} emails`);

const sample = emails;
console.log(`running agent on ${sample.length} emails...`);

const start = Date.now();
const result = await runAgentForEmails(sample);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\nfinished in ${elapsed}s`);
console.log(result);
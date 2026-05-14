# AI Email Triage Assistant

A full-stack application that uses Anthropic's Claude with tool-use to triage inbound emails. Upload a CSV of emails, the agent reads each one, picks one or more of six tools (schedule meeting, draft reply, escalate, create task, flag urgent, archive), and the UI renders the recommendations as actionable cards that can be "executed" against a mocked backend.

Built for the SDE Co-Op technical assignment. The agent layer is real Claude API; the downstream tool execution is mocked and deterministic.

---

## Demo

### Inbox after a full agent run

![Inbox with Run agent button, filter chips, and tool badges on rows](docs/screenshots/inbox.png)

150 emails sampled from the Enron Corpus, fully triaged by the agent. Every row shows the tool(s) the agent picked. Filter chips narrow the view to any single tool. The "Run agent" button in the header triggers a fresh batch and is safe to re-click — already-triaged emails are skipped via idempotency.

### Tool card with mocked execution result

![Email detail showing an Archive tool card with executed result](docs/screenshots/tool-card.png)

Clicking an email opens its detail panel. The agent's recommendation is rendered as a tool card with the rationale (in italics, the agent's own one-sentence explanation), the structured arguments, and an Execute button. When clicked, the backend returns a deterministic mocked result rendered in a tool-specific style — calendar cards for meetings, email previews for drafts, red ticket cards for escalations, etc.

### Upload page with agent trigger

![Upload page after dropping a CSV, showing inserted/skipped counts and a Run agent button](docs/screenshots/upload.png)

Drag-drop a CSV, get a result summary, and trigger the agent from one place. Re-uploads use `INSERT OR REPLACE` so the same CSV can be uploaded repeatedly without duplicates.

---

## Quickstart

### Prerequisites

- **Node.js 20+** and **npm 10+** (`node -v`, `npm -v` to check)
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). Account needs a few dollars of credit; the full 150-email demo run costs about $0.25 on Haiku or $4 on Opus.

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/ArfathNEU/email-triage-agent.git
cd email-triage-agent

# 2. Install dependencies (npm workspaces — one install covers everything)
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and paste your Anthropic API key into ANTHROPIC_API_KEY=
```

### Run

You need two terminal tabs:

```bash
# Tab 1 — Backend (Express on :3001)
cd apps/api
npm run dev

# Tab 2 — Frontend (Vite on :5173)
cd apps/web
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Try it

1. Go to **Upload**
2. Drop `data/sample_emails.csv` (committed in the repo, 150 emails sampled from the Enron Corpus)
3. Click **Upload sample_emails.csv** → 150 emails inserted
4. Click **Run agent on inbox** → wait ~30 sec (Haiku) or ~3 min (Opus)
5. Click **View triaged inbox →** to see the results

The agent is idempotent — re-running on the same emails is safe and will skip work already done.

---

## Architecture
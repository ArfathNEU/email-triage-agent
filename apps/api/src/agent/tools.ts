import type Anthropic from "@anthropic-ai/sdk";

const rationaleSchema = {
  type: "string" as const,
  description:
    "One short sentence explaining why this tool fits the email. Required.",
};

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "schedule_meeting",
    description:
      "Book a meeting when the email proposes one, asks for time, or requests a call.",
    input_schema: {
      type: "object",
      required: ["rationale", "attendees", "proposed_time", "subject"],
      properties: {
        rationale: rationaleSchema,
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "Email addresses to invite.",
        },
        proposed_time: {
          type: "string",
          description: "ISO 8601 datetime, e.g. 2026-05-15T14:00:00Z.",
        },
        duration_minutes: {
          type: "integer",
          minimum: 15,
          maximum: 240,
          description: "Meeting duration in minutes. Default 30 if unclear.",
        },
        subject: { type: "string", description: "Meeting subject line." },
      },
    },
  },
  {
    name: "draft_response",
    description:
      "Draft a reply when the email asks a question, requests information, or expects a response.",
    input_schema: {
      type: "object",
      required: ["rationale", "to", "subject", "body", "tone"],
      properties: {
        rationale: rationaleSchema,
        to: { type: "string", description: "Recipient email address." },
        subject: { type: "string", description: "Reply subject line." },
        body: {
          type: "string",
          description: "The full body of the reply, 80-300 words.",
        },
        tone: {
          type: "string",
          enum: ["formal", "friendly", "apologetic", "neutral", "urgent"],
        },
      },
    },
  },
  {
    name: "escalate_to_manager",
    description:
      "Flag for manager review when the email shows client dissatisfaction, complaints, churn risk, legal issues, or anything requiring oversight.",
    input_schema: {
      type: "object",
      required: ["rationale", "reason", "priority", "original_email_id"],
      properties: {
        rationale: rationaleSchema,
        reason: {
          type: "string",
          description: "What about the email triggers escalation.",
        },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        original_email_id: {
          type: "string",
          description: "The id of the source email.",
        },
        suggested_owner: {
          type: "string",
          description: "Optional. Email of the person who should handle this.",
        },
      },
    },
  },
  {
    name: "create_task",
    description:
      "Create a follow-up task for action items, deadlines, or commitments mentioned in the email.",
    input_schema: {
      type: "object",
      required: ["rationale", "title"],
      properties: {
        rationale: rationaleSchema,
        title: { type: "string", description: "Short task title." },
        due_date: {
          type: "string",
          description: "ISO date if a deadline is mentioned, else omit.",
        },
        assignee: {
          type: "string",
          description: "Email of the person responsible.",
        },
        notes: { type: "string", description: "Context for the task." },
      },
    },
  },
  {
    name: "flag_urgent",
    description:
      "Mark as urgent for time-sensitive emails that need immediate attention but no specific reply.",
    input_schema: {
      type: "object",
      required: ["rationale", "reason"],
      properties: {
        rationale: rationaleSchema,
        reason: { type: "string", description: "Why this is time-sensitive." },
        deadline: {
          type: "string",
          description: "ISO datetime if a hard deadline exists.",
        },
      },
    },
  },
  {
    name: "archive_no_action",
    description:
      "Archive newsletters, FYIs, automated notifications, or anything that needs no follow-up.",
    input_schema: {
      type: "object",
      required: ["rationale", "category"],
      properties: {
        rationale: rationaleSchema,
        category: {
          type: "string",
          enum: [
            "newsletter",
            "fyi",
            "automated_notification",
            "spam",
            "delivery_failure",
            "other",
          ],
        },
        reason: { type: "string", description: "Brief description." },
      },
    },
  },
];
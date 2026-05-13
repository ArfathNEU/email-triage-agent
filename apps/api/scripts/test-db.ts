import "dotenv/config";
import {
  insertEmail,
  insertToolCall,
  insertToolExecution,
  listEmails,
  getToolCallsForEmail,
  getExecutionsForToolCall,
  countEmails,
  countToolCalls,
  deleteAllEmails,
} from "../src/db/queries.js";

console.log("clearing tables...");
deleteAllEmails();

console.log("inserting test email...");
insertEmail({
  id: "test_001",
  from: "[email protected]",
  to: "[email protected]",
  cc: "",
  subject: "Quarterly review",
  date: "2026-05-13T10:00:00Z",
  body: "Can we schedule a meeting this week to discuss Q1 numbers?",
});

console.log("inserting tool call...");
const toolCallId = insertToolCall(
  "test_001",
  "schedule_meeting",
  {
    attendees: ["[email protected]", "[email protected]"],
    proposed_time: "2026-05-15T14:00:00Z",
    duration_minutes: 30,
    subject: "Q1 review",
  },
  "Sender explicitly asks to schedule a meeting this week.",
);
console.log("tool call id:", toolCallId);

console.log("inserting tool execution...");
const execution = insertToolExecution(toolCallId, {
  meetingId: "MTG-abc123",
  calendarLink: "https://example.com/cal/abc123",
  status: "scheduled",
});
console.log("execution:", execution);

console.log("---");
console.log("emails:", listEmails().length);
console.log("tool calls:", countToolCalls());
console.log("tool calls for test_001:", getToolCallsForEmail("test_001"));
console.log("executions for tool call:", getExecutionsForToolCall(toolCallId));
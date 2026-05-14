import { Router } from "express";
import {
  getToolCallById,
  insertToolExecution,
  getExecutionsForToolCall,
} from "../db/queries.js";
import { executeTool } from "../tools/executors.js";
import type { ToolName } from "@app/shared";

const router = Router();

router.post("/:toolCallId/execute", (req, res) => {
  const id = Number(req.params.toolCallId);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "invalid_id" });
  }

  const toolCall = getToolCallById(id);
  if (!toolCall) {
    return res.status(404).json({ error: "tool_call_not_found", id });
  }

  // If already executed, return the existing result (idempotent + deterministic)
  const existing = getExecutionsForToolCall(id);
  if (existing[0]) {
    return res.json({ result: existing[0].result, cached: true });
  }

  try {
    const result = executeTool(toolCall.tool as ToolName, toolCall.arguments);
    const execution = insertToolExecution(id, result);
    return res.json({ result: execution.result, cached: false });
  } catch (err) {
    return res.status(500).json({
      error: "execution_failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
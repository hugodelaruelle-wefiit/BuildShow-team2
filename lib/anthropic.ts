import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared Anthropic client + model config.
 *
 * Server-side only — the `ANTHROPIC_API_KEY` is read from the environment and
 * never reaches the browser (all Claude calls go through API routes).
 *
 * Model is `claude-sonnet-5` per the project's architecture decision: strong
 * quality with low enough latency for the turn-based flow.
 */
export const anthropic = new Anthropic();

export const CLAUDE_MODEL = "claude-sonnet-5";

/**
 * Run a single Claude call that is forced to return structured output through
 * a tool, and hand back the validated tool input.
 *
 * Thinking is disabled: it keeps the turn-based flow snappy and lets us force a
 * specific `tool_choice` (which the API rejects alongside thinking). The caller
 * is responsible for validating the returned shape.
 */
export async function generateStructured<T>(opts: {
  system: string;
  user: string;
  tool: Anthropic.Tool;
  maxTokens?: number;
}): Promise<T> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    thinking: { type: "disabled" },
    system: opts.system,
    tools: [opts.tool],
    tool_choice: { type: "tool", name: opts.tool.name },
    messages: [{ role: "user", content: opts.user }],
  });

  const toolUse = message.content.find(
    (block) => block.type === "tool_use" && block.name === opts.tool.name,
  );

  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("no_tool_use");
  }

  return toolUse.input as T;
}

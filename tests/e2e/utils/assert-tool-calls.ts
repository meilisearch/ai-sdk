import type { ToolSet, TypedToolCall, TypedToolResult } from "ai";
import { expect } from "vite-plus/test";

type ToolCallsResult<TOOLS extends ToolSet = ToolSet> = {
  toolCalls: Array<TypedToolCall<TOOLS>>;
};

type ToolResultsResult<TOOLS extends ToolSet = ToolSet> = {
  toolResults: Array<TypedToolResult<TOOLS>>;
};

export type ExpectToolCalledOptions = {
  times?: number | { min?: number };
};

function matchesName(toolName: string, name?: string): boolean {
  return name === undefined || toolName === name;
}

export function getToolCalls<TOOLS extends ToolSet>(
  result: ToolCallsResult<TOOLS>,
  name?: string,
): TypedToolCall<TOOLS>[] {
  return result.toolCalls.filter((call) => matchesName(call.toolName, name));
}

export function getToolResults<TOOLS extends ToolSet>(
  result: ToolResultsResult<TOOLS>,
  name?: string,
): TypedToolResult<TOOLS>[] {
  return result.toolResults.filter((toolResult) => matchesName(toolResult.toolName, name));
}

export function expectToolCalled<TOOLS extends ToolSet>(
  result: ToolCallsResult<TOOLS>,
  name: string,
  options: ExpectToolCalledOptions = {},
): TypedToolCall<TOOLS>[] {
  const calls = getToolCalls(result, name);
  const { times = { min: 1 } } = options;

  if (typeof times === "number") {
    expect(calls, `expected tool "${name}" to be called ${times} time(s)`).toHaveLength(times);
  } else {
    const min = times.min ?? 1;
    expect(
      calls.length,
      `expected tool "${name}" to be called at least ${min} time(s)`,
    ).toBeGreaterThanOrEqual(min);
  }

  return calls;
}

export function expectToolCallInput<TOOLS extends ToolSet>(
  result: ToolCallsResult<TOOLS>,
  name: string,
  partialInput: unknown,
): TypedToolCall<TOOLS> {
  const [call] = expectToolCalled(result, name);
  expect(call.input).toEqual(expect.objectContaining(partialInput as Record<string, unknown>));
  return call;
}

export function expectToolResult<TOOLS extends ToolSet>(
  result: ToolResultsResult<TOOLS>,
  name: string,
  matcher?: Record<string, unknown> | ((output: unknown) => void),
): TypedToolResult<TOOLS> {
  const results = getToolResults(result, name);
  expect(results, `expected tool "${name}" to have at least one result`).not.toHaveLength(0);

  const toolResult = results[0]!;

  if (typeof matcher === "function") {
    matcher(toolResult.output);
  } else if (matcher !== undefined) {
    expect(toolResult.output).toEqual(expect.objectContaining(matcher));
  }

  return toolResult;
}

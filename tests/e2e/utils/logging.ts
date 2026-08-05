const DEFAULT_MAX_OUTPUT_CHARS = 500;

type LogGenerateTextOptions = {
  prefix?: string;
  maxOutputChars?: number;
};

type StepLog = {
  stepNumber: number;
  text: string;
  finishReason: string;
  toolCalls: Array<{ toolName: string; input: unknown }>;
  toolResults: Array<{ toolName: string; output: unknown }>;
};

type FinishLog = {
  text: string;
  steps: unknown[];
};

function truncate(value: unknown, maxChars: number): unknown {
  const serialized = JSON.stringify(value);
  if (serialized.length <= maxChars) {
    return value;
  }
  return `${serialized.slice(0, maxChars)}… (${serialized.length} chars)`;
}

/**
 * Returns `generateText` callbacks that print progress so long e2e runs aren't silent.
 */
export function withLogging(options: LogGenerateTextOptions = {}) {
  const prefix = options.prefix ?? "[e2e]";
  const maxOutputChars = options.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;

  return {
    onStart() {
      console.log(`${prefix} starting generateText…`);
    },
    onStepFinish({ stepNumber, text, toolCalls, toolResults, finishReason }: StepLog) {
      console.log(`${prefix} step ${stepNumber} finished (reason: ${finishReason})`);

      if (toolCalls.length > 0) {
        console.log(
          `${prefix} tool calls:`,
          toolCalls.map((call) => ({
            toolName: call.toolName,
            input: call.input,
          })),
        );
      }

      if (toolResults.length > 0) {
        console.log(
          `${prefix} tool results:`,
          toolResults.map((toolResult) => ({
            toolName: toolResult.toolName,
            output: truncate(toolResult.output, maxOutputChars),
          })),
        );
      }

      if (text) {
        console.log(`${prefix} text:`, text);
      }
    },
    onFinish({ steps }: FinishLog) {
      console.log(`${prefix} steps:`, steps.length);
    },
  };
}

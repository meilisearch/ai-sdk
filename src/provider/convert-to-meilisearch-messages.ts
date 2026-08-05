import type { LanguageModelV4Prompt } from "@ai-sdk/provider";

export type MeilisearchChatMessage =
  | {
      role: "system" | "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    }
  | {
      role: "tool";
      content: string;
      tool_call_id: string;
    };

function extractTextFromParts(parts: ReadonlyArray<{ type: string }>): string {
  return parts
    .map((part) => {
      if (
        part.type === "text" &&
        "text" in part &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }

      if (
        part.type === "file" &&
        "data" in part &&
        typeof (part as { data?: unknown }).data === "object" &&
        (part as { data?: unknown }).data != null
      ) {
        const data = (part as { data: unknown }).data as {
          type?: string;
          text?: string;
        };
        if (data.type === "text" && typeof data.text === "string") {
          return data.text;
        }
      }

      return "";
    })
    .join("");
}

export function convertToMeilisearchMessages(
  prompt: LanguageModelV4Prompt,
): MeilisearchChatMessage[] {
  const messages: MeilisearchChatMessage[] = [];

  for (const message of prompt) {
    if (message.role === "system") {
      messages.push({
        role: "system",
        content: message.content,
      });
      continue;
    }

    if (message.role === "user") {
      messages.push({
        role: "user",
        content: extractTextFromParts(message.content),
      });
      continue;
    }

    if (message.role === "assistant") {
      const content = extractTextFromParts(message.content);
      const toolCalls = message.content
        .filter((part) => part.type === "tool-call")
        .map((part) => ({
          id: part.toolCallId,
          type: "function" as const,
          function: {
            name: part.toolName,
            arguments:
              typeof part.input === "string" ? part.input : JSON.stringify(part.input ?? {}),
          },
        }));

      messages.push({
        role: "assistant",
        content,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      });
      continue;
    }

    if (message.role === "tool") {
      const toolResults = message.content.filter((part) => part.type === "tool-result");

      for (const toolResult of toolResults) {
        messages.push({
          role: "tool",
          tool_call_id: toolResult.toolCallId,
          content: JSON.stringify(toolResult.output),
        });
      }
    }
  }

  return messages;
}

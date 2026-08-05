import type {
  LanguageModelV4StreamPart,
  LanguageModelV4Usage,
  SharedV4Warning,
} from "@ai-sdk/provider";

import { mapFinishReason } from "./map-finish-reason.ts";

type OpenAIUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
};

type OpenAIToolCallDelta = {
  index?: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type OpenAIChunk = {
  id?: string;
  model?: string;
  created?: number;
  choices?: Array<{
    index?: number;
    finish_reason?: string | null;
    delta?: {
      content?: string;
      tool_calls?: OpenAIToolCallDelta[];
    };
  }>;
  usage?: OpenAIUsage;
};

type ToolCallAccumulator = {
  id: string;
  name: string;
  input: string;
  started: boolean;
};

function toUsage(usage: OpenAIUsage | undefined): LanguageModelV4Usage {
  return {
    inputTokens: {
      total: usage?.prompt_tokens,
      noCache: usage?.prompt_tokens,
      cacheRead: usage?.prompt_tokens_details?.cached_tokens,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: usage?.completion_tokens,
      text: usage?.completion_tokens,
      reasoning: usage?.completion_tokens_details?.reasoning_tokens,
    },
  };
}

export function parseChatCompletionSse(params: {
  stream: ReadableStream<Uint8Array>;
  warnings: SharedV4Warning[];
}): ReadableStream<LanguageModelV4StreamPart> {
  const { stream, warnings } = params;

  return new ReadableStream<LanguageModelV4StreamPart>({
    async start(controller) {
      const decoder = new TextDecoder();
      const reader = stream.getReader();
      const toolCalls = new Map<number, ToolCallAccumulator>();
      let buffer = "";
      let textPartId: string | undefined;

      controller.enqueue({
        type: "stream-start",
        warnings,
      });

      const finalizeToolCalls = () => {
        for (const toolCall of toolCalls.values()) {
          if (!toolCall.started) {
            controller.enqueue({
              type: "tool-input-start",
              id: toolCall.id,
              toolName: toolCall.name || "unknown",
              providerExecuted: true,
            });
          }

          controller.enqueue({
            type: "tool-input-end",
            id: toolCall.id,
          });

          controller.enqueue({
            type: "tool-call",
            toolCallId: toolCall.id,
            toolName: toolCall.name || "unknown",
            input: toolCall.input,
            providerExecuted: true,
          });
        }

        toolCalls.clear();
      };

      const processChunk = (chunk: OpenAIChunk) => {
        const choice = chunk.choices?.[0];
        if (choice == null) {
          return;
        }

        const delta = choice.delta;
        if (delta == null) {
          return;
        }

        if (typeof delta.content === "string" && delta.content.length > 0) {
          if (textPartId == null) {
            textPartId = `text-${chunk.id ?? "0"}`;
            controller.enqueue({
              type: "text-start",
              id: textPartId,
            });
          }

          controller.enqueue({
            type: "text-delta",
            id: textPartId,
            delta: delta.content,
          });
        }

        const toolCallDeltas = delta.tool_calls ?? [];
        for (const toolCallDelta of toolCallDeltas) {
          const index = toolCallDelta.index ?? 0;
          const accumulator = toolCalls.get(index) ?? {
            id: toolCallDelta.id ?? `tool-call-${index}`,
            name: toolCallDelta.function?.name ?? "",
            input: "",
            started: false,
          };

          if (toolCallDelta.id != null) {
            accumulator.id = toolCallDelta.id;
          }

          if (toolCallDelta.function?.name != null) {
            accumulator.name = toolCallDelta.function.name;
          }

          if (!accumulator.started) {
            controller.enqueue({
              type: "tool-input-start",
              id: accumulator.id,
              toolName: accumulator.name || "unknown",
              providerExecuted: true,
            });
            accumulator.started = true;
          }

          if (
            typeof toolCallDelta.function?.arguments === "string" &&
            toolCallDelta.function.arguments.length > 0
          ) {
            accumulator.input += toolCallDelta.function.arguments;
            controller.enqueue({
              type: "tool-input-delta",
              id: accumulator.id,
              delta: toolCallDelta.function.arguments,
            });
          }

          toolCalls.set(index, accumulator);
        }

        if (choice.finish_reason != null) {
          if (textPartId != null) {
            controller.enqueue({
              type: "text-end",
              id: textPartId,
            });
            textPartId = undefined;
          }

          finalizeToolCalls();

          controller.enqueue({
            type: "finish",
            finishReason: mapFinishReason(choice.finish_reason),
            usage: toUsage(chunk.usage),
          });
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            for (const line of event.split("\n")) {
              if (!line.startsWith("data: ")) {
                continue;
              }

              const data = line.slice("data: ".length).trim();
              if (data === "[DONE]") {
                continue;
              }

              try {
                processChunk(JSON.parse(data) as OpenAIChunk);
              } catch (error) {
                controller.enqueue({
                  type: "error",
                  error,
                });
              }
            }
          }
        }

        if (textPartId != null) {
          controller.enqueue({
            type: "text-end",
            id: textPartId,
          });
        }

        finalizeToolCalls();
        controller.close();
      } catch (error) {
        controller.enqueue({
          type: "error",
          error,
        });
        controller.close();
      }
    },
  });
}

import type { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { createMeilisearch } from "../meilisearch-provider.ts";

function createSseStream(events: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
}

async function readAllStreamParts<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const parts: T[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }

  return parts;
}

function createMockClient(streamCompletion = vi.fn()) {
  return {
    streamCompletion,
    client: {
      chat: vi.fn().mockReturnValue({ streamCompletion }),
    } as unknown as Meilisearch,
  };
}

const prompt = [
  {
    role: "user",
    content: [{ type: "text", text: "What is Meilisearch?" }],
  },
] as const;

describe("MeilisearchChatLanguageModel", () => {
  test("rejects non-streaming generation", async () => {
    const { client } = createMockClient();
    const provider = createMeilisearch({ client, workspace: "cloud" });
    const model = provider("gpt-4o-mini");

    await expect(
      model.doGenerate({
        prompt: [...prompt],
      } as never),
    ).rejects.toThrow(/stream/i);
  });

  test("streams text chunks and finish metadata from SSE", async () => {
    const { client, streamCompletion } = createMockClient(
      vi
        .fn()
        .mockResolvedValue(
          createSseStream([
            'data: {"id":"chatcmpl-1","created":1677652288,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{"content":"Meilisearch"},"finish_reason":null}]}\n\n',
            'data: {"id":"chatcmpl-1","created":1677652288,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{"content":" is fast"},"finish_reason":null}]}\n\n',
            'data: {"id":"chatcmpl-1","created":1677652288,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":7,"completion_tokens":3,"total_tokens":10}}\n\n',
            "data: [DONE]\n\n",
          ]),
        ),
    );
    const provider = createMeilisearch({ client, workspace: "cloud" });
    const model = provider("gpt-4o-mini");

    const result = await model.doStream({
      prompt: [...prompt],
    } as never);

    const parts = await readAllStreamParts(result.stream);
    const deltas = parts
      .filter((part) => part.type === "text-delta")
      .map((part) => part.delta)
      .join("");
    const finish = parts.find((part) => part.type === "finish");

    expect(deltas).toBe("Meilisearch is fast");
    expect(finish).toMatchObject({
      type: "finish",
      finishReason: {
        unified: "stop",
        raw: "stop",
      },
      usage: {
        inputTokens: { total: 7 },
        outputTokens: { total: 3 },
      },
    });

    expect(streamCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        stream: true,
        messages: [{ role: "user", content: "What is Meilisearch?" }],
      }),
    );
  });

  test("streams provider tool calls and forwards tool definitions", async () => {
    const { client, streamCompletion } = createMockClient(
      vi
        .fn()
        .mockResolvedValue(
          createSseStream([
            'data: {"id":"chatcmpl-2","created":1677652288,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_abc123","type":"function","function":{"name":"_meiliSearchProgress","arguments":"{\\"call_id\\":\\"abc\\"}"}}]},"finish_reason":null}]}\n\n',
            'data: {"id":"chatcmpl-2","created":1677652288,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}\n\n',
            "data: [DONE]\n\n",
          ]),
        ),
    );
    const provider = createMeilisearch({ client, workspace: "cloud" });
    const model = provider("gpt-4o-mini");

    const result = await model.doStream({
      prompt: [...prompt],
      tools: [
        {
          type: "function",
          name: "_meiliSearchProgress",
          description: "Reports real-time search progress",
          inputSchema: {
            type: "object",
            properties: {
              call_id: { type: "string" },
            },
            required: ["call_id"],
            additionalProperties: false,
          },
        },
      ],
    } as never);

    const parts = await readAllStreamParts(result.stream);
    const toolCall = parts.find((part) => part.type === "tool-call");

    expect(toolCall).toMatchObject({
      type: "tool-call",
      toolCallId: "call_abc123",
      toolName: "_meiliSearchProgress",
      input: '{"call_id":"abc"}',
      providerExecuted: true,
    });

    expect(streamCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          {
            type: "function",
            function: {
              name: "_meiliSearchProgress",
              description: "Reports real-time search progress",
              parameters: {
                type: "object",
                properties: {
                  call_id: { type: "string" },
                },
                required: ["call_id"],
                additionalProperties: false,
              },
            },
          },
        ],
      }),
    );
  });

  test("emits an error part when an SSE chunk is invalid JSON", async () => {
    const { client } = createMockClient(
      vi
        .fn()
        .mockResolvedValue(
          createSseStream(["data: {this is invalid json}\n\n", "data: [DONE]\n\n"]),
        ),
    );
    const provider = createMeilisearch({ client, workspace: "cloud" });
    const model = provider("gpt-4o-mini");

    const result = await model.doStream({
      prompt: [...prompt],
    } as never);

    const parts = await readAllStreamParts(result.stream);
    const errorPart = parts.find((part) => part.type === "error");

    expect(errorPart).toBeDefined();
  });
});

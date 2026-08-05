import { asSchema } from "ai";
import { describe, expect, test } from "vite-plus/test";

import { meilisearchChatTools } from "../chat-tools.ts";

describe("meilisearchChatTools", () => {
  test("exposes _meiliSearchProgress with validated input and no execute handler", async () => {
    const schema = asSchema(meilisearchChatTools.progress.inputSchema);

    await expect(
      schema.validate?.({
        call_id: "call-1",
        function_name: "_meiliSearchInIndex",
        function_parameters: '{"index_uid":"movies","q":"dune"}',
      }),
    ).resolves.toMatchObject({
      success: true,
      value: {
        call_id: "call-1",
        function_name: "_meiliSearchInIndex",
        function_parameters: '{"index_uid":"movies","q":"dune"}',
      },
    });

    await expect(schema.validate?.({})).resolves.toMatchObject({
      success: false,
    });
    expect(meilisearchChatTools.progress.execute).toBeUndefined();
  });

  test("exposes _meiliSearchSources with validated input and no execute handler", async () => {
    const schema = asSchema(meilisearchChatTools.sources.inputSchema);

    await expect(
      schema.validate?.({
        call_id: "call-1",
        documents: [{ id: 1, title: "Dune" }],
      }),
    ).resolves.toMatchObject({
      success: true,
      value: {
        call_id: "call-1",
        documents: [{ id: 1, title: "Dune" }],
      },
    });

    await expect(schema.validate?.({ call_id: "call-1" })).resolves.toMatchObject({
      success: false,
    });
    expect(meilisearchChatTools.sources.execute).toBeUndefined();
  });

  test("exposes _meiliAppendConversationMessage with validated input and no execute handler", async () => {
    const schema = asSchema(meilisearchChatTools.appendMessage.inputSchema);

    await expect(
      schema.validate?.({
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call_abc123",
            type: "function",
            function: {
              name: "_meiliSearchInIndex",
              arguments: '{"index_uid":"movies","q":"dune"}',
            },
          },
        ],
        tool_call_id: null,
      }),
    ).resolves.toMatchObject({
      success: true,
      value: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call_abc123",
            type: "function",
            function: {
              name: "_meiliSearchInIndex",
              arguments: '{"index_uid":"movies","q":"dune"}',
            },
          },
        ],
        tool_call_id: null,
      },
    });

    await expect(
      schema.validate?.({
        role: "assistant",
        content: "",
      }),
    ).resolves.toMatchObject({
      success: false,
    });
    expect(meilisearchChatTools.appendMessage.execute).toBeUndefined();
  });

  test("exposes the exact _meili* names through all", () => {
    expect(Object.keys(meilisearchChatTools.all)).toEqual([
      "_meiliSearchProgress",
      "_meiliSearchSources",
      "_meiliAppendConversationMessage",
    ]);

    expect(meilisearchChatTools.all._meiliSearchProgress).toBe(meilisearchChatTools.progress);
    expect(meilisearchChatTools.all._meiliSearchSources).toBe(meilisearchChatTools.sources);
    expect(meilisearchChatTools.all._meiliAppendConversationMessage).toBe(
      meilisearchChatTools.appendMessage,
    );
  });
});

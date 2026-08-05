import type { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { meilisearchChatTools } from "../../tools/chat-tools.ts";
import { createMeilisearch, meilisearch } from "../meilisearch-provider.ts";

function createMockClient() {
  const streamCompletion = vi.fn();

  return {
    streamCompletion,
    client: {
      chat: vi.fn().mockReturnValue({ streamCompletion }),
    } as unknown as Meilisearch,
  };
}

describe("createMeilisearch", () => {
  test("creates a workspace-scoped ProviderV4 callable with chat tools", () => {
    const { client } = createMockClient();
    const provider = createMeilisearch({
      client,
      workspace: "cloud",
    });

    expect(provider.specificationVersion).toBe("v4");
    expect(provider.chatTools).toBe(meilisearchChatTools);

    const model = provider("gpt-4o-mini");
    expect(model.specificationVersion).toBe("v4");
    expect(model.provider).toBe("meilisearch.chat");
    expect(model.modelId).toBe("gpt-4o-mini");

    expect(provider.languageModel("gpt-4.1").modelId).toBe("gpt-4.1");
    expect(provider.chat("gpt-4.1").modelId).toBe("gpt-4.1");
  });

  test("requires workspace", () => {
    const { client } = createMockClient();

    expect(() => createMeilisearch({ client } as never)).toThrow(/workspace/i);
  });

  test("requires host and api key when no client is injected", () => {
    expect(() => createMeilisearch({ workspace: "cloud" } as never)).toThrow(/host/i);
    expect(() =>
      createMeilisearch({ workspace: "cloud", host: "http://localhost:7700" } as never),
    ).toThrow(/api key/i);
  });

  test("exposes a lazy default provider wired with chat tools", () => {
    expect(meilisearch.specificationVersion).toBe("v4");
    expect(meilisearch.chatTools).toBe(meilisearchChatTools);
  });
});

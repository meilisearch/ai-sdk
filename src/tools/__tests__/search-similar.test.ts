import { asSchema } from "ai";
import type { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { meilisearchSearchSimilar } from "../search-similar.ts";

function createMockClient(searchSimilarDocuments = vi.fn()) {
  return {
    client: {
      index: vi.fn().mockReturnValue({ searchSimilarDocuments }),
    } as unknown as Meilisearch,
    searchSimilarDocuments,
  };
}

const executionOptions = {
  toolCallId: "call-1",
  messages: [],
  context: {},
};

describe("meilisearchSearchSimilar", () => {
  test("exposes a validated runtime input contract for id", async () => {
    const { client } = createMockClient();

    const searchSimilarTool = meilisearchSearchSimilar({
      client,
      description: "Find similar movies",
      indexUid: "movies",
    });

    expect(searchSimilarTool.description).toBe("Find similar movies");

    const schema = asSchema(searchSimilarTool.inputSchema);
    await expect(schema.validate?.({ id: "tt0120737" })).resolves.toMatchObject({
      success: true,
      value: { id: "tt0120737" },
    });
    await expect(schema.validate?.({ id: 42 })).resolves.toMatchObject({
      success: true,
      value: { id: 42 },
    });
    await expect(schema.validate?.({})).resolves.toMatchObject({
      success: false,
    });
  });

  test("forwards config searchSimilarParams with the runtime id", async () => {
    const searchSimilarParams = {
      embedder: "default",
      limit: 5,
    };
    const { client, searchSimilarDocuments } = createMockClient(
      vi.fn().mockResolvedValue({
        hits: [{ id: "tt0167260" }],
        id: "tt0120737",
      }),
    );

    const searchSimilarTool = meilisearchSearchSimilar({
      client,
      description: "Find similar movies",
      indexUid: "movies",
      searchSimilarParams,
    });

    await expect(
      searchSimilarTool.execute?.({ id: "tt0120737" }, executionOptions as never),
    ).resolves.toEqual({
      hits: [{ id: "tt0167260" }],
      id: "tt0120737",
    });

    expect(searchSimilarDocuments).toHaveBeenCalledWith({
      id: "tt0120737",
      embedder: "default",
      limit: 5,
    });
  });

  test("propagates Meilisearch errors", async () => {
    const { client } = createMockClient(vi.fn().mockRejectedValue(new Error("document not found")));

    const searchSimilarTool = meilisearchSearchSimilar({
      client,
      description: "Find similar movies",
      indexUid: "movies",
    });

    await expect(
      searchSimilarTool.execute?.({ id: "missing" }, executionOptions as never),
    ).rejects.toThrow("document not found");
  });
});

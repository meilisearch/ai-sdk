import { asSchema } from "ai";
import type { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { meilisearchMultiSearch } from "../multi-search.ts";

function createMockClient(multiSearch = vi.fn()) {
  return {
    client: {
      multiSearch,
    } as unknown as Meilisearch,
    multiSearch,
  };
}

const executionOptions = {
  toolCallId: "call-1",
  messages: [],
  context: {},
};

describe("meilisearchMultiSearch", () => {
  test("exposes a validated runtime input contract for q", async () => {
    const { client } = createMockClient();

    const multiSearchTool = meilisearchMultiSearch({
      client,
      description: "Search movies and actors",
      queries: [{ indexUid: "movies" }, { indexUid: "actors" }],
    });

    expect(multiSearchTool.description).toBe("Search movies and actors");

    const schema = asSchema(multiSearchTool.inputSchema);
    await expect(schema.validate?.({ q: "frodo" })).resolves.toMatchObject({
      success: true,
      value: { q: "frodo" },
    });
    await expect(schema.validate?.({ q: "" })).resolves.toMatchObject({
      success: false,
    });
    await expect(schema.validate?.({})).resolves.toMatchObject({
      success: false,
    });
  });

  test("builds multiSearch queries from config options and runtime query", async () => {
    const queries = [
      { indexUid: "movies", limit: 5, filter: "genre = fantasy" },
      { indexUid: "actors", limit: 3 },
    ];
    const { client, multiSearch } = createMockClient(
      vi.fn().mockResolvedValue({
        results: [{ hits: [{ id: "m1" }] }, { hits: [{ id: "a1" }] }],
      }),
    );

    const multiSearchTool = meilisearchMultiSearch({
      client,
      description: "Search movies and actors",
      federation: { limit: 10 },
      queries,
    });

    await expect(
      multiSearchTool.execute?.({ q: "frodo" }, executionOptions as never),
    ).resolves.toEqual({
      results: [{ hits: [{ id: "m1" }] }, { hits: [{ id: "a1" }] }],
    });

    expect(multiSearch).toHaveBeenCalledWith({
      federation: { limit: 10 },
      queries: [
        { indexUid: "movies", limit: 5, filter: "genre = fantasy", q: "frodo" },
        { indexUid: "actors", limit: 3, q: "frodo" },
      ],
    });
  });

  test("propagates Meilisearch errors", async () => {
    const { client } = createMockClient(
      vi.fn().mockRejectedValue(new Error("multi-search failed")),
    );

    const multiSearchTool = meilisearchMultiSearch({
      client,
      description: "Search movies and actors",
      queries: [{ indexUid: "movies" }],
    });

    await expect(
      multiSearchTool.execute?.({ q: "frodo" }, executionOptions as never),
    ).rejects.toThrow("multi-search failed");
  });
});

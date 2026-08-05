import { asSchema } from "ai";
import type { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { meilisearchSearch } from "../search.ts";

function createMockClient(search = vi.fn()) {
  return {
    client: {
      index: vi.fn().mockReturnValue({ search }),
    } as unknown as Meilisearch,
    search,
  };
}

const executionOptions = {
  toolCallId: "call-1",
  messages: [],
  context: {},
};

describe("meilisearchSearch", () => {
  test("exposes a query-only validated input contract for the AI", async () => {
    const { client } = createMockClient();

    const searchTool = meilisearchSearch({
      client,
      description: "Search the product catalog",
      indexUid: "products",
    });

    expect(searchTool.description).toBe("Search the product catalog");

    const schema = asSchema(searchTool.inputSchema);
    await expect(schema.validate?.({ q: "shoes" })).resolves.toMatchObject({
      success: true,
      value: { q: "shoes" },
    });
    await expect(schema.validate?.({ q: "" })).resolves.toMatchObject({
      success: false,
    });
    await expect(schema.validate?.({})).resolves.toMatchObject({
      success: false,
    });
  });

  test("searches the configured index with developer-defined search params", async () => {
    const searchParams = {
      hitsPerPage: 12,
      sort: ["popularity:desc"],
    };
    const { client } = createMockClient(
      vi.fn().mockImplementation(async (query: string, options) => {
        return {
          indexUid: "products",
          query,
          options,
          hits: [{ id: "p1" }],
        };
      }),
    );

    const searchTool = meilisearchSearch({
      client,
      description: "Search the product catalog",
      indexUid: "products",
      searchParams,
    });

    await expect(searchTool.execute?.({ q: "shoes" }, executionOptions as never)).resolves.toEqual({
      indexUid: "products",
      query: "shoes",
      options: searchParams,
      hits: [{ id: "p1" }],
    });
  });

  test("propagates Meilisearch client errors", async () => {
    const { client } = createMockClient(vi.fn().mockRejectedValue(new Error("index not found")));

    const searchTool = meilisearchSearch({
      client,
      description: "Search the product catalog",
      indexUid: "products",
    });

    await expect(searchTool.execute?.({ q: "shoes" }, executionOptions as never)).rejects.toThrow(
      "index not found",
    );
  });
});

import { asSchema } from "ai";
import type { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { meilisearchFacetSearch } from "../facet-search.ts";

function createMockClient(searchForFacetValues = vi.fn()) {
  return {
    client: {
      index: vi.fn().mockReturnValue({ searchForFacetValues }),
    } as unknown as Meilisearch,
    searchForFacetValues,
  };
}

const executionOptions = {
  toolCallId: "call-1",
  messages: [],
  context: {},
};

describe("meilisearchFacetSearch", () => {
  test("exposes a validated runtime input contract for facetQuery", async () => {
    const { client } = createMockClient();

    const facetSearchTool = meilisearchFacetSearch({
      client,
      description: "Find matching values for the category facet",
      indexUid: "movies",
      facetName: "category",
    });

    expect(facetSearchTool.description).toBe("Find matching values for the category facet");

    const schema = asSchema(facetSearchTool.inputSchema);
    await expect(schema.validate?.({})).resolves.toMatchObject({
      success: true,
      value: {},
    });
    await expect(schema.validate?.({ facetQuery: "act" })).resolves.toMatchObject({
      success: true,
      value: { facetQuery: "act" },
    });
    await expect(schema.validate?.({ facetQuery: "" })).resolves.toMatchObject({
      success: false,
    });
  });

  test("forwards config facetSearchParams with the runtime facetQuery", async () => {
    const facetSearchParams = {
      filter: "release_year > 2000",
      exhaustiveFacetCount: true,
    };
    const { client, searchForFacetValues } = createMockClient(
      vi.fn().mockResolvedValue({
        facetHits: [{ value: "Action", count: 12 }],
        facetQuery: "act",
        processingTimeMs: 1,
      }),
    );

    const facetSearchTool = meilisearchFacetSearch({
      client,
      description: "Find matching values for the category facet",
      indexUid: "movies",
      facetName: "category",
      facetSearchParams,
    });

    await expect(
      facetSearchTool.execute?.({ facetQuery: "act" }, executionOptions as never),
    ).resolves.toEqual({
      facetHits: [{ value: "Action", count: 12 }],
      facetQuery: "act",
      processingTimeMs: 1,
    });

    expect(searchForFacetValues).toHaveBeenCalledWith({
      filter: "release_year > 2000",
      exhaustiveFacetCount: true,
      facetName: "category",
      facetQuery: "act",
    });

    searchForFacetValues.mockClear();

    await facetSearchTool.execute?.({}, executionOptions as never);

    expect(searchForFacetValues).toHaveBeenCalledWith({
      filter: "release_year > 2000",
      exhaustiveFacetCount: true,
      facetName: "category",
    });
  });

  test("propagates Meilisearch errors", async () => {
    const { client } = createMockClient(
      vi.fn().mockRejectedValue(new Error("invalid facet search facet name")),
    );

    const facetSearchTool = meilisearchFacetSearch({
      client,
      description: "Find matching values for the category facet",
      indexUid: "movies",
      facetName: "category",
    });

    await expect(
      facetSearchTool.execute?.({ facetQuery: "act" }, executionOptions as never),
    ).rejects.toThrow("invalid facet search facet name");
  });
});

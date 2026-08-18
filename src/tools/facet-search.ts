import { tool } from "ai";
import type { Tool } from "ai";
import type { Meilisearch } from "meilisearch";
import { z } from "zod";

import { resolveClient } from "./resolve-client.ts";
import type { FacetSearchToolOptions } from "./types.ts";

type FacetSearchResult = Awaited<
  ReturnType<ReturnType<Meilisearch["index"]>["searchForFacetValues"]>
>;
type FacetSearchTool = Tool<{ facetQuery?: string }, FacetSearchResult>;

/**
 * Search for facet values
 *
 * @param options - Facet search tool options
 * @returns AI SDK tool that runs a Meilisearch facet-search query
 * @see {@link https://www.meilisearch.com/docs/reference/api/facet-search/search-for-facet-values}
 */
export function meilisearchFacetSearch(options: FacetSearchToolOptions): FacetSearchTool {
  const client = resolveClient(options);
  const { description, indexUid, facetName, facetSearchParams } = options;

  return tool({
    description,
    inputSchema: z.object({
      facetQuery: z
        .string()
        .min(1)
        .max(500)
        .optional()
        .describe("Partial facet value to match. Omit to list values."),
    }),
    execute: async ({ facetQuery }) => {
      return client.index(indexUid).searchForFacetValues({
        ...facetSearchParams,
        facetName,
        ...(facetQuery !== undefined ? { facetQuery } : {}),
      });
    },
  });
}

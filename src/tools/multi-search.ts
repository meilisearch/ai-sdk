import { tool } from "ai";
import type { Tool } from "ai";
import type { MultiSearchResponse, SearchResponse } from "meilisearch";
import { z } from "zod";

import { resolveClient } from "./resolve-client.ts";
import type { MultiSearchToolOptions } from "./types.ts";

type MultiSearchResult = MultiSearchResponse | SearchResponse;
type MultiSearchTool = Tool<{ q: string }, MultiSearchResult>;

/**
 * Search across multiple indexes in one request
 *
 * @param options - Multi-search tool options
 * @returns AI SDK tool that runs a Meilisearch multi-search query
 * @see {@link https://www.meilisearch.com/docs/reference/api/multi-search/perform-a-multi-search}
 */
export function meilisearchMultiSearch(options: MultiSearchToolOptions): MultiSearchTool {
  const client = resolveClient(options);
  const { description, queries, federation } = options;

  return tool({
    description,
    inputSchema: z.object({
      q: z
        .string()
        .min(1)
        .max(500)
        .describe("The search query to look up across the configured Meilisearch indexes"),
    }),
    execute: async ({ q }): Promise<MultiSearchResult> => {
      const queriesWithQ = queries.map((query) => ({ ...query, q }));

      if (federation !== undefined) {
        return client.multiSearch({ federation, queries: queriesWithQ });
      }

      return client.multiSearch({ queries: queriesWithQ });
    },
  });
}

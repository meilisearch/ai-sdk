import { tool } from "ai";
import type { Tool } from "ai";
import type { MultiSearchResponse, SearchResponse } from "meilisearch";
import { z } from "zod";

import type { MultiSearchToolOptions } from "./types.ts";

type MultiSearchResult = MultiSearchResponse | SearchResponse;
type MultiSearchTool = Tool<{ q: string }, MultiSearchResult>;

export function meilisearchMultiSearch(options: MultiSearchToolOptions): MultiSearchTool {
  const { client, description, queries, federation } = options;

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

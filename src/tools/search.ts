import { tool } from "ai";
import type { Tool } from "ai";
import type { Meilisearch } from "meilisearch";
import { z } from "zod";

import { resolveClient } from "./resolve-client.ts";
import type { SearchToolOptions } from "./types.ts";

type SearchResult = Awaited<ReturnType<ReturnType<Meilisearch["index"]>["search"]>>;
type SearchTool = Tool<{ q: string }, SearchResult>;

/**
 * Search documents in an index
 *
 * @param options - Search tool options
 * @returns AI SDK tool that runs a Meilisearch search query
 * @see {@link https://www.meilisearch.com/docs/reference/api/search/search-with-post.md}
 */
export function meilisearchSearch(options: SearchToolOptions): SearchTool {
  const client = resolveClient(options);
  const { description, indexUid, searchParams } = options;

  return tool({
    description,
    inputSchema: z.object({
      q: z
        .string()
        .min(1)
        .max(500)
        .describe("The search query to look up in the Meilisearch index"),
    }),
    execute: async ({ q }) => {
      return client.index(indexUid).search(q, searchParams);
    },
  });
}

import { tool } from "ai";
import type { Tool } from "ai";
import { z } from "zod";

import type { SearchToolOptions } from "./types.ts";

type SearchResult = Awaited<ReturnType<ReturnType<SearchToolOptions["client"]["index"]>["search"]>>;
type SearchTool = Tool<{ q: string }, SearchResult>;

export function meilisearchSearch(options: SearchToolOptions): SearchTool {
  const { client, description, indexUid, searchParams } = options;

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

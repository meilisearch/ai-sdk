import { tool } from "ai";
import type { Tool } from "ai";
import { z } from "zod";

import type { MeilisearchSearchToolOptions } from "./types.ts";

type MeilisearchSearchResult = Awaited<
  ReturnType<ReturnType<MeilisearchSearchToolOptions["client"]["index"]>["search"]>
>;
type MeilisearchSearchTool = Tool<{ q: string }, MeilisearchSearchResult>;

export function meilisearchSearch(options: MeilisearchSearchToolOptions): MeilisearchSearchTool {
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

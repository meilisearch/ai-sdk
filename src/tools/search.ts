import { tool } from "ai";
import { z } from "zod";

import type { MeilisearchSearchToolOptions } from "./types.ts";

export function meilisearchSearch(options: MeilisearchSearchToolOptions) {
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

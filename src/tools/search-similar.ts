import { tool } from "ai";
import type { Tool } from "ai";
import type { Meilisearch } from "meilisearch";
import { z } from "zod";

import { resolveClient } from "./resolve-client.ts";
import type { SearchSimilarToolOptions } from "./types.ts";

type SearchSimilarResult = Awaited<
  ReturnType<ReturnType<Meilisearch["index"]>["searchSimilarDocuments"]>
>;
type SearchSimilarTool = Tool<{ id: string | number }, SearchSimilarResult>;

/**
 * Get documents similar to a reference document
 *
 * @param options - Search-similar tool options
 * @returns AI SDK tool that runs a Meilisearch similar-documents query
 * @see {@link https://www.meilisearch.com/docs/reference/api/similar-documents/get-similar-documents-with-post}
 */
export function meilisearchSearchSimilar(options: SearchSimilarToolOptions): SearchSimilarTool {
  const client = resolveClient(options);
  const { description, indexUid, searchSimilarParams } = options;

  return tool({
    description,
    inputSchema: z.object({
      id: z
        .union([z.string().min(1), z.number()])
        .describe("The document id to find similar documents for"),
    }),
    execute: async ({ id }) => {
      return client.index(indexUid).searchSimilarDocuments({
        id,
        ...searchSimilarParams,
      });
    },
  });
}

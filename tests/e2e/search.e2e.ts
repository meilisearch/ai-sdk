import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Meilisearch } from "meilisearch";
import { describe, expect, it } from "vite-plus/test";

import { meilisearchSearch } from "../../src/tools/search.ts";
import { expectToolCallInput, expectToolCalled } from "./utils/assert-tool-calls.ts";
import { withLogging } from "./utils/logging.ts";

const { OPENAI_API_KEY, MEILISEARCH_HOST, MEILISEARCH_API_KEY, MEILISEARCH_INDEX } = process.env;

describe.skipIf(!OPENAI_API_KEY || !MEILISEARCH_HOST || !MEILISEARCH_API_KEY || !MEILISEARCH_INDEX)(
  "meilisearchSearch e2e",
  () => {
    it("uses the search tool via generateText", async () => {
      const client = new Meilisearch({
        host: MEILISEARCH_HOST!,
        apiKey: MEILISEARCH_API_KEY,
      });

      const search = meilisearchSearch({
        client,
        indexUid: MEILISEARCH_INDEX!,
        description: "Search movies by title or synopsis",
      });

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: "Search for Lord of the Rings movies and summarize briefly what you find.",
        tools: { search },
        stopWhen: stepCountIs(3),
        ...withLogging(),
      });

      expectToolCalled(result, "search");
      expectToolCallInput(result, "search", { q: expect.any(String) });
      expect(result.toolResults.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    }, 60_000);
  },
);

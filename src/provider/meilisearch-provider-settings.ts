import type { LanguageModelV4, ProviderV4 } from "@ai-sdk/provider";
import type { Meilisearch } from "meilisearch";

import type { meilisearchChatTools } from "../tools/chat-tools.ts";

export type MeilisearchProviderSettings = {
  workspace: string;
  host?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  client?: Meilisearch;
};

export type MeilisearchProvider = ProviderV4 &
  ((modelId: string) => LanguageModelV4) & {
    chat(modelId: string): LanguageModelV4;
    chatTools: typeof meilisearchChatTools;
  };

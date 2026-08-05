import { Meilisearch } from "meilisearch";

import { meilisearchChatTools } from "../tools/chat-tools.ts";
import { MeilisearchChatLanguageModel } from "./meilisearch-chat-language-model.ts";
import type {
  MeilisearchProvider,
  MeilisearchProviderSettings,
} from "./meilisearch-provider-settings.ts";

function resolveHost(host?: string): string | undefined {
  return host ?? process.env.MEILISEARCH_HOST ?? process.env.MEILISEARCH_URL;
}

function resolveApiKey(apiKey?: string): string | undefined {
  return apiKey ?? process.env.MEILISEARCH_API_KEY;
}

export function createMeilisearch(settings: MeilisearchProviderSettings): MeilisearchProvider {
  const { workspace, client, headers } = settings;

  if (workspace == null || !workspace.trim()) {
    throw new Error("A non-empty Meilisearch chat workspace is required.");
  }

  const resolvedHost = resolveHost(settings.host);
  const resolvedApiKey = resolveApiKey(settings.apiKey);

  if (client == null && resolvedHost == null) {
    throw new Error(
      "A Meilisearch host is required (`host` or `MEILISEARCH_HOST`/`MEILISEARCH_URL`).",
    );
  }

  if (client == null && resolvedApiKey == null) {
    throw new Error("A Meilisearch API key is required (`apiKey` or `MEILISEARCH_API_KEY`).");
  }

  const resolvedClient =
    client ??
    new Meilisearch({
      host: resolvedHost!,
      apiKey: resolvedApiKey,
      requestInit: headers == null ? undefined : { headers },
    });

  const createLanguageModel = (modelId: string) =>
    new MeilisearchChatLanguageModel(modelId, {
      client: resolvedClient,
      workspace,
    });

  const provider = Object.assign((modelId: string) => createLanguageModel(modelId), {
    specificationVersion: "v4" as const,
    languageModel: createLanguageModel,
    chat: createLanguageModel,
    embeddingModel: () => {
      throw new Error("Meilisearch does not provide an embedding model through this provider.");
    },
    imageModel: () => {
      throw new Error("Meilisearch does not provide an image model through this provider.");
    },
    chatTools: meilisearchChatTools,
  }) as unknown as MeilisearchProvider;

  return provider;
}

function createDefaultMeilisearchProvider(): MeilisearchProvider {
  return createMeilisearch({
    workspace: process.env.MEILISEARCH_WORKSPACE ?? "cloud",
  });
}

export const meilisearch = Object.assign(
  (modelId: string) => createDefaultMeilisearchProvider()(modelId),
  {
    specificationVersion: "v4" as const,
    languageModel: (modelId: string) => createDefaultMeilisearchProvider().languageModel(modelId),
    chat: (modelId: string) => createDefaultMeilisearchProvider().chat(modelId),
    embeddingModel: (modelId: string) => createDefaultMeilisearchProvider().embeddingModel(modelId),
    imageModel: (modelId: string) => createDefaultMeilisearchProvider().imageModel(modelId),
    chatTools: meilisearchChatTools,
  },
) as unknown as MeilisearchProvider;

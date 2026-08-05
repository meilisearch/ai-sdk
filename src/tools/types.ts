import type { Meilisearch } from "meilisearch";

export type MeilisearchToolClientOptions = {
  client: Meilisearch;
  description: string;
};

export type MeilisearchIndexToolOptions = MeilisearchToolClientOptions & {
  indexUid: string;
  filterableAttributes?: string[];
};

export type MeilisearchMultiSearchToolOptions = MeilisearchToolClientOptions & {
  indexes: string[];
};

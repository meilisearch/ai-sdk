import type { Meilisearch, SearchParams } from "meilisearch";

export type MeilisearchToolClientOptions = {
  client: Meilisearch;
  description: string;
};

export type MeilisearchIndexToolOptions = MeilisearchToolClientOptions & {
  indexUid: string;
};

export type MeilisearchSearchToolOptions = MeilisearchIndexToolOptions & {
  searchParams?: Omit<SearchParams, "q">;
};

export type MeilisearchMultiSearchToolOptions = MeilisearchToolClientOptions & {
  indexes: string[];
};

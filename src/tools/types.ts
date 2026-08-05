import type { Meilisearch, SearchParams } from "meilisearch";

export type ToolClientOptions = {
  client: Meilisearch;
  description: string;
};

export type IndexToolOptions = ToolClientOptions & {
  indexUid: string;
};

export type SearchToolOptions = IndexToolOptions & {
  searchParams?: Omit<SearchParams, "q">;
};

export type MultiSearchToolOptions = ToolClientOptions & {
  indexes: string[];
};

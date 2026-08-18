import type {
  Meilisearch,
  MultiSearchFederation,
  MultiSearchQuery,
  MultiSearchQueryWithFederation,
  SearchForFacetValuesParams,
  SearchParams,
  SearchSimilarDocumentsParams,
} from "meilisearch";

type ToolConnectionOptions =
  | {
      client: Meilisearch;
    }
  | {
      host: string;
      apiKey?: string;
    };

export type ToolClientOptions = ToolConnectionOptions & {
  description: string;
};

export type IndexToolOptions = ToolClientOptions & {
  indexUid: string;
};

export type SearchToolOptions = IndexToolOptions & {
  searchParams?: Omit<SearchParams, "q">;
};

export type MultiSearchToolOptions = ToolClientOptions & {
  queries: Array<Omit<MultiSearchQuery | MultiSearchQueryWithFederation, "q">>;
  federation?: MultiSearchFederation;
};

export type SearchSimilarToolOptions = IndexToolOptions & {
  searchSimilarParams?: Omit<SearchSimilarDocumentsParams, "id">;
};

export type FacetSearchToolOptions = IndexToolOptions & {
  facetName: string;
  facetSearchParams?: Omit<SearchForFacetValuesParams, "facetName" | "facetQuery">;
};

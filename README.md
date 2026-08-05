# Meilisearch AI SDK

Meilisearch is a search engine for user-facing search and AI retrieval.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Setup](#setup)
- [Example](#example)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Installation

## Quick Start

## Setup

## Example

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { meilisearchSearch } from "@meilisearch/ai-sdk";

const { text } = await generateText({
  model: openai("gpt-4o"),
  system:
    "You are a movie assistant. Recommend films and where to stream them using the search tool.",
  tools: {
    search: meilisearchSearch({
      host: "MEILISEARCH_HOST",
      apiKey: "YOUR_SEARCH_API_KEY",
      indexUid: "movies",
      description: "Search movies by title or synopsis",
    }),
  },
});
```

## API Reference

### Search tool

```ts
meilisearchSearch({
  // Connect with host + API key
  host: "MEILISEARCH_HOST",
  apiKey: "YOUR_SEARCH_API_KEY",
  // or reuse an existing Meilisearch client instance
  // client,

  description: "Search movies by title or synopsis",

  // Search target
  indexUid: "movies",

  // Optional SearchParams (except q, provided at runtime by the tool call)
  searchParams: {
    limit: 10,
    filter: "genre = fantasy",
    sort: ["release_date:desc"],
  },
});
```

For more details, see the [Search API reference](https://www.meilisearch.com/docs/reference/api/search/search-with-post.md).

### Multi-search tool

```ts
meilisearchMultiSearch({
  // Connect with host + API key
  host: "MEILISEARCH_HOST",
  apiKey: "YOUR_SEARCH_API_KEY",
  // or reuse an existing Meilisearch client instance
  // client,

  description: "Search movies and actors",

  // Required per-index queries (q is injected at runtime)
  queries: [
    { indexUid: "movies", limit: 5 },
    { indexUid: "actors", limit: 3 },
  ],

  // Optional federation config
  federation: {
    limit: 10,
  },
});
```

For more details, see the [Multi-search API reference](https://www.meilisearch.com/docs/reference/api/multi-search/perform-a-multi-search.md).

### Search similar tool

```ts
meilisearchSearchSimilar({
  // Connect with host + API key
  host: "MEILISEARCH_HOST",
  apiKey: "YOUR_SEARCH_API_KEY",
  // or reuse an existing Meilisearch client instance
  // client,

  description: "Find similar movies",

  // Search target
  indexUid: "movies",

  // Optional similar-documents params (except id, provided at runtime)
  searchSimilarParams: {
    embedder: "default",
    limit: 5,
  },
});
```

For more details, see the [Similar documents API reference](https://www.meilisearch.com/docs/reference/api/similar-documents/get-similar-documents-with-post.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT

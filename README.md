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
import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Meilisearch, meilisearchSearch } from "@meilisearch/ai-sdk";

const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "Search for Lord of the Rings movies and summarize briefly what you find.",
  tools: {
    search: meilisearchSearch({
      client: new Meilisearch({
        host: process.env.MEILISEARCH_HOST!,
        apiKey: process.env.MEILISEARCH_API_KEY,
      }),
      indexUid: process.env.MEILISEARCH_INDEX!,
      description: "Search movies by title or synopsis",
    }),
  },
  stopWhen: stepCountIs(3),
});

console.log(text);
```

## API Reference

Search tool:

```ts
meilisearchSearch({
  // Base options
  client, // Meilisearch client instance
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

For more details, see the [Meilisearch API reference](https://www.meilisearch.com/docs/reference/api/search/search-with-post.md).

Multi-search tool:

```ts
meilisearchMultiSearch({
  // Base options
  client, // Meilisearch client instance
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

For more details, see the [Meilisearch API reference](https://www.meilisearch.com/docs/reference/api/multi-search/perform-a-multi-search.md).

Search similar tool:

```ts
meilisearchSearchSimilar({
  // Base options
  client, // Meilisearch client instance
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

For more details, see the [Meilisearch API reference](https://www.meilisearch.com/docs/reference/api/similar-documents/get-similar-documents-with-post.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT

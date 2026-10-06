<p align="center">
  <a href="https://www.meilisearch.com/?utm_campaign=oss&utm_source=github&utm_medium=ai-sdk&utm_content=logo#gh-light-mode-only" target="_blank">
    <img src="https://github.com/meilisearch/meilisearch/blob/main/assets/meilisearch-logo-light.svg?sanitize=true#gh-light-mode-only">
  </a>
  <a href="https://www.meilisearch.com/?utm_campaign=oss&utm_source=github&utm_medium=ai-sdk&utm_content=logo#gh-dark-mode-only" target="_blank">
    <img src="https://github.com/meilisearch/meilisearch/blob/main/assets/meilisearch-logo-dark.svg?sanitize=true#gh-dark-mode-only">
  </a>
</p>

<h4 align="center">
  <a href="https://www.meilisearch.com/?utm_campaign=oss&utm_source=github&utm_medium=ai-sdk&utm_content=nav">Website</a> |
  <a href="https://www.meilisearch.com/docs?utm_campaign=oss&utm_source=github&utm_medium=ai-sdk&utm_content=nav">Documentation</a> |
  <a href="https://discord.meilisearch.com/?utm_campaign=oss&utm_source=github&utm_medium=ai-sdk&utm_content=nav">Discord</a>
</h4>

# Meilisearch AI SDK

Meilisearch is a search engine for user-facing search and AI retrieval. This library provides search tools to integrate with the [Vercel AI SDK](https://ai-sdk.dev).

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Setup](#setup)
- [Example](#example)
- [Using Meilisearch MCP](#using-meilisearch-mcp)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install @meilisearch/ai-sdk
```

## Quick Start

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { meilisearchSearch } from "@meilisearch/ai-sdk";

const { text } = await generateText({
  model: openai("gpt-5.4-mini"),
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

console.log(text);
```

## Setup

1. Create a project on [Meilisearch Cloud](https://cloud.meilisearch.com/register) or [self-host](https://www.meilisearch.com/docs/resources/self_hosting/getting_started/quick_start)
2. Create a `movies` index and [add documents](https://www.meilisearch.com/docs/resources/self_hosting/getting_started/quick_start#add-documents)
3. Add your host and API key to `.env`:

```bash
MEILISEARCH_HOST=https://your-project.meilisearch.io
MEILISEARCH_API_KEY=your-search-api-key
```

## Example

Hybrid search with filters, sorting:

```ts
const { text } = await generateText({
  model: openai("gpt-5.4-mini"),
  system: "You are a movie assistant. Recommend films using the search tool.",
  prompt: "Recommend recent action movies about revenge",
  tools: {
    search: meilisearchSearch({
      host: "MEILISEARCH_HOST",
      apiKey: "YOUR_SEARCH_API_KEY",
      indexUid: "movies",
      description: "Search movies by title or synopsis",
      searchParams: {
        limit: 10,
        sort: ["release_date:desc"],
        hybrid: {
          embedder: "default",
          semanticRatio: 0.5,
        },
      },
    }),
  },
});

console.log(text);
```

## Using Meilisearch MCP

You can also connect your agent to the **Meilisearch MCP server**. The AI SDK can wrap tools from MCP servers and expose them like any other tool.

```bash
npm install @ai-sdk/mcp
```

```ts
import { createMCPClient } from "@ai-sdk/mcp";
import { generateText, isStepCount } from "ai";
import { openai } from "@ai-sdk/openai";

const mcpClient = await createMCPClient({
  transport: {
    type: "http",
    url: "https://your-project.meilisearch.io/mcp",
    headers: { Authorization: "Bearer YOUR_API_KEY" },
  },
});

try {
  const tools = await mcpClient.tools();

  const { text } = await generateText({
    model: openai("gpt-5.4-mini"),
    tools,
    // Allow several steps: list indexes, describe, search, then answer
    stopWhen: isStepCount(5),
    prompt: "Recommend recent action movies about revenge",
  });

  console.log(text);
} finally {
  await mcpClient.close();
}
```

For the list of available tools, limitations, and troubleshooting, see the [Meilisearch MCP documentation](https://www.meilisearch.com/docs/getting_started/integrations/mcp).

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
    filter: "genres = Action",
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

  description: "Find similar movies by document ID",

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

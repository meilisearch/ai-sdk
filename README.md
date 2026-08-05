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

```bash
pnpm add @meilisearch/ai-sdk meilisearch ai zod
```

## Quick Start

### Chat completions (LanguageModelV4 provider)

```ts
import { streamText } from "ai";
import { createMeilisearch } from "@meilisearch/ai-sdk";

const meilisearch = createMeilisearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
  workspace: "cloud",
});

const result = streamText({
  model: meilisearch("gpt-4o-mini"),
  messages: [{ role: "user", content: "What is Meilisearch?" }],
  tools: meilisearch.chatTools.all,
});

for await (const text of result.textStream) {
  process.stdout.write(text);
}
```

The chat endpoint is streaming-only (`stream: true`). The `_meiliAppendConversationMessage` tool is exposed, but message-history appending remains app-managed.

## Setup

## Example

```ts
import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Meilisearch } from "meilisearch";
import { meilisearchSearch } from "@meilisearch/ai-sdk";

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

Provider:

```ts
createMeilisearch({
  host: "http://localhost:7700",
  apiKey: "masterKey",
  workspace: "cloud",
});
```

Chat tools:

```ts
meilisearch.chatTools.progress;
meilisearch.chatTools.sources;
meilisearch.chatTools.appendMessage;
meilisearch.chatTools.all;
```

For chat docs and schema expectations, see:

- [Chat completions API](https://www.meilisearch.com/docs/reference/api/chats/request-a-chat-completion)
- [Chat tooling reference](https://www.meilisearch.com/docs/capabilities/conversational_search/advanced/chat_tooling_reference)

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

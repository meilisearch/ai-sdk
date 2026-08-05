# HANDOFF: `meilisearch-js` follow-up for chat provider

## Context

This package (`@meilisearch/ai-sdk`) now ships a `LanguageModelV4` provider that uses:

- `client.chat(workspace).streamCompletion(...)`
- Meilisearch chat tools (`_meiliSearchProgress`, `_meiliSearchSources`, `_meiliAppendConversationMessage`)

Runtime behavior works, but `meilisearch-js@0.60` is incomplete for chat-route consumers:

1. `ChatCompletionRequest` typings omit docs-backed fields (`tools`, richer messages, `tool_choice`, etc.).
2. The three Meilisearch-specific chat tool definitions currently live in this AI SDK package, even though they are **not** Vercel-AI-SDK-specific. Any client talking to `/chats/{workspace}/chat/completions` needs them.

## Upstream goal (`meilisearch-js`)

Make chat-route usage first-class in `meilisearch-js` so integrators do **not** need local request extensions/casts **or** duplicated tool schema definitions.

## Required upstream changes

### 1. Expand chat completion request typing

Update `ChatCompletionRequest` (and related chat message/tool types) so `streamCompletion` accepts the documented OpenAI-compatible request shape used by `/chats/{workspace}/chat/completions`.

Minimum additions:

- `tools` (function tools with `name`, `description`, `parameters`, optional `strict`)
- `tool_choice` (`auto`/`none`/`required`/specific function)
- richer `messages` variants needed for OpenAI-compatible tool-call histories:
  - assistant messages with `tool_calls`
  - tool messages with `tool_call_id`
- keep `stream: true` semantics explicit

The transport should remain:

- `client.chat(workspace).streamCompletion(request)`

No separate raw HTTP path is desired for this.

### 2. Own the Meilisearch chat tool definitions

Export the three Meilisearch-intercepted chat tools as **framework-agnostic OpenAI-compatible tool definitions** from `meilisearch-js`.

These tools are part of the chat-route contract ([chat tooling reference](https://www.meilisearch.com/docs/capabilities/conversational_search/advanced/chat_tooling_reference)). They are intercepted server-side by Meilisearch and are never forwarded to the LLM provider. Every chat-route client (OpenAI SDK, raw fetch, Vercel AI SDK, etc.) needs the same schemas.

Suggested public surface (names can be adjusted to match JS SDK conventions):

```ts
import { meilisearchChatTools } from "meilisearch";

await client.chat("cloud").streamCompletion({
  model: "gpt-4o-mini",
  stream: true,
  messages,
  tools: meilisearchChatTools.all, // or Object.values(...)
});
```

Export at least:

| Export          | Tool name                         | Purpose                                           |
| --------------- | --------------------------------- | ------------------------------------------------- |
| `progress`      | `_meiliSearchProgress`            | Real-time search progress                         |
| `sources`       | `_meiliSearchSources`             | Source documents used for the answer              |
| `appendMessage` | `_meiliAppendConversationMessage` | Client must append internal conversation messages |
| `all`           | all three                         | Ready-to-send OpenAI `tools[]` array / keyed map  |

Each tool must match the docs schemas exactly:

- descriptions from the docs
- `parameters` with the documented `properties` / `required` / `additionalProperties: false`
- `strict: true` where documented

Keep these as **plain OpenAI tool objects** (`{ type: "function", function: { name, description, parameters, strict } }`), not Vercel AI SDK `tool()` wrappers. Framework adapters belong in consumer packages.

Reference schemas live in:

- https://www.meilisearch.com/docs/capabilities/conversational_search/advanced/chat_tooling_reference
- https://www.meilisearch.com/docs/capabilities/conversational_search/getting_started/chat

Current temporary copies in this repo (to be replaced after upstream lands):

- `src/tools/chat-tools.ts`

## Upstream validation/tests

Add/update `meilisearch-js` tests that prove:

1. `streamCompletion` accepts request objects containing `tools`
2. `streamCompletion` accepts assistant tool-call and tool-result history message shapes
3. typing remains strict for unsupported/invalid payloads
4. streaming-only contract is preserved
5. exported chat tool definitions have the exact `_meili*` names and required parameter schemas
6. `all` includes all three tools and can be passed into `streamCompletion({ tools: ... })`

## Expected usage after upstream fix

```ts
import { Meilisearch, meilisearchChatTools } from "meilisearch";

const client = new Meilisearch({ host, apiKey });

await client.chat("cloud").streamCompletion({
  model: "gpt-4o-mini",
  stream: true,
  messages,
  tools: Object.values(meilisearchChatTools.all), // or whatever shape the SDK exports
  tool_choice: "auto",
});
```

## Delivery back to this repo

When the `meilisearch-js` branch is ready, share:

- branch name
- commit SHA
- summary of type/API deltas
- chat-tools export path and shape (`all` as array vs keyed object)
- any behavior changes beyond typing

## Local branch adoption in this repo (before npm publish)

Use the local `meilisearch-js` branch in this SDK immediately, before upstream publish:

1. Check out the target branch in your local `meilisearch-js` clone.
2. In this repo, point dependency to local branch/worktree (example):
   - `pnpm add meilisearch@link:../meilisearch-js`
3. Run:
   - `vp test`
   - `vp check`
4. Confirm provider tests pass with the local `meilisearch-js` branch.

## Cleanup tasks in this repo after branch adoption

Once local branch is consumed and types/tools are available:

1. Remove/trim temporary local compatibility typing in `src/provider/meilisearch-chat-language-model.ts` where possible.
2. Replace broad casts around `streamCompletion` request body with upstream `meilisearch-js` chat request types.
3. Rewrite `src/tools/chat-tools.ts` as a thin Vercel AI SDK adapter:
   - import OpenAI tool definitions / schemas from `meilisearch`
   - wrap them with `ai`'s `tool()` (no `execute`)
   - keep the public ergonomics (`progress` / `sources` / `appendMessage` / `all` with `_meili*` keys)
4. Keep behavior tests; only adapt imports/assertions as needed.
5. Re-run `vp test` and `vp check`.

## Notes

- Upstream owns the **chat-route contract** (request types + Meilisearch tool definitions).
- This package owns the **Vercel AI SDK adapter** (LanguageModelV4 provider + `tool()` wrappers).
- Do not change this package's external chat provider API as part of the upstream SDK task beyond swapping the source of truth for chat tool schemas.

# HANDOFF: `meilisearch-js` follow-up for chat provider

## Context

This package (`@meilisearch/ai-sdk`) now ships a `LanguageModelV4` provider that uses:

- `client.chat(workspace).streamCompletion(...)`
- Meilisearch chat tools (`_meiliSearchProgress`, `_meiliSearchSources`, `_meiliAppendConversationMessage`)

Runtime behavior works, but `meilisearch-js@0.60` chat request typings are narrower than the documented chat route.

## Upstream goal (`meilisearch-js`)

Make chat-route usage first-class in `meilisearch-js` typing/API surface so integrators do **not** need local request extensions/casts.

## Required upstream changes

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

## Upstream validation/tests

Add/update `meilisearch-js` tests that prove:

1. `streamCompletion` accepts request objects containing `tools`
2. `streamCompletion` accepts assistant tool-call and tool-result history message shapes
3. typing remains strict for unsupported/invalid payloads
4. streaming-only contract is preserved

## Expected usage after upstream fix

```ts
await client.chat("cloud").streamCompletion({
  model: "gpt-4o-mini",
  stream: true,
  messages,
  tools,
  tool_choice: "auto",
});
```

## Delivery back to this repo

When the `meilisearch-js` branch is ready, share:

- branch name
- commit SHA
- summary of type/API deltas
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

Once local branch is consumed and types are available:

1. Remove/trim temporary local compatibility typing in `src/provider/meilisearch-chat-language-model.ts` where possible.
2. Replace broad casts around `streamCompletion` request body with upstream `meilisearch-js` chat request types.
3. Keep behavior tests unchanged; only adapt assertions/types as needed.
4. Re-run `vp test` and `vp check`.

## Notes

- This handoff is intentionally type/API-focused.
- Do not change the chat provider’s external API in this repo as part of the upstream SDK task.

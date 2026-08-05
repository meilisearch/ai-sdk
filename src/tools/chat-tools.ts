import { tool } from "ai";
import { z } from "zod";

/**
 * Temporary local copies of Meilisearch chat-route tool schemas.
 *
 * Source of truth should move to `meilisearch-js` (see HANDOFF.md). After that
 * lands, this module should become a thin AI SDK `tool()` adapter over the SDK
 * exports rather than owning the schemas itself.
 */
const meiliToolCallSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    function: z
      .object({
        name: z.string(),
        arguments: z.string(),
      })
      .strict(),
  })
  .strict();

const meiliSearchProgress = tool({
  description: "Provides information about the current Meilisearch search operation",
  inputSchema: z
    .object({
      call_id: z.string(),
      function_name: z.string(),
      function_parameters: z.string(),
    })
    .strict(),
});

const meiliSearchSources = tool({
  description: "Provides sources of the search",
  inputSchema: z
    .object({
      call_id: z.string(),
      documents: z.array(z.object({}).passthrough()),
    })
    .strict(),
});

const meiliAppendConversationMessage = tool({
  description: "Append a new message to the conversation based on what happened internally",
  inputSchema: z
    .object({
      role: z.string(),
      content: z.string(),
      tool_calls: z.array(meiliToolCallSchema).nullable(),
      tool_call_id: z.string().nullable(),
    })
    .strict(),
});

export const meilisearchChatTools = {
  progress: meiliSearchProgress,
  sources: meiliSearchSources,
  appendMessage: meiliAppendConversationMessage,
  all: {
    _meiliSearchProgress: meiliSearchProgress,
    _meiliSearchSources: meiliSearchSources,
    _meiliAppendConversationMessage: meiliAppendConversationMessage,
  },
} as const;

import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamResult,
  SharedV4Warning,
} from "@ai-sdk/provider";
import type { Meilisearch } from "meilisearch";

import {
  convertToMeilisearchMessages,
  type MeilisearchChatMessage,
} from "./convert-to-meilisearch-messages.ts";
import { parseChatCompletionSse } from "./parse-chat-completion-sse.ts";

type MeilisearchChatLanguageModelSettings = {
  client: Meilisearch;
  workspace: string;
};

type MeilisearchFunctionTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
};

type MeilisearchChatCompletionRequest = {
  model: string;
  stream: true;
  messages: MeilisearchChatMessage[];
  tools?: MeilisearchFunctionTool[];
  tool_choice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  seed?: number;
};

function prepareTools(tools: LanguageModelV4CallOptions["tools"]): {
  tools?: MeilisearchFunctionTool[];
  warnings: SharedV4Warning[];
} {
  if (tools == null) {
    return { warnings: [] };
  }

  const warnings: SharedV4Warning[] = [];
  const preparedTools: MeilisearchFunctionTool[] = [];

  for (const tool of tools) {
    if (tool.type !== "function") {
      warnings.push({
        type: "other",
        message: `Unsupported non-function tool type: ${tool.type}`,
      });
      continue;
    }

    preparedTools.push({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema as Record<string, unknown>,
        strict: tool.strict,
      },
    });
  }

  return {
    tools: preparedTools.length > 0 ? preparedTools : undefined,
    warnings,
  };
}

function prepareToolChoice(
  toolChoice: LanguageModelV4CallOptions["toolChoice"],
): MeilisearchChatCompletionRequest["tool_choice"] {
  if (toolChoice == null) {
    return undefined;
  }

  if (toolChoice.type === "tool") {
    return {
      type: "function",
      function: {
        name: toolChoice.toolName,
      },
    };
  }

  return toolChoice.type;
}

function createChatCompletionBody(
  modelId: string,
  options: LanguageModelV4CallOptions,
): { body: MeilisearchChatCompletionRequest; warnings: SharedV4Warning[] } {
  const { tools, warnings } = prepareTools(options.tools);

  return {
    body: {
      model: modelId,
      stream: true,
      messages: convertToMeilisearchMessages(options.prompt),
      ...(tools == null ? {} : { tools }),
      ...(options.toolChoice == null ? {} : { tool_choice: prepareToolChoice(options.toolChoice) }),
      ...(options.maxOutputTokens == null ? {} : { max_tokens: options.maxOutputTokens }),
      ...(options.temperature == null ? {} : { temperature: options.temperature }),
      ...(options.topP == null ? {} : { top_p: options.topP }),
      ...(options.frequencyPenalty == null ? {} : { frequency_penalty: options.frequencyPenalty }),
      ...(options.presencePenalty == null ? {} : { presence_penalty: options.presencePenalty }),
      ...(options.stopSequences == null ? {} : { stop: options.stopSequences }),
      ...(options.seed == null ? {} : { seed: options.seed }),
    },
    warnings,
  };
}

export class MeilisearchChatLanguageModel implements LanguageModelV4 {
  readonly specificationVersion = "v4" as const;
  readonly provider = "meilisearch.chat";
  readonly supportedUrls = {};

  constructor(
    readonly modelId: string,
    readonly settings: MeilisearchChatLanguageModelSettings,
  ) {}

  async doGenerate(_options: LanguageModelV4CallOptions): Promise<LanguageModelV4GenerateResult> {
    throw new Error("Meilisearch chat completions only support streaming (`stream: true`).");
  }

  async doStream(options: LanguageModelV4CallOptions): Promise<LanguageModelV4StreamResult> {
    const { body, warnings } = createChatCompletionBody(this.modelId, options);
    const responseStream = await this.settings.client
      .chat(this.settings.workspace)
      .streamCompletion(body as never);

    return {
      stream: parseChatCompletionSse({
        stream: responseStream,
        warnings,
      }),
      request: {
        body,
      },
    };
  }
}

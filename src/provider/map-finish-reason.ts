import type { LanguageModelV4FinishReason } from "@ai-sdk/provider";

export function mapFinishReason(rawReason: string | null | undefined): LanguageModelV4FinishReason {
  switch (rawReason) {
    case "stop":
      return { unified: "stop", raw: rawReason };
    case "length":
      return { unified: "length", raw: rawReason };
    case "content_filter":
      return { unified: "content-filter", raw: rawReason };
    case "tool_calls":
      return { unified: "tool-calls", raw: rawReason };
    default:
      return { unified: "other", raw: rawReason ?? undefined };
  }
}

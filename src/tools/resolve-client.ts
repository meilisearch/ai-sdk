import { Meilisearch } from "meilisearch";

import type { ToolClientOptions } from "./types.ts";

/**
 * Resolve a Meilisearch client from either an existing client or host/apiKey.
 */
export function resolveClient(options: ToolClientOptions): Meilisearch {
  if ("client" in options && options.client !== undefined) {
    return options.client;
  }

  if ("host" in options && options.host !== undefined) {
    return new Meilisearch({
      host: options.host,
      apiKey: options.apiKey,
    });
  }

  throw new Error("Meilisearch tools require either `client` or `host`");
}

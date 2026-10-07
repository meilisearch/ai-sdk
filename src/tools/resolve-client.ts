import { Meilisearch } from "meilisearch";

import pkg from "../../package.json" with { type: "json" };
import type { ToolClientOptions } from "./types.ts";

/**
 * Client agent sent to Meilisearch in the `X-Meilisearch-Client` header.
 *
 * It lets Meilisearch identify requests coming from this integration, in
 * addition to the `Meilisearch JavaScript (vX.Y.Z)` agent added by meilisearch-js.
 */
export const CLIENT_AGENT = `Meilisearch Vercel AI SDK (v${pkg.version})`;

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
      clientAgents: [CLIENT_AGENT],
    });
  }

  throw new Error("Meilisearch tools require either `client` or `host`");
}

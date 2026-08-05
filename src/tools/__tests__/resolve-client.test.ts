import { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import { resolveClient } from "../resolve-client.ts";

describe("resolveClient", () => {
  test("returns the provided client", () => {
    const client = { index: vi.fn() } as unknown as Meilisearch;

    expect(resolveClient({ client, description: "Search" })).toBe(client);
  });

  test("creates a Meilisearch client from host and apiKey", () => {
    const client = resolveClient({
      host: "http://localhost:7700",
      apiKey: "test-key",
      description: "Search",
    });

    expect(client).toBeInstanceOf(Meilisearch);
    expect(client.config.host).toBe("http://localhost:7700");
    expect(client.config.apiKey).toBe("test-key");
  });

  test("creates a Meilisearch client from host without apiKey", () => {
    const client = resolveClient({
      host: "http://localhost:7700",
      description: "Search",
    });

    expect(client).toBeInstanceOf(Meilisearch);
    expect(client.config.host).toBe("http://localhost:7700");
  });

  test("throws when neither client nor host is provided", () => {
    expect(() => resolveClient({ description: "Search" } as never)).toThrow(/client|host/i);
  });

  test("prefers client when both client and host are provided", () => {
    const client = { index: vi.fn() } as unknown as Meilisearch;

    expect(
      resolveClient({
        client,
        host: "http://localhost:7700",
        apiKey: "test-key",
        description: "Search",
      }),
    ).toBe(client);
  });
});

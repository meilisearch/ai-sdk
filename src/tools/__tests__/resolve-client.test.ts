import { Meilisearch } from "meilisearch";
import { describe, expect, test, vi } from "vite-plus/test";

import pkg from "../../../package.json" with { type: "json" };
import { CLIENT_AGENT, resolveClient } from "../resolve-client.ts";

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

  test("identifies the integration in the client agents", () => {
    const client = resolveClient({
      host: "http://localhost:7700",
      apiKey: "test-key",
      description: "Search",
    });

    expect(CLIENT_AGENT).toBe(`Meilisearch Vercel AI SDK (v${pkg.version})`);
    expect(client.config.clientAgents).toEqual([CLIENT_AGENT]);
  });

  test("sends the integration agent in the X-Meilisearch-Client header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const client = resolveClient({
        host: "http://localhost:7700",
        apiKey: "test-key",
        description: "Search",
      });

      await client.index("movies").search("shoes");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      const header = new Headers(init.headers).get("X-Meilisearch-Client");

      expect(header).toContain(CLIENT_AGENT);
      expect(header).toMatch(/Meilisearch JavaScript \(v\d+\.\d+\.\d+\)/);
    } finally {
      vi.unstubAllGlobals();
    }
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

import { defineConfig, loadEnv } from "vite-plus";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.e2e.ts"],
    testTimeout: 60_000,
    // '' = load all keys, not only VITE_*
    env: loadEnv("test", process.cwd(), ""),
  },
});

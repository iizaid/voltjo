import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is a Next.js build-time guard with no runtime API; stub it
      // so server modules can be exercised under the node test environment.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
});

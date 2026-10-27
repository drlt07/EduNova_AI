import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "@khbd": path.resolve(__dirname, "khbd") } },
  test: { include: ["tests/unit/**/*.test.ts", "tests/db/**/*.test.ts"], environment: "node" },
});

import { defineConfig } from "vitest/config";
import path from "node:path";

// Test của trợ lý soạn KHBD: chạy với thư mục làm việc là khbd/ (test đọc templates/, samples/, rules/ theo process.cwd()).
export default defineConfig({
  resolve: { alias: { "@khbd": path.resolve(__dirname) } },
  test: { root: __dirname, include: ["tests/**/*.test.ts"], environment: "node" },
});

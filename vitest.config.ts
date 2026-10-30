import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "@khbd": path.resolve(__dirname, "khbd") } },
  test: { include: ["tests/unit/**/*.test.ts", "tests/db/**/*.test.ts"], environment: "node",
    // test luôn chạy bản dùng thử (dữ liệu mẫu), kể cả khi máy có biến Supabase thật
    env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" } },
});

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Trợ lý soạn KHBD: mã gốc giữ quy ước riêng (xem khbd/CLAUDE.md), kiểm tra bằng test của nó
    "khbd/**",
  ]),
]);

export default eslintConfig;

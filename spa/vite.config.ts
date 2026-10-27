import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const shim = (f: string) => path.resolve(__dirname, "shims", f);

// Bản Artifact: toàn bộ ứng dụng trong một file HTML, thay các API riêng của Next.js bằng shim.
export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: /^next\/navigation$/, replacement: shim("navigation.ts") },
      { find: /^next\/link$/, replacement: shim("link.tsx") },
      { find: /^next\/dynamic$/, replacement: shim("dynamic.tsx") },
      { find: /^@\/lib\/ai\/client$/, replacement: shim("ai-client.ts") },
      { find: /^@\//, replacement: path.resolve(__dirname, "../src") + "/" },
    ],
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: { outDir: path.resolve(__dirname, "dist"), emptyOutDir: true, chunkSizeWarningLimit: 5000, modulePreload: false, target: "es2020", rollupOptions: { output: { format: "iife", inlineDynamicImports: true } } },
});

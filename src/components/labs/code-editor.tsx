"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Label, Textarea } from "@/components/ui/form";

const Monaco = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false });

type LoadState = "loading" | "ready" | "failed";

// Ghim phiên bản khớp @monaco-editor/loader để không phụ thuộc mặc định ngầm.
const MONACO_VS = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs";

/**
 * Monaco được tải từ CDN bởi @monaco-editor/react. Mạng trường học có thể chặn CDN,
 * nên kiểm tra CDN trước bằng fetch (bắt được lỗi) rồi mới gọi loader.init() — loader có
 * nhánh promise không bắt lỗi, gọi khi CDN bị chặn sẽ sinh unhandled rejection.
 * Nếu lỗi/quá 8 giây thì dùng textarea.
 */
export function CodeEditor({ value, onChange, forcePlain, height = 360 }: { value: string; onChange: (v: string) => void; forcePlain?: boolean; height?: number }) {
  const { resolvedTheme } = useTheme();
  const [state, setState] = useState<LoadState>("loading");
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => alive && setState((s) => (s === "loading" ? "failed" : s)), 8000);
    fetch(`${MONACO_VS}/loader.js`, { mode: "no-cors", cache: "force-cache" })
      .then(() => import("@monaco-editor/react"))
      .then(({ loader }) => {
        loader.config({ paths: { vs: MONACO_VS } });
        return loader.init();
      })
      .then(() => alive && setState("ready"))
      .catch(() => alive && setState("failed"));
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  if (state === "ready" && !forcePlain)
    return (
      <div className="overflow-hidden rounded-xl border border-line" aria-label="Trình soạn mã">
        <Monaco height={`${height}px`} language="python" theme={resolvedTheme === "light" ? "light" : "vs-dark"} value={value} onChange={(v) => onChange(v ?? "")} options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, tabSize: 4, automaticLayout: true }} />
      </div>
    );
  return (
    <div>
      <Label htmlFor="code-plain" className="sr-only">Mã nguồn</Label>
      <Textarea id="code-plain" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} style={{ height }} className="font-mono text-[13px]" />
      {!forcePlain && (
        <p className="mt-1 text-xs text-muted" role="status">
          {state === "loading" ? "Đang tải trình soạn thảo…" : "Đang dùng trình soạn thảo đơn giản."}
        </p>
      )}
    </div>
  );
}

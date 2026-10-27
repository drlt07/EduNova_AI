"use client";
import { useDeferredValue, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";

const MAX = 20_000;
const START_HTML = `<h1>CLB Tin học</h1>\n<p>Chào mừng các bạn lớp 12!</p>\n<ul>\n  <li>Lập trình Python</li>\n  <li>Thiết kế web</li>\n</ul>\n<a class="btn" href="#">Đăng ký</a>`;
const START_CSS = `body { font-family: sans-serif; padding: 16px; background: #f0f9ff; }\nh1 { color: #0e7490; }\n.btn { background: #4f7fff; color: white; padding: 8px 14px; border-radius: 8px; text-decoration: none; }`;

/** Ghép tài liệu cho iframe. Iframe dùng sandbox="" nên mọi <script> đều bị chặn. */
export function buildSrcDoc(html: string, css: string) {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;"><style>${safeCss}</style></head><body>${html}</body></html>`;
}

export function WebCreator({ onSave }: { onSave?: (content: string) => void }) {
  const [html, setHtml] = useState(START_HTML);
  const [css, setCss] = useState(START_CSS);
  const doc = useDeferredValue(buildSrcDoc(html.slice(0, MAX), css.slice(0, MAX)));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <Label htmlFor="wc-html">HTML</Label>
          <Textarea id="wc-html" value={html} maxLength={MAX} onChange={(e) => setHtml(e.target.value)} spellCheck={false} className="mt-1 min-h-[180px] font-mono text-[13px]" />
        </div>
        <div>
          <Label htmlFor="wc-css">CSS</Label>
          <Textarea id="wc-css" value={css} maxLength={MAX} onChange={(e) => setCss(e.target.value)} spellCheck={false} className="mt-1 min-h-[140px] font-mono text-[13px]" />
        </div>
        {onSave && (
          <Button
            variant="secondary"
            onClick={() => {
              onSave(`<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`);
              toast.success("Đã lưu vào hồ sơ học tập");
            }}
          >
            <Save /> Lưu vào hồ sơ học tập
          </Button>
        )}
      </div>
      <div className="flex flex-col">
        <p className="mb-1 text-sm font-medium text-fg">Xem trước</p>
        <iframe title="Xem trước trang web" sandbox="" srcDoc={doc} className="min-h-[360px] w-full flex-1 rounded-2xl border border-line bg-white" />
      </div>
    </div>
  );
}

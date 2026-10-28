"use client";
/** Tin 12 – Mê cung website (liên kết, thanh điều hướng): sửa href trên từng trang, bấm thử trong trình duyệt thu nhỏ, sơ đồ trang và liên kết hỏng. */
import { useState } from "react";
import { ArrowLeft, Globe, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, ResetAll, SimLayout, SimShell, Stage, useChallenge } from "./kit";

export const PAGES = ["index.html", "gioi-thieu.html", "lien-he.html", "lop/10a1.html", "lop/10a2.html"] as const;
type Page = (typeof PAGES)[number];
const TITLE: Record<Page, string> = { "index.html": "Trang chủ", "gioi-thieu.html": "Giới thiệu", "lien-he.html": "Liên hệ", "lop/10a1.html": "Lớp 10A1", "lop/10a2.html": "Lớp 10A2" };
export interface A { text: string; href: string }
export type Site = Record<Page, A[]>;

/** Giải đường dẫn tương đối như trình duyệt (./, ../, /). Trả về undefined nếu không trỏ tới trang có thật. */
export function resolve(from: Page, href: string): Page | undefined {
  const h = href.trim().split("#")[0];
  if (/^[a-z]+:/i.test(h)) return undefined;
  const parts = (h.startsWith("/") ? h.slice(1) : [...from.split("/").slice(0, -1), h].join("/")).split("/");
  const out: string[] = [];
  for (const p of parts) { if (p === "" || p === ".") continue; if (p === "..") out.pop(); else out.push(p); }
  const path = out.join("/") || "index.html";
  return (PAGES as readonly string[]).includes(path) ? (path as Page) : undefined;
}
export function reachable(site: Site, start: Page = "index.html") {
  const seen = new Set<Page>([start]);
  const q: Page[] = [start];
  while (q.length) { const p = q.shift()!; for (const a of site[p]) { const t = resolve(p, a.href); if (t && !seen.has(t)) { seen.add(t); q.push(t); } } }
  return seen;
}

const BROKEN: Site = {
  "index.html": [{ text: "Giới thiệu", href: "gioithieu.html" }, { text: "Lớp 10A1", href: "lop/10a1.html" }, { text: "Liên hệ", href: "lien-he.html" }],
  "gioi-thieu.html": [{ text: "Trang chủ", href: "index.html" }],
  "lien-he.html": [{ text: "Trang chủ", href: "index.htm" }],
  "lop/10a1.html": [{ text: "Trang chủ", href: "index.html" }, { text: "Lớp 10A2", href: "lop/10a2.html" }],
  "lop/10a2.html": [{ text: "Lớp 10A1", href: "10a1.html" }, { text: "Trang chủ", href: "../index.html" }],
};

function Browser({ site, page, go, back }: { site: Site; page: Page | "404"; go: (from: Page, href: string) => void; back: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white text-slate-900 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <button type="button" aria-label="Quay lại" onClick={back} className="rounded p-1 hover:bg-slate-200"><ArrowLeft className="size-4" /></button>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-xs text-slate-600"><Globe className="size-3.5 shrink-0" aria-hidden />truong-em.edu.vn/{page === "404" ? "???" : page}</span>
      </div>
      {page === "404" ? (
        <div className="p-8 text-center"><p className="text-4xl font-black text-rose-500">404</p><p className="mt-1 text-sm">Không tìm thấy trang. Liên kết này bị hỏng.</p></div>
      ) : (
        <div>
          <nav className="flex flex-wrap gap-1 bg-[#1d4ed8] px-3 py-2" aria-label="Thanh điều hướng của trang">
            {site[page].map((a, i) => <button key={i} type="button" onClick={() => go(page, a.href)} className="rounded-md px-2.5 py-1 text-sm font-semibold text-white underline-offset-2 hover:bg-white/15 hover:underline">{a.text}</button>)}
          </nav>
          <div className="p-5"><h4 className="text-xl font-bold">{TITLE[page]}</h4><p className="mt-1 text-sm text-slate-500">Nội dung của trang {TITLE[page].toLowerCase()}…</p></div>
        </div>
      )}
    </div>
  );
}

function SiteMap({ site, current }: { site: Site; current?: Page | "404" }) {
  const pos: Record<Page, [number, number]> = { "index.html": [300, 50], "gioi-thieu.html": [110, 150], "lien-he.html": [490, 150], "lop/10a1.html": [220, 260], "lop/10a2.html": [400, 260] };
  const reach = reachable(site);
  const edges = PAGES.flatMap((p) => site[p].map((a, i) => ({ p, i, a, t: resolve(p, a.href) })));
  return (
    <svg viewBox="0 0 600 310" className="h-auto w-full" role="img" aria-label="Sơ đồ trang web và liên kết">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#64748b" /></marker></defs>
      <rect x="150" y="225" width="320" height="70" rx="12" fill="none" stroke="#cbd5e1" strokeDasharray="5 4" /><text x="160" y="241" fontSize="11" fill="#64748b">thư mục lop/</text>
      {edges.map(({ p, i, t }) => {
        if (!t) return null;
        const [x1, y1] = pos[p], [x2, y2] = pos[t];
        const off = PAGES.indexOf(p) < PAGES.indexOf(t) ? 6 : -6;
        const d = Math.hypot(x2 - x1, y2 - y1) || 1;
        return <line key={`${p}-${i}`} x1={x1 + off} y1={y1 + off} x2={x2 + off - ((x2 - x1) / d) * 48} y2={y2 + off - ((y2 - y1) / d) * 22} stroke="#64748b" strokeWidth="2" markerEnd="url(#ar)" />;
      })}
      {PAGES.map((p) => {
        const [x, y] = pos[p];
        const bad = site[p].filter((a) => !resolve(p, a.href)).length;
        return (
          <g key={p} transform={`translate(${x} ${y})`}>
            <rect x="-56" y="-20" width="112" height="40" rx="10" fill={current === p ? "#dbeafe" : reach.has(p) ? "#fff" : "#fef3c7"} stroke={current === p ? "#2563eb" : "#94a3b8"} strokeWidth={current === p ? 3 : 1.5} />
            <text y="-2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">{TITLE[p]}</text>
            <text y="12" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#64748b">{p}</text>
            {bad > 0 && <g transform="translate(52 -18)"><circle r="10" fill="#ef4444" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{bad}</text></g>}
            {!reach.has(p) && <text y="34" textAnchor="middle" fontSize="10" fill="#b45309">không tới được từ trang chủ</text>}
          </g>
        );
      })}
    </svg>
  );
}

function LinkEditor({ site, page, setSite }: { site: Site; page: Page; setSite: (s: Site) => void }) {
  return (
    <div className="space-y-2">
      {site[page].map((a, i) => {
        const t = resolve(page, a.href);
        return (
          <div key={i} className="space-y-1">
            <p className="font-mono text-[11px] text-muted [font-variant-ligatures:none]">{`<a href="…">${a.text}</a>`}</p>
            <Input aria-label={`href của liên kết ${a.text}`} className={cn("h-8 font-mono text-xs", t ? "border-success/50" : "border-danger/60")} value={a.href} spellCheck={false} onChange={(e) => setSite({ ...site, [page]: site[page].map((x, k) => (k === i ? { ...x, href: e.target.value } : x)) })} />
            <p className={cn("text-[11px]", t ? "text-success-fg" : "text-danger-fg")}>{t ? `→ ${t}` : "→ không có trang này (404)"}</p>
          </div>
        );
      })}
    </div>
  );
}

function useBrowser() {
  const [page, setPage] = useState<Page | "404">("index.html");
  const [, setHist] = useState<(Page | "404")[]>([]);
  return {
    page, setPage, reset: () => { setPage("index.html"); setHist([]); },
    go: (from: Page, href: string) => { setHist((h) => [...h, from]); setPage(resolve(from, href) ?? "404"); },
    back: () => setHist((h) => { if (h.length) setPage(h[h.length - 1]); return h.slice(0, -1); }),
  };
}

function Explore() {
  const [site, setSite] = useState<Site>(BROKEN);
  const br = useBrowser();
  const editing: Page = br.page === "404" ? "index.html" : br.page;
  const broken = PAGES.reduce((n, p) => n + site[p].filter((a) => !resolve(p, a.href)).length, 0);
  return (
    <SimLayout
      stage={
        <div className="space-y-3">
          <Browser site={site} page={br.page} go={br.go} back={br.back} />
          <Stage className="p-2"><SiteMap site={site} current={br.page} /></Stage>
        </div>
      }
      controls={
        <>
          <Panel title={`Sửa liên kết trên ${editing}`}><LinkEditor site={site} page={editing} setSite={setSite} /></Panel>
          <Panel title="Đến trang">
            <select aria-label="Mở trang để sửa" className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm" value={editing} onChange={(e) => br.setPage(e.target.value as Page)}>{PAGES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            <p className={cn("text-xs", broken ? "text-danger-fg" : "text-success-fg")}>{broken ? `Còn ${broken} liên kết hỏng (chấm đỏ trên sơ đồ).` : "Không còn liên kết hỏng."}</p>
          </Panel>
          <Panel title="Mẹo đường dẫn"><p className="font-mono text-[11px] text-muted [font-variant-ligatures:none]">lop/10a1.html → vào thư mục lop<br />../index.html → ra thư mục cha<br />/index.html → tính từ gốc trang web</p></Panel>
          <ResetAll onClick={() => { setSite(BROKEN); br.reset(); }} />
        </>
      }
    />
  );
}

const TASKS: { prompt: string; ok: (s: Site) => boolean; hint: string; why: string }[] = [
  { prompt: "Trang chủ có liên kết Giới thiệu bị hỏng. Sửa để bấm vào mở được trang Giới thiệu.", ok: (s) => resolve("index.html", s["index.html"][0].href) === "gioi-thieu.html", hint: "So tên tệp trong href với tên tệp thật: gioi-thieu.html.", why: "href phải đúng từng kí tự tên tệp, kể cả dấu gạch nối." },
  { prompt: "Sửa liên kết Trang chủ trên trang Liên hệ.", ok: (s) => resolve("lien-he.html", s["lien-he.html"][0].href) === "index.html", hint: "Đuôi tệp là .html chứ không phải .htm.", why: "Sai một chữ trong đuôi tệp cũng làm liên kết hỏng." },
  { prompt: "Trang lớp 10A1 nằm trong thư mục lop/. Sửa hai liên kết của nó cho đúng.", ok: (s) => resolve("lop/10a1.html", s["lop/10a1.html"][0].href) === "index.html" && resolve("lop/10a1.html", s["lop/10a1.html"][1].href) === "lop/10a2.html", hint: "Từ trong lop/, ra trang chủ cần ../ ; sang 10a2 thì chỉ cần tên tệp.", why: "../index.html ra thư mục cha; 10a2.html cùng thư mục." },
  { prompt: "Làm cho mọi trang đều tới được từ trang chủ và không còn liên kết hỏng.", ok: (s) => reachable(s).size === PAGES.length && PAGES.every((p) => s[p].every((a) => resolve(p, a.href))), hint: "Xem sơ đồ: trang nền vàng là trang không tới được; chấm đỏ là liên kết hỏng.", why: "Thanh điều hướng tốt cho mọi trang tới được trang chủ và ngược lại." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [site, setSite] = useState<Site>(BROKEN);
  const br = useBrowser();
  const key = `${c.run}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setSite(BROKEN); br.reset(); }
  const editing: Page = br.page === "404" ? "index.html" : br.page;
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={() => c.check(t.ok(site), t.ok(site) ? t.why : t.hint)} summary={["Thẻ <a href=\"…\"> tạo liên kết; href là đường dẫn tới trang đích.", "Đường dẫn tương đối tính từ thư mục của trang hiện tại; ../ để ra thư mục cha.", "Sai một kí tự trong href là liên kết hỏng (lỗi 404)."]}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3"><Browser site={site} page={br.page} go={br.go} back={br.back} /><Stage className="p-2"><SiteMap site={site} current={br.page} /></Stage></div>
        <div className="space-y-3">
          <Panel title="Đến trang"><select aria-label="Mở trang để sửa" className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm" value={editing} onChange={(e) => br.setPage(e.target.value as Page)}>{PAGES.map((p) => <option key={p} value={p}>{p}</option>)}</select></Panel>
          <Panel title={`Liên kết trên ${editing}`}><LinkEditor site={site} page={editing} setSite={setSite} /></Panel>
        </div>
      </div>
    </ChallengeFrame>
  );
}

export function WebNavigationLab() {
  return <SimShell title="Mê cung website" screens={[{ id: "kham-pha", label: "Khám phá", icon: Home, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

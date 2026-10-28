"use client";
/** Tin 11 Bài 3 – Khám phá thế giới phần mềm: bản đồ nguồn mở/nguồn đóng × cài trên máy/chạy trên Internet, thử mất mạng, phân loại. */
import { useState } from "react";
import { Check, Code2, Globe, HardDrive, Lock, Unlock, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, ResetAll, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

export interface Soft { id: string; name: string; what: string; open: boolean; web: boolean; price: "miễn phí" | "trả phí" | "miễn phí có giới hạn"; license: string; x: number; y: number }
/** x: 0 cài trên máy → 1 chạy trên trình duyệt; y: 0 nguồn mở → 1 nguồn đóng (vị trí trên bản đồ). */
export const SOFTS: Soft[] = [
  { id: "libre", name: "LibreOffice", what: "Bộ văn phòng", open: true, web: false, price: "miễn phí", license: "MPL (nguồn mở)", x: 0.12, y: 0.15 },
  { id: "gimp", name: "GIMP", what: "Chỉnh sửa ảnh", open: true, web: false, price: "miễn phí", license: "GPL (nguồn mở)", x: 0.25, y: 0.08 },
  { id: "firefox", name: "Firefox", what: "Trình duyệt web", open: true, web: false, price: "miễn phí", license: "MPL (nguồn mở)", x: 0.36, y: 0.2 },
  { id: "ubuntu", name: "Ubuntu Linux", what: "Hệ điều hành", open: true, web: false, price: "miễn phí", license: "GPL và nhiều giấy phép mở", x: 0.08, y: 0.3 },
  { id: "vlc", name: "VLC", what: "Phát video, nhạc", open: true, web: false, price: "miễn phí", license: "GPL (nguồn mở)", x: 0.22, y: 0.36 },
  { id: "word", name: "Microsoft Word (bản cài)", what: "Soạn thảo văn bản", open: false, web: false, price: "trả phí", license: "Độc quyền", x: 0.14, y: 0.78 },
  { id: "photoshop", name: "Photoshop", what: "Chỉnh sửa ảnh", open: false, web: false, price: "trả phí", license: "Độc quyền", x: 0.3, y: 0.9 },
  { id: "gdocs", name: "Google Docs", what: "Soạn thảo trực tuyến", open: false, web: true, price: "miễn phí", license: "Độc quyền, dùng qua tài khoản", x: 0.82, y: 0.72 },
  { id: "canva", name: "Canva", what: "Thiết kế đồ hoạ trực tuyến", open: false, web: true, price: "miễn phí có giới hạn", license: "Độc quyền, dùng qua tài khoản", x: 0.7, y: 0.86 },
  { id: "gmail", name: "Gmail", what: "Thư điện tử", open: false, web: true, price: "miễn phí", license: "Độc quyền, dùng qua tài khoản", x: 0.9, y: 0.6 },
];

function Map({ sel, onSel, offline, wantCode, place }: { sel?: string; onSel: (id: string) => void; offline: boolean; wantCode: boolean; place?: Record<string, Cat | undefined> }) {
  return (
    <div className="relative aspect-[16/10] w-full">
      <div aria-hidden className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-2xl">
        <div className="bg-emerald-100/70 dark:bg-emerald-950/40" /><div className="bg-sky-100/70 dark:bg-sky-950/40" />
        <div className="bg-amber-100/70 dark:bg-amber-950/40" /><div className="bg-violet-100/70 dark:bg-violet-950/40" />
      </div>
      <span className="absolute left-3 top-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"><Unlock className="mr-1 inline size-3.5" aria-hidden />Nguồn mở</span>
      <span className="absolute bottom-2 left-3 text-xs font-bold text-amber-700 dark:text-amber-300"><Lock className="mr-1 inline size-3.5" aria-hidden />Nguồn đóng</span>
      <span className="absolute right-3 top-2 text-xs font-bold text-sky-700 dark:text-sky-300"><Globe className="mr-1 inline size-3.5" aria-hidden />Chạy trên Internet</span>
      <span className="absolute bottom-2 right-3 text-xs font-bold text-slate-600 dark:text-slate-300"><HardDrive className="mr-1 inline size-3.5" aria-hidden />trái: cài trên máy</span>
      {SOFTS.map((s) => {
        const dead = offline && s.web;
        const dim = wantCode && !s.open;
        return (
          <button key={s.id} type="button" onClick={() => onSel(s.id)} aria-pressed={sel === s.id} aria-label={`${s.name}${dead ? " (không dùng được khi mất mạng)" : ""}`} style={{ left: `${s.x * 86 + 4}%`, top: `${s.y * 76 + 10}%` }} className={cn("absolute -translate-y-1/2 rounded-xl border bg-surface px-2.5 py-1.5 text-left text-xs font-semibold shadow-sm transition-all", sel === s.id ? "z-10 border-brand ring-2 ring-brand/40" : "border-line", (dead || dim) && "opacity-35 grayscale", place?.[s.id] && "ring-2 ring-emerald-400")}>
            {s.name}{dead && <WifiOff className="ml-1 inline size-3 text-danger-fg" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

function Explore() {
  const [sel, setSel] = useState("libre");
  const [offline, setOffline] = useState(false);
  const [code, setCode] = useState(false);
  const s = SOFTS.find((x) => x.id === sel)!;
  return (
    <SimLayout
      stage={<Stage className="p-3"><Map sel={sel} onSel={setSel} offline={offline} wantCode={code} /></Stage>}
      controls={
        <>
          <Panel title={s.name}>
            <p className="text-muted">{s.what}</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">{s.open ? <Unlock className="size-4 text-success-fg" aria-hidden /> : <Lock className="size-4 text-warning-fg" aria-hidden />} {s.open ? "Ai cũng xem, sửa, phân phối lại được mã nguồn" : "Không công bố mã nguồn"}</li>
              <li className="flex items-center gap-2">{s.web ? <Globe className="size-4 text-blue-fg" aria-hidden /> : <HardDrive className="size-4 text-muted" aria-hidden />} {s.web ? "Mở bằng trình duyệt, dữ liệu lưu trên máy chủ, cần Internet" : "Cài đặt và chạy trên máy, không cần mạng"}</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-muted" aria-hidden /> Giá: {s.price}</li>
              <li className="flex items-center gap-2"><Code2 className="size-4 text-muted" aria-hidden /> Giấy phép: {s.license}</li>
            </ul>
          </Panel>
          <Panel title="Thử tình huống">
            <SimToggle label="Mất kết nối Internet" checked={offline} onChange={setOffline} />
            <SimToggle label="Em muốn đọc và sửa mã nguồn" checked={code} onChange={setCode} />
            {(offline || code) && <p className="text-xs text-muted">Phần mềm mờ đi là không đáp ứng được tình huống này.</p>}
          </Panel>
          <p className="text-xs text-muted">Miễn phí chưa chắc là nguồn mở: Google Docs miễn phí nhưng mã nguồn đóng.</p>
          <ResetAll onClick={() => { setSel("libre"); setOffline(false); setCode(false); }} />
        </>
      }
    />
  );
}

type Cat = "mo" | "dong" | "web";
const CAT_LABEL: Record<Cat, string> = { mo: "Nguồn mở", dong: "Nguồn đóng, cài trên máy", web: "Chạy trên Internet" };
const catOf = (s: Soft): Cat => (s.web ? "web" : s.open ? "mo" : "dong");

type Task = { kind: "sort"; prompt: string } | { kind: "pick"; prompt: string; ok: string[]; why: string };
const TASKS: Task[] = [
  { kind: "sort", prompt: "Xếp mỗi phần mềm vào đúng nhóm (bấm vào ô nhóm dưới mỗi tên)." },
  { kind: "pick", prompt: "Phòng máy không có tiền mua bản quyền và hay mất mạng. Chọn phần mềm soạn văn bản phù hợp.", ok: ["libre"], why: "LibreOffice nguồn mở, miễn phí, cài trên máy nên không cần mạng." },
  { kind: "pick", prompt: "Nhóm 4 bạn ở 4 nhà muốn cùng sửa một văn bản cùng lúc.", ok: ["gdocs"], why: "Phần mềm chạy trên Internet lưu một bản trên máy chủ, mọi người sửa chung được." },
  { kind: "pick", prompt: "Bạn Minh muốn tự sửa mã nguồn một trình chỉnh ảnh để thêm bộ lọc riêng.", ok: ["gimp"], why: "Chỉ phần mềm nguồn mở mới cho xem và sửa mã nguồn." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [place, setPlace] = useState<Record<string, Cat | undefined>>({});
  const [pick, setPick] = useState<string | undefined>();
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPick(undefined); }
  const check = () => {
    if (t.kind === "sort") {
      const wrong = SOFTS.filter((s) => place[s.id] !== catOf(s));
      return c.check(!wrong.length, wrong.length ? `Còn ${wrong.length} phần mềm chưa đúng nhóm, ví dụ ${wrong[0].name}.` : "Đúng hết! Nguồn mở và chạy trên Internet là hai câu hỏi khác nhau.");
    }
    const ok = !!pick && t.ok.includes(pick);
    c.check(ok, ok ? t.why : pick ? `${SOFTS.find((s) => s.id === pick)!.name} chưa phù hợp. Đọc lại yêu cầu.` : "Hãy chọn một phần mềm.");
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["Phần mềm nguồn mở công bố mã nguồn, ai cũng được xem, sửa, phân phối lại theo giấy phép.", "Phần mềm chạy trên Internet dùng qua trình duyệt, dữ liệu lưu trên máy chủ, cần mạng.", "Miễn phí không có nghĩa là nguồn mở."]}>
      {t.kind === "sort" ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {SOFTS.map((s) => (
            <li key={s.id} className="rounded-xl border border-line bg-surface p-2.5">
              <p className="text-sm font-semibold text-fg">{s.name} <span className="font-normal text-muted">· {s.what}</span></p>
              <div className="mt-1.5 flex flex-wrap gap-1">{(Object.keys(CAT_LABEL) as Cat[]).map((k) => <button key={k} type="button" aria-pressed={place[s.id] === k} onClick={() => setPlace((p) => ({ ...p, [s.id]: k }))} className={cn("rounded-lg px-2 py-1 text-[11px] font-semibold", place[s.id] === k ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted hover:text-fg")}>{CAT_LABEL[k]}</button>)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <Stage className="p-3"><Map sel={pick} onSel={setPick} offline={false} wantCode={false} /></Stage>
      )}
    </ChallengeFrame>
  );
}

export function SoftwareEcosystemLab() {
  return <SimShell title="Khám phá thế giới phần mềm" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

"use client";
/** Mật khẩu mạnh cỡ nào: số kí tự có thể × độ dài → số khả năng; máy đoán càng nhanh, mật khẩu yếu càng nhanh lộ. */
import { useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, Segmented, Stage, useChallenge } from "@/components/phet/kit";

/** Mật khẩu phổ biến: kẻ gian thử danh sách này đầu tiên, nên bị đoán gần như ngay lập tức. */
const COMMON = ["123456", "12345678", "123456789", "password", "matkhau", "qwerty", "iloveyou", "abc123", "111111", "admin", "anhyeuem", "000000"];

export function charsetSize(pw: string) {
  let n = 0;
  if (/[a-z]/.test(pw)) n += 26;
  if (/[A-Z]/.test(pw)) n += 26;
  if (/[0-9]/.test(pw)) n += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) n += 33;
  return n;
}

/** Số giây trung bình để đoán ra (thử một nửa số khả năng); mật khẩu phổ biến hoặc tên + năm sinh coi như bị đoán ngay. */
export function crackSeconds(pw: string, perSecond: number) {
  if (!pw) return 0;
  const low = pw.toLowerCase();
  if (COMMON.some((c) => low === c || low.startsWith(c))) return 0.001;
  const pattern = /^[a-z]+(19|20)\d\d$/i.test(pw) ? 1e6 : 1;
  const combos = Math.pow(charsetSize(pw), pw.length) / pattern;
  return combos / 2 / perSecond;
}

export function humanTime(s: number) {
  if (s < 1) return "ngay lập tức";
  const units: [number, string][] = [[31_536_000 * 1e6, "triệu năm"], [31_536_000 * 1000, "nghìn năm"], [31_536_000, "năm"], [86_400, "ngày"], [3600, "giờ"], [60, "phút"], [1, "giây"]];
  for (const [u, name] of units) if (s >= u) { const v = s / u; return v >= 1e6 ? "hơn hàng tỉ năm" : `${v >= 100 ? Math.round(v).toLocaleString("vi-VN") : v.toFixed(v < 10 ? 1 : 0).replace(".", ",")} ${name}`; }
  return "ngay lập tức";
}

const RATES = [
  { value: 1e3, label: "Đoán trên web (1 nghìn/giây)" },
  { value: 1e9, label: "Máy tính mạnh (1 tỉ/giây)" },
  { value: 1e11, label: "Cụm máy GPU (100 tỉ/giây)" },
];

function level(s: number) {
  if (s < 3600) return { label: "Rất yếu", tone: "rose" as const, pct: 10, color: "bg-danger" };
  if (s < 31_536_000) return { label: "Yếu", tone: "amber" as const, pct: 35, color: "bg-warning" };
  if (s < 31_536_000 * 1000) return { label: "Khá", tone: "blue" as const, pct: 65, color: "bg-blue" };
  return { label: "Mạnh", tone: "green" as const, pct: 100, color: "bg-success" };
}

function Explore() {
  const [pw, setPw] = useState("meo2009");
  const [rate, setRate] = useState(1e9);
  const s = crackSeconds(pw, rate);
  const lv = level(s);
  const classes = [
    { on: /[a-z]/.test(pw), label: "chữ thường", n: 26 },
    { on: /[A-Z]/.test(pw), label: "CHỮ HOA", n: 26 },
    { on: /[0-9]/.test(pw), label: "chữ số", n: 10 },
    { on: /[^a-zA-Z0-9]/.test(pw), label: "kí hiệu !@#", n: 33 },
  ];
  return (
    <SimLayout
      stage={
        <Stage className="space-y-5 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-fg">Gõ thử một mật khẩu (đừng gõ mật khẩu thật của em)</span>
            <input value={pw} onChange={(e) => setPw(e.target.value.slice(0, 32))} autoComplete="off" spellCheck={false} className="h-14 w-full rounded-2xl border-2 border-line bg-white px-4 font-mono text-2xl tracking-wide text-slate-900 focus:border-brand focus:outline-none" />
          </label>
          <div>
            <div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-fg">Độ mạnh: {pw ? lv.label : "—"}</span><span className="text-muted">{pw.length} kí tự</span></div>
            <div className="h-4 overflow-hidden rounded-full bg-surface-2"><div className={cn("h-full rounded-full transition-all duration-500", lv.color)} style={{ width: pw ? `${lv.pct}%` : 0 }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {classes.map((c) => <div key={c.label} className={cn("rounded-xl border-2 p-2 text-center text-sm transition-colors", c.on ? "border-success bg-success/10 text-fg" : "border-dashed border-line text-muted")}><b className="block">{c.label}</b><span className="text-xs">+{c.n} kí tự</span></div>)}
          </div>
          <div className="rounded-2xl bg-slate-900 p-5 text-center text-white">
            <p className="text-xs uppercase tracking-widest text-slate-400">Thời gian máy đoán ra</p>
            <p className={cn("mt-1 text-4xl font-extrabold", s < 3600 ? "text-rose-400" : s < 31_536_000 * 1000 ? "text-amber-300" : "text-emerald-400")}>{pw ? humanTime(s) : "—"}</p>
            <p className="mt-2 font-mono text-xs text-slate-400">{charsetSize(pw)}<sup>{pw.length}</sup> khả năng ÷ 2 ÷ {rate.toLocaleString("vi-VN")} lần/giây</p>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Kẻ gian đoán bằng"><Segmented label="Tốc độ đoán" value={rate} options={RATES} onChange={setRate} /></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Bộ kí tự" value={charsetSize(pw)} /><Readout label="Độ dài" value={pw.length} tone={pw.length >= 12 ? "green" : "amber"} /></div>
          <Panel title="Thử nhanh">
            <div className="flex flex-wrap gap-1">{["123456", "Minh2008", "meo-an-ca-luc-7h", "T!n#oc_10A1"].map((x) => <button key={x} type="button" onClick={() => setPw(x)} className="rounded-lg bg-surface px-2 py-1 font-mono text-xs hover:bg-line">{x}</button>)}</div>
          </Panel>
          <p className="text-xs text-muted">Mô phỏng chạy ngay trên trình duyệt, không gửi mật khẩu đi đâu cả.</p>
          <ResetAll onClick={() => { setPw("meo2009"); setRate(1e9); }} />
        </>
      }
    />
  );
}

const TASKS = [
  { prompt: "Mật khẩu nào mạnh nhất?", opts: ["Matkhau2008", "P@ss1", "con-meo-an-ca-sang"], right: 2, ok: "Đúng: cụm từ dài nhiều kí tự cho số khả năng lớn hơn rất nhiều, lại dễ nhớ." },
  { prompt: "Muốn mật khẩu mạnh hơn nhiều nhất, nên làm gì?", opts: ["Thêm 6 kí tự nữa", "Đổi 1 chữ thành chữ hoa", "Thay chữ a bằng @"], right: 0, ok: "Đúng: mỗi kí tự thêm nhân số khả năng lên vài chục lần, độ dài quan trọng nhất." },
  { prompt: "Vì sao “Lan2009” bị đoán rất nhanh?", opts: ["Vì quá dài", "Vì là tên + năm sinh, kẻ gian thử kiểu này trước", "Vì có chữ hoa"], right: 1, ok: "Đúng: tên, ngày sinh, “123456” nằm trong danh sách thử đầu tiên." },
  { prompt: "Dùng chung một mật khẩu cho mọi trang có sao không?", opts: ["Không sao nếu mật khẩu mạnh", "Một trang bị lộ thì mọi tài khoản đều nguy hiểm", "Giúp an toàn hơn"], right: 1, ok: "Đúng: mỗi trang một mật khẩu, bật xác thực hai lớp cho tài khoản quan trọng." },
];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [pick, setPick] = useState<number | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPick(null); }
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={() => c.check(pick === t.right, pick === t.right ? t.ok : "Thử lại ở màn Khám phá: gõ từng phương án và so thời gian đoán.")} summary={SUMMARY}>
      <div className="grid gap-2 sm:grid-cols-3">{t.opts.map((o, i) => <button key={o} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", pick === i ? "border-brand bg-brand/10" : "border-line bg-surface")}>{o}</button>)}</div>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Số khả năng = (số loại kí tự)^(độ dài): thêm độ dài làm mật khẩu mạnh lên nhanh nhất.", "Tên, năm sinh, 123456 bị thử đầu tiên nên lộ ngay.", "Mỗi trang một mật khẩu, dùng trình quản lí mật khẩu và xác thực hai lớp."];

export function PasswordLab() {
  return <SimShell title="Mật khẩu mạnh cỡ nào?" screens={[{ id: "kham-pha", label: "Khám phá", icon: KeyRound, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Sparkles, render: () => <Game /> }]} />;
}

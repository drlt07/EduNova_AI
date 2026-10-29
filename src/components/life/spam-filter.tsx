"use client";
/** Bộ lọc thư rác: mỗi từ đáng ngờ cộng điểm, vượt ngưỡng thì chặn; đổi trọng số và ngưỡng để cân bằng chặn nhầm / lọt lưới. */
import { useState } from "react";
import { Inbox, MailWarning, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

interface Mail { id: string; from: string; subject: string; words: string[]; spam: boolean }
const MAILS: Mail[] = [
  { id: "m1", from: "Ngân hàng ABC", subject: "Tài khoản bị khóa, xác minh ngay qua link", words: ["ngay", "link", "xac-minh"], spam: true },
  { id: "m2", from: "Cô chủ nhiệm", subject: "Lịch họp phụ huynh thứ bảy này", words: [], spam: false },
  { id: "m3", from: "Quà tặng 24h", subject: "Chúc mừng! Bạn trúng thưởng iPhone miễn phí", words: ["trung-thuong", "mien-phi"], spam: true },
  { id: "m4", from: "Shop sách", subject: "Ưu đãi miễn phí giao hàng cho đơn của bạn", words: ["mien-phi"], spam: false },
  { id: "m5", from: "Người lạ", subject: "Kiếm tiền nhanh tại nhà, nhấn link ngay", words: ["kiem-tien", "link", "ngay"], spam: true },
  { id: "m6", from: "CLB Tin học", subject: "Link tài liệu buổi học hôm qua", words: ["link"], spam: false },
  { id: "m7", from: "Ví điện tử", subject: "Xác minh mã OTP để nhận quà miễn phí", words: ["xac-minh", "otp", "mien-phi"], spam: true },
  { id: "m8", from: "Trường THPT", subject: "Nhắc nộp bài ngay trước 17h", words: ["ngay"], spam: false },
];
const WORDS: { id: string; label: string; w: number }[] = [
  { id: "link", label: "link", w: 2 }, { id: "ngay", label: "ngay", w: 1 }, { id: "mien-phi", label: "miễn phí", w: 2 },
  { id: "trung-thuong", label: "trúng thưởng", w: 4 }, { id: "xac-minh", label: "xác minh", w: 3 }, { id: "otp", label: "OTP", w: 4 }, { id: "kiem-tien", label: "kiếm tiền", w: 4 },
];
const score = (m: Mail, w: Record<string, number>) => m.words.reduce((s, x) => s + (w[x] ?? 0), 0);
function confusion(w: Record<string, number>, th: number) {
  const r = MAILS.map((m) => ({ m, s: score(m, w), blocked: score(m, w) >= th }));
  return { r, tp: r.filter((x) => x.blocked && x.m.spam).length, fp: r.filter((x) => x.blocked && !x.m.spam).length, fn: r.filter((x) => !x.blocked && x.m.spam).length, tn: r.filter((x) => !x.blocked && !x.m.spam).length };
}

function Matrix({ c }: { c: ReturnType<typeof confusion> }) {
  const cell = (n: number, label: string, good: boolean) => <div className={cn("rounded-xl p-2 text-center", good ? "bg-emerald-100 dark:bg-emerald-500/15" : n ? "bg-rose-100 dark:bg-rose-500/15" : "bg-surface-2")}><p className="text-2xl font-bold text-fg">{n}</p><p className="text-[11px] text-muted">{label}</p></div>;
  return <div className="grid grid-cols-2 gap-2">{cell(c.tp, "thư rác bị chặn", true)}{cell(c.fn, "thư rác lọt vào", false)}{cell(c.fp, "thư thật bị chặn nhầm", false)}{cell(c.tn, "thư thật vào hộp", true)}</div>;
}

function Boxes({ c }: { c: ReturnType<typeof confusion> }) {
  const list = (blocked: boolean) => c.r.filter((x) => x.blocked === blocked).map((x) => (
    <li key={x.m.id} className="flex items-start gap-2 rounded-lg bg-white p-2 text-xs shadow-sm dark:bg-slate-900">
      <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", x.m.spam ? "bg-rose-500" : "bg-emerald-500")} title={x.m.spam ? "thật ra là thư rác" : "thật ra là thư thật"} />
      <span className="min-w-0 flex-1"><b className="block text-fg">{x.m.from}</b><span className="text-muted">{x.m.subject}</span></span>
      <span className="shrink-0 rounded bg-slate-100 px-1.5 font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{x.s}</span>
    </li>
  ));
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-3 dark:bg-emerald-500/5"><p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300"><Inbox className="size-4" aria-hidden /> Hộp thư đến</p><ul className="space-y-1.5">{list(false)}</ul></div>
      <div className="rounded-2xl border border-rose-300 bg-rose-50/60 p-3 dark:bg-rose-500/5"><p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-rose-700 dark:text-rose-300"><MailWarning className="size-4" aria-hidden /> Thư rác</p><ul className="space-y-1.5">{list(true)}</ul></div>
    </div>
  );
}

const W0 = Object.fromEntries(WORDS.map((x) => [x.id, x.w]));
function Explore() {
  const [w, setW] = useState<Record<string, number>>(W0);
  const [th, setTh] = useState(3);
  const c = confusion(w, th);
  return (
    <SimLayout
      stage={<Stage className="space-y-3 p-4"><Boxes c={c} /><p className="text-xs text-muted">Chấm đỏ/xanh cho biết thư đó thật ra là thư rác hay thư thật; số bên phải là điểm đáng ngờ.</p></Stage>}
      controls={
        <>
          <Panel title="Kết quả"><Matrix c={c} /></Panel>
          <Panel title="Ngưỡng chặn"><SimSlider label="Chặn khi điểm ≥" value={th} min={1} max={8} onChange={setTh} /></Panel>
          <Panel title="Trọng số từ khóa">{WORDS.map((x) => <SimSlider key={x.id} label={`“${x.label}”`} value={w[x.id]} min={0} max={5} onChange={(v) => setW({ ...w, [x.id]: v })} />)}</Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Chặn nhầm" value={c.fp} tone={c.fp ? "rose" : "green"} /><Readout label="Lọt lưới" value={c.fn} tone={c.fn ? "amber" : "green"} /></div>
          <ResetAll onClick={() => { setW(W0); setTh(3); }} />
        </>
      }
    />
  );
}

const TASKS = [{ kind: "zero-fp" as const }, { kind: "perfect" as const }, { kind: "why" as const }];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [th, setTh] = useState(1);
  const [w, setW] = useState<Record<string, number>>(W0);
  const [ans, setAns] = useState<string | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTh(1); setW(W0); setAns(null); }
  const cf = confusion(w, th);
  const prompt = t.kind === "zero-fp" ? "Chỉ được chỉnh ngưỡng: không thư thật nào bị chặn nhầm, mà chặn được nhiều thư rác nhất." : t.kind === "perfect" ? "Chỉnh cả trọng số và ngưỡng để chặn đúng cả 4 thư rác và không chặn nhầm thư nào." : "Vì sao chặn nhầm thư thật thường bị coi là tệ hơn để lọt một thư rác?";
  const check = () => {
    if (t.kind === "zero-fp") { const best = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8].map((x) => confusion(W0, x)).filter((x) => x.fp === 0).map((x) => x.tp)); return c.check(cf.fp === 0 && cf.tp === best, cf.fp ? `Còn ${cf.fp} thư thật bị chặn nhầm.` : cf.tp < best ? `Chặn được ${cf.tp}, vẫn có ngưỡng chặn được ${best} mà không chặn nhầm.` : "Đúng: ngưỡng này không chặn nhầm thư nào mà chặn được nhiều thư rác nhất."); }
    if (t.kind === "perfect") return c.check(cf.fp === 0 && cf.fn === 0, cf.fp === 0 && cf.fn === 0 ? "Hoàn hảo trên 8 thư này! Bộ lọc thật học trọng số từ hàng triệu thư được người dùng đánh dấu." : `Còn ${cf.fp} chặn nhầm, ${cf.fn} lọt lưới. Gợi ý: từ “link”, “ngay”, “miễn phí” xuất hiện cả trong thư thật.`);
    return c.check(ans === "mat", ans === "mat" ? "Đúng: thư thật bị chặn (lịch họp, thông báo trường) có thể làm em bỏ lỡ việc quan trọng mà không hề biết; thư rác lọt vào thì em còn tự nhận ra để xóa." : "Nghĩ xem khi nào em biết có lỗi xảy ra.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Bộ lọc tính điểm đáng ngờ của thư từ các dấu hiệu (từ khóa, người gửi, đường link).", "Ngưỡng cao: ít chặn nhầm nhưng lọt nhiều; ngưỡng thấp: chặn nhiều nhưng dễ nhầm.", "Bộ lọc thật dùng học máy để tự học trọng số từ dữ liệu."]}>
      {t.kind === "why" ? (
        <div className="grid gap-2 sm:grid-cols-3">{[["mat", "Mất thư quan trọng mà người dùng không hề biết"], ["cham", "Làm máy chủ chạy chậm"], ["ton", "Tốn dung lượng hộp thư"]].map(([id, l]) => <button key={id} type="button" aria-pressed={ans === id} onClick={() => setAns(id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", ans === id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{l}</button>)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <Stage className="p-3"><Boxes c={cf} /></Stage>
          <div className="space-y-2"><Matrix c={cf} /><SimSlider label="Ngưỡng" value={th} min={1} max={8} onChange={setTh} />{t.kind === "perfect" && WORDS.map((x) => <SimSlider key={x.id} label={`“${x.label}”`} value={w[x.id]} min={0} max={5} onChange={(v) => setW({ ...w, [x.id]: v })} />)}</div>
        </div>
      )}
    </ChallengeFrame>
  );
}

export function SpamFilterLab() {
  return <SimShell title="Bộ lọc thư rác" screens={[{ id: "kham-pha", label: "Khám phá", icon: ShieldCheck, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

"use client";
/**
 * Tin 10 Bài 1 – Máy xử lí thông tin (kiểu PhET).
 * Trạm thời tiết của trường: cảm biến đo (kéo thanh trượt) → dữ liệu được lưu → máy xử lí theo quy tắc → thông tin để quyết định.
 * Thấy rõ dữ liệu (con số ghi lại) khác thông tin (ý nghĩa rút ra), và cùng dữ liệu, quy tắc khác cho thông tin khác.
 * Thử thách: phân biệt dữ liệu / thông tin, xếp đúng các bước xử lí, chọn vật mang tin.
 */
import { useState } from "react";
import { ArrowRight, Cpu, Database, Monitor, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

type Rule = "rain" | "heat" | "plants";
const RULES: Record<Rule, { label: string; code: string }> = {
  rain: { label: "Dự báo mưa", code: "nếu độ ẩm > 80 và mây > 60 thì “có thể mưa”" },
  heat: { label: "Cảnh báo nắng nóng", code: "nếu nhiệt độ ≥ 35 thì “hạn chế ra sân”" },
  plants: { label: "Tưới vườn trường", code: "nếu độ ẩm < 40 và không mưa thì “bật tưới”" },
};
function infer(rule: Rule, t: number, h: number, c: number) {
  if (rule === "rain") return h > 80 && c > 60 ? { ok: true, text: "Chiều nay có thể mưa — nhớ mang áo mưa." } : { ok: false, text: "Khả năng mưa thấp." };
  if (rule === "heat") return t >= 35 ? { ok: true, text: "Nắng nóng — giờ ra chơi nên ở trong lớp." } : { ok: false, text: "Nhiệt độ bình thường, ra sân được." };
  const rainy = h > 80 && c > 60;
  return h < 40 && !rainy ? { ok: true, text: "Đất khô — bật máy tưới vườn trường." } : { ok: false, text: "Chưa cần tưới." };
}

const STAGES = [
  { id: "in", label: "Thu nhận", icon: Radio, note: "cảm biến đo" },
  { id: "store", label: "Lưu trữ", icon: Database, note: "ghi dữ liệu" },
  { id: "proc", label: "Xử lí", icon: Cpu, note: "theo quy tắc" },
  { id: "out", label: "Xuất", icon: Monitor, note: "thông tin" },
];

function Pipeline({ active }: { active: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {STAGES.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className={cn("flex w-24 flex-col items-center rounded-2xl border-2 px-2 py-3 text-center transition-all", i <= active ? "border-cyan-300 bg-cyan-500/20 text-white shadow-[0_0_18px_rgba(34,211,238,.35)]" : "border-slate-600 text-slate-400")}>
            <s.icon className="size-6" aria-hidden /><span className="mt-1 text-sm font-bold">{s.label}</span><span className="text-[10px] opacity-80">{s.note}</span>
          </div>
          {i < STAGES.length - 1 && <ArrowRight className={cn("size-5", i < active ? "text-cyan-300" : "text-slate-600")} aria-hidden />}
        </div>
      ))}
    </div>
  );
}

function Explore() {
  const [t, setT] = useState(31);
  const [h, setH] = useState(85);
  const [c, setC] = useState(70);
  const [rule, setRule] = useState<Rule>("rain");
  const [log, setLog] = useState<{ t: number; h: number; c: number }[]>([{ t: 31, h: 85, c: 70 }]);
  const [active, setActive] = useState(3);
  const out = infer(rule, t, h, c);
  const record = () => { setLog((l) => [...l.slice(-5), { t, h, c }]); setActive(1); };
  const avgT = Math.round((log.reduce((s, x) => s + x.t, 0) / log.length) * 10) / 10;
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-4 p-4 sm:p-6">
          <Pipeline active={active} />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Dữ liệu đã lưu (các con số)</p>
              <table className="w-full font-mono text-xs text-slate-200"><thead><tr className="text-slate-400"><th className="text-left">Lần</th><th>°C</th><th>Ẩm %</th><th>Mây %</th></tr></thead>
                <tbody>{log.map((x, i) => <tr key={i} className={cn(i === log.length - 1 && "text-cyan-300")}><td>{i + 1}</td><td className="text-center">{x.t}</td><td className="text-center">{x.h}</td><td className="text-center">{x.c}</td></tr>)}</tbody></table>
            </div>
            <div className={cn("rounded-2xl border-2 p-4 transition-colors", active >= 3 ? (out.ok ? "border-amber-300 bg-amber-400/15" : "border-emerald-400 bg-emerald-500/10") : "border-slate-700")}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Thông tin (ý nghĩa để quyết định)</p>
              <p className="mt-2 text-lg font-bold text-white" aria-live="polite">{active >= 3 ? out.text : "…"}</p>
              <p className="mt-2 font-mono text-[11px] text-slate-400">Quy tắc: {RULES[rule].code}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {active < 3 ? <button type="button" onClick={() => setActive((a) => a + 1)} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-900">Bước tiếp: {STAGES[active + 1].label}</button> : <button type="button" onClick={record} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900">Đo lần mới</button>}
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Cảm biến">
            <SimSlider label="Nhiệt độ" value={t} min={15} max={42} unit="°C" onChange={(v) => { setT(v); setActive(0); }} />
            <SimSlider label="Độ ẩm" value={h} min={10} max={100} unit="%" onChange={(v) => { setH(v); setActive(0); }} />
            <SimSlider label="Mây che" value={c} min={0} max={100} unit="%" onChange={(v) => { setC(v); setActive(0); }} />
          </Panel>
          <Panel title="Xử lí">
            <Segmented label="Quy tắc" value={rule} options={(Object.keys(RULES) as Rule[]).map((r) => ({ value: r, label: RULES[r].label }))} onChange={(v) => { setRule(v); setActive(2); }} />
            <p className="text-xs text-muted">Cùng một dữ liệu, quy tắc khác cho thông tin khác.</p>
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Số lần đo" value={log.length} /><Readout label="Nhiệt độ TB" value={`${avgT}°C`} tone="amber" /></div>
          <ResetAll onClick={() => { setT(31); setH(85); setC(70); setRule("rain"); setLog([{ t: 31, h: 85, c: 70 }]); setActive(3); }} />
        </>
      }
    />
  );
}

const ITEMS: { text: string; info: boolean; why: string }[] = [
  { text: "Nhiệt kế hiện 38,5", info: false, why: "Con số ghi lại được là dữ liệu." },
  { text: "“Em đang sốt, cần nghỉ ngơi”", info: true, why: "Ý nghĩa rút ra từ con số để quyết định là thông tin." },
  { text: "Bảng điểm 10 môn của lớp", info: false, why: "Các điểm số được ghi lại là dữ liệu." },
  { text: "“Lớp mình yếu nhất môn Lí, cần ôn thêm”", info: true, why: "Kết luận rút ra từ bảng điểm là thông tin." },
];
const CARRIERS = [{ id: "paper", label: "Tờ giấy ghi chép" }, { id: "usb", label: "USB 32 GB" }, { id: "cloud", label: "Ổ đĩa đám mây" }, { id: "air", label: "Không khí trong phòng" }];

type Task = { kind: "item"; i: number } | { kind: "order" } | { kind: "carrier" };
const TASKS: Task[] = [{ kind: "item", i: 0 }, { kind: "item", i: 1 }, { kind: "item", i: 3 }, { kind: "order" }, { kind: "carrier" }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [ans, setAns] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setAns(null); setOrder([]); }
  const it = t.kind === "item" ? ITEMS[t.i] : undefined;
  const shuffled = ["proc", "out", "in", "store"];
  const prompt = it ? `“${it.text}” là dữ liệu hay thông tin?` : t.kind === "order" ? "Bấm lần lượt các bước của quá trình xử lí thông tin trên máy tính." : "Cái nào KHÔNG phải vật mang tin?";
  const check = () => {
    if (it) return c.check(ans !== null && (ans === "info") === it.info, it.why);
    if (t.kind === "order") { const ok = order.join() === "in,store,proc,out"; return c.check(ok, ok ? "Đúng: thu nhận → lưu trữ → xử lí → xuất thông tin." : "Dữ liệu phải được thu nhận và lưu lại trước khi xử lí; kết quả mới được xuất ra."); }
    return c.check(ans === "air", ans === "air" ? "Đúng: vật mang tin là phương tiện lưu trữ, truyền dữ liệu như giấy, USB, đám mây." : "Vật này vẫn lưu được dữ liệu. Tìm thứ không ghi lại được gì.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Dữ liệu là những gì được ghi lại; thông tin là ý nghĩa rút ra từ dữ liệu.", "Máy tính xử lí thông tin qua 4 bước: thu nhận, lưu trữ, xử lí, xuất.", "Vật mang tin: giấy, USB, ổ đĩa, đám mây…"]}>
      <Stage className="p-4">
        {it && <div className="flex gap-2">{[["data", "Dữ liệu"], ["info", "Thông tin"]].map(([id, l]) => <button key={id} type="button" aria-pressed={ans === id} onClick={() => setAns(id)} className={cn("rounded-xl border-2 px-5 py-2 font-semibold", ans === id ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg")}>{l}</button>)}</div>}
        {t.kind === "order" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">{shuffled.map((id) => { const s = STAGES.find((x) => x.id === id)!; const n = order.indexOf(id); return <button key={id} type="button" disabled={n >= 0} onClick={() => setOrder([...order, id])} className={cn("flex items-center gap-2 rounded-xl border-2 px-4 py-2 font-semibold", n >= 0 ? "border-brand bg-brand/10 text-fg" : "border-line bg-surface text-fg")}><s.icon className="size-4" aria-hidden />{s.label}{n >= 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-xs text-brand-ink">{n + 1}</span>}</button>; })}</div>
            {order.length > 0 && <button type="button" onClick={() => setOrder([])} className="text-sm font-medium text-cyan-fg hover:underline">Xếp lại</button>}
          </div>
        )}
        {t.kind === "carrier" && <div className="grid gap-2 sm:grid-cols-2">{CARRIERS.map((x) => <button key={x.id} type="button" aria-pressed={ans === x.id} onClick={() => setAns(x.id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", ans === x.id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{x.label}</button>)}</div>}
      </Stage>
    </ChallengeFrame>
  );
}

export function InfoProcessorLab() {
  return <SimShell title="Máy xử lí thông tin" screens={[{ id: "kham-pha", label: "Trạm thời tiết", icon: Radio, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

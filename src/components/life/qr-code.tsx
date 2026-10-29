"use client";
/** Mã QR chịu được vết bẩn: dữ liệu thành ma trận ô, mức sửa lỗi càng cao càng chịu hỏng nhiều nhưng mã càng dày. */
import { useState } from "react";
import { QrCode, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "@/components/phet/kit";

type Ec = "L" | "M" | "Q" | "H";
const EC: Record<Ec, { cap: number; size: number; label: string }> = { L: { cap: 7, size: 21, label: "L · 7%" }, M: { cap: 15, size: 25, label: "M · 15%" }, Q: { cap: 25, size: 29, label: "Q · 25%" }, H: { cap: 30, size: 33, label: "H · 30%" } };

function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; }
/** Ma trận mô phỏng: ba ô định vị ở góc, vạch căn, phần còn lại là dữ liệu (giả lập từ nội dung). */
function matrix(text: string, n: number) {
  const m: { on: boolean; kind: "finder" | "timing" | "data" }[][] = [];
  let h = hash(text + n);
  for (let r = 0; r < n; r++) {
    m.push([]);
    for (let c = 0; c < n; c++) {
      const inF = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      if (inF) {
        const rr = r >= n - 8 ? r - (n - 7) : r, cc = c >= n - 8 ? c - (n - 7) : c;
        const ring = Math.max(Math.abs(rr - 3), Math.abs(cc - 3));
        m[r].push({ on: rr >= 0 && cc >= 0 && rr < 7 && cc < 7 && ring !== 2 && ring !== 4, kind: "finder" });
      } else if (r === 6 || c === 6) m[r].push({ on: (r + c) % 2 === 0, kind: "timing" });
      else { h = Math.imul(h ^ (r * 31 + c), 2654435761) >>> 0; m[r].push({ on: (h >>> 7) % 2 === 1, kind: "data" }); }
    }
  }
  return m;
}
interface Spot { x: number; y: number; s: number }
function evaluate(n: number, spot: Spot | null, cap: number) {
  const m = matrix("", n);
  let data = 0, hit = 0;
  const finderHit = [0, 0, 0];
  const inSpot = (r: number, c: number) => !!spot && c / n >= spot.x / 100 && c / n < (spot.x + spot.s) / 100 && r / n >= spot.y / 100 && r / n < (spot.y + spot.s) / 100;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const k = m[r][c].kind;
    if (k === "data") { data++; if (inSpot(r, c)) hit++; }
    if (k === "finder" && inSpot(r, c)) { const i = r < 8 && c < 8 ? 0 : r < 8 ? 1 : 2; finderHit[i]++; }
  }
  const dmg = Math.round((hit / data) * 100);
  const finderBroken = finderHit.some((x) => x > 24);
  return { dmg, finderBroken, ok: !finderBroken && dmg <= cap };
}

function Qr({ text, ec, spot }: { text: string; ec: Ec; spot: Spot | null }) {
  const n = EC[ec].size;
  const m = matrix(text, n);
  return (
    <div className="mx-auto aspect-square w-full max-w-[320px] rounded-xl bg-white p-3 shadow-inner">
      <div className="relative size-full">
        <div className="grid size-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {m.flatMap((row, r) => row.map((x, c) => <span key={`${r}-${c}`} className={cn(x.on ? (x.kind === "finder" ? "bg-blue-700" : "bg-slate-900") : "bg-white")} />))}
        </div>
        {spot && <span aria-label="vết bẩn" className="absolute rounded-[40%] bg-amber-700/85" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.s}%`, height: `${spot.s}%` }} />}
      </div>
    </div>
  );
}

function Scanner({ r, cap }: { r: ReturnType<typeof evaluate>; cap: number }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border-2 p-3", r.ok ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" : "border-rose-400 bg-rose-50 dark:bg-rose-500/10")} role="status">
      <ScanLine className={cn("size-8 shrink-0", r.ok ? "text-emerald-600" : "text-rose-600")} aria-hidden />
      <div className="text-sm"><p className="font-bold text-fg">{r.ok ? "Quét được!" : "Không quét được"}</p>
        <p className="text-muted">{r.finderBroken ? "Vết bẩn che ô định vị ở góc — điện thoại không tìm ra mã." : `Hỏng ${r.dmg}% ô dữ liệu, mức sửa lỗi chịu được ${cap}%.`}</p></div>
    </div>
  );
}

function Explore() {
  const [text, setText] = useState("https://edunova.vn");
  const [ec, setEc] = useState<Ec>("M");
  const [stain, setStain] = useState(true);
  const [x, setX] = useState(55); const [y, setY] = useState(50); const [s, setS] = useState(22);
  const spot = stain ? { x, y, s } : null;
  const r = evaluate(EC[ec].size, spot, EC[ec].cap);
  return (
    <SimLayout
      stage={<Stage className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center"><Qr text={text} ec={ec} spot={spot} /><div className="space-y-3"><Scanner r={r} cap={EC[ec].cap} /><p className="text-xs text-muted">Ba ô vuông xanh ở góc giúp camera tìm và xoay mã. Phần còn lại là dữ liệu kèm các ô dư để sửa lỗi.</p></div></Stage>}
      controls={
        <>
          <Panel title="Nội dung"><Input aria-label="Nội dung mã QR" value={text} onChange={(e) => setText(e.target.value)} /></Panel>
          <Panel title="Mức sửa lỗi"><Segmented label="Chịu hỏng tối đa" value={ec} options={(Object.keys(EC) as Ec[]).map((k) => ({ value: k, label: EC[k].label }))} onChange={setEc} /><p className="text-xs text-muted">Mức cao hơn thêm nhiều ô dư nên mã dày hơn: {EC[ec].size}×{EC[ec].size} ô.</p></Panel>
          <Panel title="Vết bẩn">
            <SimToggle label="Dán vết bẩn" checked={stain} onChange={setStain} />
            {stain && <><SimSlider label="Ngang" value={x} min={0} max={90} onChange={setX} unit="%" /><SimSlider label="Dọc" value={y} min={0} max={90} onChange={setY} unit="%" /><SimSlider label="Kích thước" value={s} min={5} max={50} onChange={setS} unit="%" /></>}
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Ô hỏng" value={`${r.dmg}%`} tone={r.ok ? "green" : "rose"} /><Readout label="Chịu được" value={`${EC[ec].cap}%`} /></div>
          <ResetAll onClick={() => { setText("https://edunova.vn"); setEc("M"); setStain(true); setX(55); setY(50); setS(22); }} />
        </>
      }
    />
  );
}

type Task = { kind: "pick"; dmg: number } | { kind: "finder" } | { kind: "place" } | { kind: "trade" };
const TASKS: Task[] = [{ kind: "pick", dmg: 20 }, { kind: "finder" }, { kind: "place" }, { kind: "trade" }];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [ans, setAns] = useState<string | null>(null);
  const [x, setX] = useState(10); const [y, setY] = useState(10);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setAns(null); setX(10); setY(10); }
  const opts: Record<string, { id: string; l: string }[]> = {
    pick: (Object.keys(EC) as Ec[]).map((k) => ({ id: k, l: `Mức ${EC[k].label}` })),
    finder: [{ id: "goc", l: "Ba ô vuông lớn ở các góc" }, { id: "giua", l: "Phần giữa mã" }, { id: "canh", l: "Viền trắng bên ngoài" }],
    trade: [{ id: "day", l: "Mã có nhiều ô hơn, phải in to hơn hoặc ô nhỏ hơn" }, { id: "cham", l: "Điện thoại đọc chậm hơn 10 lần" }, { id: "khong", l: "Không có nhược điểm gì" }],
  };
  const spot = { x, y, s: 30 };
  const placed = evaluate(EC.M.size, spot, EC.M.cap);
  const prompt = t.kind === "pick" ? "Mã QR in trên thùng hàng ngoài trời thường bẩn khoảng 20%. Chọn mức sửa lỗi THẤP NHẤT vẫn quét được." : t.kind === "finder" ? "Dán logo lên mã QR: không bao giờ được che phần nào?" : t.kind === "place" ? "Mã mức M. Kéo logo (30%) đến chỗ mà mã vẫn quét được." : "Nhược điểm của mức sửa lỗi H so với L là gì?";
  const check = () => {
    if (t.kind === "pick") return c.check(ans === "Q", ans === "Q" ? "Đúng: Q chịu 25% ≥ 20%; M chỉ 15% nên không đủ, H thì dư và mã dày hơn." : "Cần mức chịu được ít nhất 20% hỏng, nhưng thấp nhất để mã không quá dày.");
    if (t.kind === "finder") return c.check(ans === "goc", ans === "goc" ? "Đúng: camera dựa vào ba ô định vị để tìm mã; dữ liệu hỏng còn sửa được, ô định vị hỏng thì không." : "Phần dữ liệu có ô dư để sửa lỗi; thứ gì không có ô dư?");
    if (t.kind === "place") return c.check(placed.ok, placed.ok ? `Quét được: chỉ hỏng ${placed.dmg}% dữ liệu.` : placed.finderBroken ? "Đang che ô định vị ở góc." : `Hỏng ${placed.dmg}%, quá 15%.`);
    return c.check(ans === "day", ans === "day" ? "Đúng: ô sửa lỗi chiếm chỗ, cùng nội dung thì mã H có nhiều ô hơn mã L." : "Nghĩ xem các ô sửa lỗi nằm ở đâu.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Mã QR lưu dữ liệu thành ma trận ô đen (1) trắng (0).", "Ô sửa lỗi cho phép đọc được dù mã hỏng một phần: L 7%, M 15%, Q 25%, H 30%.", "Ba ô định vị ở góc không có ô dư — che mất là không quét được."]}>
      {t.kind === "place" ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]"><Stage className="p-4"><Qr text="logo" ec="M" spot={spot} /></Stage><div className="space-y-2"><SimSlider label="Ngang" value={x} min={0} max={70} onChange={setX} unit="%" /><SimSlider label="Dọc" value={y} min={0} max={70} onChange={setY} unit="%" /><Scanner r={placed} cap={15} /></div></div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">{opts[t.kind].map((o) => <button key={o.id} type="button" aria-pressed={ans === o.id} onClick={() => setAns(o.id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", ans === o.id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{o.l}</button>)}</div>
      )}
    </ChallengeFrame>
  );
}

export function QrCodeLab() {
  return <SimShell title="Mã QR chịu được vết bẩn" screens={[{ id: "kham-pha", label: "Khám phá", icon: QrCode, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

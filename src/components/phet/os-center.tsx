"use client";
/**
 * Tin 11 Bài 1–2 – Trung tâm điều hành máy tính (kiểu PhET).
 * Màn Bộ nhớ: mở/tắt phần mềm, RAM chia thành khối màu theo tiến trình, CPU là đồng hồ, tràn RAM thì dữ liệu đẩy xuống ổ đĩa (bộ nhớ ảo) và máy chậm.
 * Màn Tệp: cây thư mục vẽ được, chọn một mục để xem đường dẫn, tạo/chuyển/đổi tên/xóa/khôi phục.
 * Thử thách: tình huống hỏi hệ điều hành đang làm chức năng nào, giải phóng RAM đúng cách, đọc đường dẫn.
 */
import { useState } from "react";
import { FileText, Folder, HardDrive, MemoryStick, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { children, createFolder, deleteNode, INITIAL_FS, moveNode, nodeById, OS_FUNCTION_LABEL, OS_SCENARIOS, pathOf, renameNode, restoreNode, ROOT, TRASH, type FsNode, type OsFunction } from "@/lib/sim/os-sim";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

interface App { id: string; name: string; ram: number; cpu: number; color: string; system?: boolean; unsaved?: boolean }
const SYSTEM: App[] = [
  { id: "kernel", name: "Nhân hệ điều hành", ram: 1400, cpu: 3, color: "#64748b", system: true },
  { id: "av", name: "Diệt virus", ram: 450, cpu: 2, color: "#94a3b8", system: true },
];
const APPS: App[] = [
  { id: "chrome", name: "Trình duyệt (24 tab)", ram: 3600, cpu: 18, color: "#2563eb" },
  { id: "game", name: "Game đua xe", ram: 2600, cpu: 30, color: "#db2777" },
  { id: "music", name: "Nghe nhạc", ram: 250, cpu: 2, color: "#16a34a" },
  { id: "word", name: "Soạn thảo (chưa lưu)", ram: 500, cpu: 1, color: "#7c3aed", unsaved: true },
  { id: "paint", name: "Vẽ ảnh", ram: 900, cpu: 6, color: "#f59e0b" },
  { id: "exam", name: "Phần mềm thi", ram: 1800, cpu: 15, color: "#0d9488" },
];
const gb = (mb: number) => `${(mb / 1024).toFixed(1)} GB`;

function useMachine(start: string[] = ["chrome", "music"]) {
  const [running, setRunning] = useState<string[]>(start);
  const procs = [...SYSTEM, ...running.map((id) => APPS.find((a) => a.id === id)!)];
  return { running, setRunning, procs };
}

/** Thanh RAM chia khối theo tiến trình; phần vượt quá rơi xuống "ổ đĩa". */
function RamBar({ procs, ramMb, showSwap }: { procs: App[]; ramMb: number; showSwap: boolean }) {
  const used = procs.reduce((s, p) => s + p.ram, 0);
  const swap = Math.max(0, used - ramMb);
  const starts = procs.map((_, i) => procs.slice(0, i).reduce((a, p) => a + p.ram, 0));
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300"><MemoryStick className="size-4" aria-hidden /> RAM {gb(ramMb)}</p>
      <div className="relative flex h-14 overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-800">
        {procs.map((p, i) => {
          const start = starts[i];
          const inRam = Math.max(0, Math.min(p.ram, ramMb - start));
          if (!inRam) return null;
          return <span key={p.id} title={`${p.name}: ${gb(p.ram)}`} className="flex items-center justify-center overflow-hidden border-r border-slate-900/40 text-[10px] font-bold text-white transition-all" style={{ width: `${(inRam / ramMb) * 100}%`, background: p.color }}>{inRam / ramMb > 0.08 ? p.name.split(" ")[0] : ""}</span>;
        })}
      </div>
      {showSwap && (
        <div className="mt-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300"><HardDrive className="size-4" aria-hidden /> Bộ nhớ ảo trên ổ đĩa (chậm hơn RAM khoảng 100 lần)</p>
          <div className="h-6 overflow-hidden rounded-lg border border-dashed border-slate-500 bg-slate-900">
            <div className="h-full bg-[repeating-linear-gradient(45deg,#f97316_0_8px,#ea580c_8px_16px)] transition-all" style={{ width: `${Math.min(100, (swap / ramMb) * 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function CpuGauge({ pct, slow }: { pct: number; slow: boolean }) {
  const th = Math.PI - (pct / 100) * Math.PI;
  return (
    <svg viewBox="0 0 120 70" className="h-24 w-40" role="img" aria-label={`CPU ${pct}%`}>
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={pct > 85 ? "#f43f5e" : pct > 60 ? "#f59e0b" : "#22c55e"} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 157} 157`} />
      <line x1="60" y1="60" x2={60 + 40 * Math.cos(th)} y2={60 - 40 * Math.sin(th)} stroke="white" strokeWidth="3" strokeLinecap="round" style={{ transition: "all .4s" }} />
      <circle cx="60" cy="60" r="5" fill="white" />
      <text x="60" y="30" textAnchor="middle" className="fill-white text-[13px] font-bold">CPU {pct}%</text>
      {slow && <text x="60" y="69" textAnchor="middle" className="fill-orange-300 text-[8px] font-bold">MÁY ĐANG CHẬM</text>}
    </svg>
  );
}

function MemoryScreen() {
  const m = useMachine();
  const [ramGb, setRamGb] = useState(8);
  const [swap, setSwap] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const ramMb = ramGb * 1024;
  const used = m.procs.reduce((s, p) => s + p.ram, 0);
  const cpu = Math.min(100, m.procs.reduce((s, p) => s + p.cpu, 0));
  const slow = used > ramMb;
  const toggle = (a: App) => {
    if (m.running.includes(a.id)) { m.setRunning(m.running.filter((x) => x !== a.id)); setMsg(a.unsaved ? `Đã tắt ${a.name} khi chưa lưu: dữ liệu trong RAM mất luôn!` : `Đã tắt ${a.name}, hệ điều hành thu hồi ${gb(a.ram)} RAM.`); }
    else { m.setRunning([...m.running, a.id]); setMsg(`Hệ điều hành cấp ${gb(a.ram)} RAM và chia thời gian CPU cho ${a.name}.`); }
  };
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <CpuGauge pct={cpu} slow={slow} />
            <div className="min-w-0 flex-1 text-sm text-slate-300">
              <p className="font-semibold text-white">{m.procs.length} tiến trình đang chạy</p>
              <p>Hệ điều hành luân phiên cho mỗi tiến trình dùng CPU vài phần nghìn giây, nên trông như chạy cùng lúc.</p>
            </div>
          </div>
          <RamBar procs={m.procs} ramMb={ramMb} showSwap={swap} />
          {msg && <p role="status" className={cn("rounded-xl px-3 py-2 text-sm font-medium", msg.includes("mất") ? "bg-rose-500/20 text-rose-200" : "bg-cyan-500/15 text-cyan-100")}>{msg}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {APPS.map((a) => {
              const on = m.running.includes(a.id);
              return (
                <button key={a.id} type="button" aria-pressed={on} onClick={() => toggle(a)} className={cn("flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition-all", on ? "border-white/70 text-white" : "border-slate-600 text-slate-300 hover:border-slate-400")} style={on ? { background: a.color } : undefined}>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{a.name}</span><span className="text-xs opacity-80">{gb(a.ram)} · CPU {a.cpu}%</span></span>
                  {on ? <X className="size-4 shrink-0" aria-label="tắt" /> : <Plus className="size-4 shrink-0" aria-label="mở" />}
                </button>
              );
            })}
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Đo">
            <div className="grid grid-cols-2 gap-2">
              <Readout label="RAM dùng" value={gb(used)} tone={slow ? "rose" : "blue"} />
              <Readout label="Còn trống" value={gb(Math.max(0, ramMb - used))} tone="green" />
            </div>
          </Panel>
          <Panel title="Máy tính">
            <Segmented label="Dung lượng RAM" value={ramGb} options={[{ value: 4, label: "4 GB" }, { value: 8, label: "8 GB" }, { value: 16, label: "16 GB" }]} onChange={setRamGb} />
            <SimToggle label="Hiện bộ nhớ ảo" checked={swap} onChange={setSwap} />
          </Panel>
          <Panel title="Tiến trình hệ thống">
            <p className="text-xs text-muted">Nhân hệ điều hành và phần mềm diệt virus luôn chạy; tắt chúng làm máy treo hoặc mất an toàn.</p>
          </Panel>
          <ResetAll onClick={() => { m.setRunning(["chrome", "music"]); setRamGb(8); setSwap(true); setMsg(null); }} />
        </>
      }
    />
  );
}

function Tree({ fs, id, sel, onSel, depth = 0 }: { fs: FsNode[]; id: string; sel: string; onSel: (id: string) => void; depth?: number }) {
  const n = nodeById(fs, id)!;
  const kids = children(fs, id);
  return (
    <li>
      <button type="button" aria-pressed={sel === id} onClick={() => onSel(id)} className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors", sel === id ? "bg-brand text-brand-ink" : "text-fg hover:bg-sky-100 dark:hover:bg-slate-800")} style={{ marginLeft: depth * 18 }}>
        {n.id === TRASH ? <Trash2 className="size-4" aria-hidden /> : n.kind === "folder" ? <Folder className={cn("size-4", sel !== id && "text-amber-500")} aria-hidden /> : <FileText className={cn("size-4", sel !== id && "text-sky-600")} aria-hidden />}
        {n.name}
      </button>
      {kids.length > 0 && <ul className="border-l border-dashed border-sky-200 dark:border-slate-700" style={{ marginLeft: depth * 18 + 14 }}>{kids.map((k) => <Tree key={k.id} fs={fs} id={k.id} sel={sel} onSel={onSel} depth={0} />)}</ul>}
    </li>
  );
}

function FilesScreen() {
  const [fs, setFs] = useState<FsNode[]>(INITIAL_FS);
  const [sel, setSel] = useState("down");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("docs");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const n = nodeById(fs, sel);
  const run = (r: ReturnType<typeof createFolder>) => { setMsg({ ok: r.ok, text: r.message }); if (r.ok) setFs(r.fs); };
  const folders = fs.filter((x) => x.kind === "folder" && x.id !== TRASH);
  return (
    <SimLayout
      stage={
        <Stage className="p-4">
          <p className="mb-2 rounded-lg bg-white px-3 py-1.5 font-mono text-sm text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100" aria-live="polite">{n ? pathOf(fs, sel) : ""}</p>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
            <ul className="space-y-0.5"><Tree fs={fs} id={ROOT} sel={sel} onSel={setSel} /></ul>
            <ul className="space-y-0.5 rounded-xl border border-dashed border-sky-200 p-2 dark:border-slate-700"><Tree fs={fs} id={TRASH} sel={sel} onSel={setSel} /></ul>
          </div>
          {msg && <p role="status" className={cn("mt-3 rounded-xl px-3 py-2 text-sm", msg.ok ? "bg-emerald-500/10 text-success-fg" : "bg-rose-500/10 text-danger-fg")}>{msg.text}</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title={`Đang chọn: ${n?.name ?? ""}`}>
            <Input aria-label="Tên" placeholder="Tên mới / tên thư mục" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" disabled={n?.kind !== "folder"} onClick={() => run(createFolder(fs, sel, name))}>Tạo thư mục</Button>
              <Button size="sm" variant="secondary" onClick={() => run(renameNode(fs, sel, name))}>Đổi tên</Button>
            </div>
          </Panel>
          <Panel title="Chuyển tới">
            <select aria-label="Thư mục đích" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm">{folders.map((f) => <option key={f.id} value={f.id}>{pathOf(fs, f.id)}</option>)}</select>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => run(moveNode(fs, sel, target))}>Chuyển</Button>
          </Panel>
          <Panel title="Xóa">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="danger" onClick={() => run(deleteNode(fs, sel))}>Xóa</Button>
              <Button size="sm" variant="secondary" onClick={() => run(restoreNode(fs, sel))}>Khôi phục</Button>
            </div>
            <p className="text-xs text-muted">Xóa lần đầu chỉ chuyển vào Thùng rác; xóa trong Thùng rác mới mất hẳn.</p>
          </Panel>
          <ResetAll onClick={() => { setFs(INITIAL_FS); setSel("down"); setName(""); setMsg(null); }} />
        </>
      }
    />
  );
}

type Task = { kind: "fn"; i: number } | { kind: "ram" } | { kind: "path" };
const TASKS: Task[] = [{ kind: "fn", i: 0 }, { kind: "ram" }, { kind: "fn", i: 1 }, { kind: "path" }, { kind: "fn", i: 2 }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const m = useMachine(["chrome", "game", "word", "music"]);
  const [pick, setPick] = useState<OsFunction | null>(null);
  const [lost, setLost] = useState(false);
  const [typed, setTyped] = useState("");
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPick(null); setLost(false); setTyped(""); m.setRunning(["chrome", "game", "word", "music"]); }
  const used = m.procs.reduce((s, p) => s + p.ram, 0) + 1800;
  const prompt = t.kind === "fn" ? `Hệ điều hành đang làm chức năng nào? “${OS_SCENARIOS[t.i].text}”` : t.kind === "ram" ? "Máy 8 GB cần mở Phần mềm thi (1,8 GB). Tắt bớt phần mềm cho đủ RAM, nhưng không được làm mất bài văn chưa lưu." : "Tệp baitap.py nằm trong thư mục Tin11, thư mục này nằm trong Documents của An (C:\\Users\\An). Gõ đường dẫn đầy đủ của tệp.";
  const check = () => {
    if (t.kind === "fn") { const s = OS_SCENARIOS[t.i]; return c.check(pick === s.answer, pick === s.answer ? s.why : "Chưa đúng. Nghĩ xem hệ điều hành phải quản lí thứ gì trong tình huống này."); }
    if (t.kind === "ram") { if (lost) return c.check(false, "Em đã tắt phần soạn thảo khi chưa lưu nên mất bài văn. Bấm “Làm lại câu này”."); const ok = used <= 8192; return c.check(ok, ok ? "Đủ RAM để chạy phần mềm thi mà không cần bộ nhớ ảo." : `Vẫn thiếu ${gb(used - 8192)}. Tắt phần mềm tốn RAM nhất trước.`); }
    const ok = typed.trim().replace(/\//g, "\\").toLowerCase() === "c:\\users\\an\\documents\\tin11\\baitap.py";
    return c.check(ok, ok ? "Đúng: ổ đĩa, rồi từng thư mục từ ngoài vào trong, cuối cùng là tên tệp." : "Bắt đầu bằng C:\\ rồi lần lượt Users, An, Documents, Tin11, tên tệp; ngăn cách bằng \\.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Hệ điều hành quản lí tệp, tiến trình, bộ nhớ, thiết bị, người dùng và cung cấp giao diện.", "Thiếu RAM thì dữ liệu bị đẩy xuống ổ đĩa (bộ nhớ ảo) nên máy chậm; tắt phần mềm thì RAM được thu hồi.", "Đường dẫn đi từ ổ đĩa qua từng thư mục tới tệp."]}>
      <Stage dark className="p-4">
        {t.kind === "fn" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(OS_FUNCTION_LABEL) as OsFunction[]).map((f) => <button key={f} type="button" aria-pressed={pick === f} onClick={() => setPick(f)} className={cn("rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold", pick === f ? "border-cyan-300 bg-cyan-500/20 text-white" : "border-slate-600 text-slate-200 hover:border-slate-400")}>{OS_FUNCTION_LABEL[f]}</button>)}
          </div>
        )}
        {t.kind === "ram" && (
          <div className="space-y-3">
            <RamBar procs={[...m.procs, APPS.find((a) => a.id === "exam")!]} ramMb={8192} showSwap />
            {lost && <Button size="sm" variant="secondary" onClick={() => { setLost(false); m.setRunning(["chrome", "game", "word", "music"]); }}>Làm lại câu này</Button>}
            <div className="flex flex-wrap gap-2">{m.running.map((id) => { const a = APPS.find((x) => x.id === id)!; return <button key={id} type="button" onClick={() => { m.setRunning(m.running.filter((x) => x !== id)); if (a.unsaved) setLost(true); }} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white" style={{ background: a.color }}>{a.name} · {gb(a.ram)} <X className="size-4" aria-label="tắt" /></button>; })}</div>
          </div>
        )}
        {t.kind === "path" && <Input aria-label="Đường dẫn" className="font-mono" placeholder="C:\..." value={typed} onChange={(e) => setTyped(e.target.value)} />}
      </Stage>
    </ChallengeFrame>
  );
}

export function OsCenterLab() {
  return <SimShell title="Trung tâm điều hành máy tính" screens={[{ id: "bo-nho", label: "Bộ nhớ & CPU", icon: MemoryStick, render: () => <MemoryScreen /> }, { id: "tep", label: "Tệp & thư mục", icon: Folder, render: () => <FilesScreen /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

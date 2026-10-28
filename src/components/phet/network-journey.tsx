"use client";
/**
 * Tin 12 Bài 3–4 – Hành trình gói tin (kiểu PhET).
 * Màn Gói tin: chọn máy gửi, đích, bấm Gửi; gói tin chạy từng chặng trên sơ đồ, thẻ gói tin hiện IP nguồn/đích, TTL;
 * switch học địa chỉ MAC; chọn một sự cố để thấy gói tin dừng ở đâu và lệnh ping báo gì.
 * Thử thách: chỉ đường đi gói tin từng chặng, chẩn đoán sự cố bằng ping.
 */
import { useEffect, useState } from "react";
import { Network, Pause, Send, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { checkHop, DEVICES, GATEWAY, getDevice, ipConfig, macTable, NET_FAULTS, PATH_TASKS, ping, type DeviceId, type FaultKind } from "@/lib/sim/network";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const LINKS: [DeviceId, DeviceId][] = [["pc1", "switch"], ["pc2", "switch"], ["printer", "switch"], ["switch", "router"], ["router", "internet"], ["internet", "server"]];
const ICON: Record<string, string> = { pc: "💻", printer: "🖨️", switch: "🔀", router: "📡", internet: "🌐", server: "🗄️" };
const FAULTS: { value: FaultKind; label: string }[] = [{ value: "none", label: "Không lỗi" }, { value: "pc1-cable", label: "Đứt dây máy An" }, { value: "pc2-gateway", label: "Bình sai gateway" }, { value: "wan-down", label: "Mất WAN" }];

function route(from: "pc1" | "pc2", to: DeviceId): DeviceId[] {
  if (to === from) return [from];
  if (to === "server") return [from, "switch", "router", "internet", "server"];
  return [from, "switch", to];
}
/** Chặng gói tin dừng lại vì sự cố (chỉ số trong route), hoặc null nếu tới nơi. */
function stopAt(path: DeviceId[], fault: FaultKind, from: "pc1" | "pc2"): number | null {
  if (fault === "pc1-cable" && (from === "pc1" || path.includes("pc1"))) return from === "pc1" ? 0 : path.indexOf("pc1") - 1;
  if (path.includes("router") && fault === "pc2-gateway" && from === "pc2") return 1;
  if (path.includes("internet") && fault === "wan-down") return path.indexOf("router");
  return null;
}

function Diagram({ path = [], at, stop, hi, onPick }: { path?: DeviceId[]; at?: number; stop?: number | null; hi?: DeviceId[]; onPick?: (d: DeviceId) => void }) {
  const pos = (id: DeviceId) => getDevice(id);
  const p = at !== undefined && path[at] ? pos(path[at]) : undefined;
  const lit = new Set(path.slice(0, (at ?? -1) + 1));
  return (
    <svg viewBox="0 0 1000 560" className="w-full" role="img" aria-label="Sơ đồ mạng phòng Tin">
      <rect x={40} y={40} width={590} height={510} rx={24} fill="#0ea5e9" opacity={0.06} stroke="#38bdf8" strokeDasharray="8 6" />
      <text x={60} y={70} className="fill-sky-500 text-[18px] font-bold">Mạng LAN 192.168.1.x</text>
      {LINKS.map(([a, b]) => { const on = lit.has(a) && lit.has(b); return <line key={a + b} x1={pos(a).x} y1={pos(a).y} x2={pos(b).x} y2={pos(b).y} stroke={on ? "#f59e0b" : "#94a3b8"} strokeWidth={on ? 6 : 3} />; })}
      {DEVICES.map((d) => (
        <g key={d.id} onClick={onPick ? () => onPick(d.id) : undefined} className={onPick ? "cursor-pointer" : undefined}>
          <circle cx={d.x} cy={d.y} r={44} fill="white" stroke={hi?.includes(d.id) ? "#2563eb" : "#cbd5e1"} strokeWidth={hi?.includes(d.id) ? 5 : 2} className="drop-shadow" />
          <text x={d.x} y={d.y + 12} textAnchor="middle" className="text-[36px]">{ICON[d.kind]}</text>
          <text x={d.x} y={d.y + 66} textAnchor="middle" className="fill-slate-700 text-[17px] font-semibold dark:fill-slate-200">{d.name}</text>
          {d.ip && <text x={d.x} y={d.y + 86} textAnchor="middle" className="fill-slate-500 font-mono text-[14px]">{d.ip}</text>}
        </g>
      ))}
      {p && <g style={{ transition: "transform .5s" }} transform={`translate(${p.x - 22} ${p.y - 78})`}><rect width={44} height={30} rx={6} fill="#f59e0b" stroke="white" strokeWidth={3} /><text x={22} y={21} textAnchor="middle" className="text-[16px]">✉️</text></g>}
      {stop !== null && stop !== undefined && at !== undefined && at >= stop && path[stop + 1] && (() => { const a = pos(path[stop]), b = pos(path[stop + 1]); return <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 12} textAnchor="middle" className="fill-rose-600 text-[44px] font-black">✕</text>; })()}
    </svg>
  );
}

function Explore() {
  const [from, setFrom] = useState<"pc1" | "pc2">("pc1");
  const [to, setTo] = useState<DeviceId>("server");
  const [fault, setFault] = useState<FaultKind>("none");
  const [at, setAt] = useState<number | undefined>(undefined);
  const [sent, setSent] = useState<DeviceId[]>([]);
  const [showMac, setShowMac] = useState(true);
  const path = route(from, to);
  const stop = stopAt(path, fault, from);
  const end = stop ?? path.length - 1;
  const moving = at !== undefined && at < end;
  useEffect(() => {
    if (!moving) return;
    const id = setTimeout(() => setAt((a) => (a ?? 0) + 1), 650);
    return () => clearTimeout(id);
  }, [moving, at]);
  const done = at !== undefined && at >= end;
  const outside = path.includes("router");
  const ri = path.indexOf("router");
  const ttl = ri >= 0 && (at ?? 0) > ri ? 63 : 64;
  const cfg = ipConfig({ fault }, from);
  const send = () => { setAt(0); setSent((s) => [...s, from]); };
  const reset = (f: () => void) => { f(); setAt(undefined); };
  return (
    <SimLayout
      stage={
        <Stage className="p-2 sm:p-3">
          <Diagram path={path} at={at} stop={stop} hi={[from, to]} />
          <div className="grid gap-2 px-2 pb-2 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 font-mono text-xs text-slate-800 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="mb-1 font-sans text-xs font-bold uppercase text-amber-700">✉️ Gói tin</p>
              <p>IP nguồn: {cfg.ip}</p><p>IP đích: {getDevice(to).ip}</p>
              <p>Đi qua router? {outside ? "có (khác mạng)" : "không (cùng mạng)"}</p>
              {outside && <p>TTL: {ttl}{ttl < 64 ? " (router trừ 1)" : ""}</p>}
            </div>
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300" aria-live="polite">{done ? `C:\\> ping ${getDevice(to).ip}\n${ping({ fault }, from, to).output}` : "C:\\> _"}</pre>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Gửi gói tin">
            <Segmented label="Máy gửi" value={from} options={[{ value: "pc1", label: "Máy An" }, { value: "pc2", label: "Máy Bình" }]} onChange={(v) => reset(() => setFrom(v))} />
            <Segmented label="Đích" value={to} options={(["printer", "pc2", "pc1", "server"] as DeviceId[]).map((d) => ({ value: d, label: getDevice(d).name.replace("Máy chủ ", "") }))} onChange={(v) => reset(() => setTo(v))} />
            <Button size="sm" className="w-full" onClick={send} disabled={moving}>{moving ? <><Pause /> Đang gửi…</> : <><Send /> Gửi</>}</Button>
          </Panel>
          <Panel title="Sự cố">
            <Segmented label="Gây lỗi" value={fault} options={FAULTS} onChange={(v) => reset(() => setFault(v))} />
            <p className="text-xs text-muted">ipconfig máy gửi: IP {cfg.ip}, gateway {cfg.gateway}{cfg.gateway !== GATEWAY ? " ⚠" : ""}</p>
          </Panel>
          <Panel title="Bảng MAC của switch">
            <SimToggle label="Hiện" checked={showMac} onChange={setShowMac} />
            {showMac && (macTable(sent).length ? <ul className="font-mono text-xs">{macTable(sent).map((r) => <li key={r.mac}>{r.mac} → cổng {r.port} ({r.device})</li>)}</ul> : <p className="text-xs text-muted">Chưa học được MAC nào. Gửi một gói tin.</p>)}
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Chặng" value={at === undefined ? "—" : `${Math.min(at, end)}/${path.length - 1}`} /><Readout label="Kết quả" value={!done ? "…" : stop === null ? "Tới nơi" : "Thất bại"} tone={!done ? "blue" : stop === null ? "green" : "rose"} /></div>
          <ResetAll onClick={() => { setFrom("pc1"); setTo("server"); setFault("none"); setAt(undefined); setSent([]); setShowMac(true); }} />
        </>
      }
    />
  );
}

type Task = { kind: "path"; i: number } | { kind: "fault"; i: number };
const TASKS: Task[] = [{ kind: "path", i: 0 }, { kind: "path", i: 1 }, { kind: "fault", i: 0 }, { kind: "fault", i: 1 }, { kind: "fault", i: 2 }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [hops, setHops] = useState<DeviceId[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [miss, setMiss] = useState(0);
  const [ans, setAns] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setHops([]); setNote(null); setMiss(0); setAns(null); setLog([]); }
  const task = t.kind === "path" ? PATH_TASKS[t.i] : undefined;
  const fc = t.kind === "fault" ? NET_FAULTS[t.i] : undefined;
  const pick = (d: DeviceId) => {
    if (!task || hops.length === task.hops.length) return;
    const r = checkHop(task, hops, d);
    setNote(r.message);
    if (r.ok) setHops([...hops, d]); else setMiss((m) => m + 1);
  };
  const check = () => {
    if (task) { const ok = hops.length === task.hops.length; return c.check(ok && miss === 0, ok ? (miss ? `Tới nơi, nhưng em chọn sai ${miss} chặng. Làm lại câu cho chắc nhé.` : "Đúng cả đường đi!") : "Bấm lần lượt các thiết bị gói tin đi qua, bắt đầu từ máy gửi."); }
    return c.check(ans === fc!.answer, ans === fc!.answer ? fc!.explain : "Chưa đúng. Dùng ping tới máy in (trong LAN) và tới máy chủ (ngoài LAN) để khoanh vùng lỗi.");
  };
  const prompt = task ? `${task.title}: bấm lần lượt các thiết bị gói tin đi qua.` : `${fc!.symptom} Nguyên nhân là gì?`;
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Cùng mạng LAN: gói tin đi qua switch, switch chuyển đúng cổng nhờ bảng MAC.", "Khác mạng: gói tin gửi tới cổng mặc định (router), router chọn đường theo địa chỉ IP.", "Ping trong LAN và ra ngoài để khoanh vùng lỗi: dây, cấu hình IP, router hay đường WAN."]}>
      <Stage className="p-2">
        {task && <><Diagram path={hops} at={hops.length - 1} hi={hops} onPick={pick} />{note && <p role="status" className="px-3 pb-2 text-sm text-fg">{note}</p>}</>}
        {fc && (
          <div className="grid gap-3 p-2 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">{(["printer", "pc1", "pc2", "server"] as DeviceId[]).filter((d) => d !== fc.from).map((d) => <Button key={d} size="sm" variant="secondary" onClick={() => setLog((l) => [...l, `${getDevice(fc.from).name}> ping ${getDevice(d).ip}\n${ping({ fault: fc.fault }, fc.from, d).output}`])}>ping {getDevice(d).name}</Button>)}<Button size="sm" variant="ghost" onClick={() => { const g = ipConfig({ fault: fc.fault }, fc.from); setLog((l) => [...l, `${getDevice(fc.from).name}> ipconfig\nIP: ${g.ip}  Gateway: ${g.gateway}`]); }}>ipconfig</Button></div>
              <pre className="min-h-32 whitespace-pre-wrap rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">{log.join("\n\n") || "Chạy ping hoặc ipconfig để tìm manh mối."}</pre>
            </div>
            <div className="space-y-2">{fc.options.map((o, i) => <button key={o} type="button" aria-pressed={ans === i} onClick={() => setAns(i)} className={cn("block w-full rounded-xl border-2 px-3 py-2 text-left text-sm", ans === i ? "border-brand bg-brand/10" : "border-line bg-surface")}>{o}</button>)}</div>
          </div>
        )}
      </Stage>
    </ChallengeFrame>
  );
}

export function NetworkJourneyLab() {
  return <SimShell title="Hành trình gói tin" screens={[{ id: "goi-tin", label: "Gói tin", icon: Network, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Wrench, render: () => <Game /> }]} />;
}

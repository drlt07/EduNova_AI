"use client";
import { LabScore } from "@/components/sim/lab-result";
import { useState } from "react";
import { Cable, CheckCircle2, Mail, Route, RotateCcw, Star, Terminal } from "lucide-react";
import {
  DEVICES, NET_FAULTS, PATH_TASKS, PRESET_LINKS, REQUIRED_LINKS, ROUTING_TABLE, checkHop, checkLink, getDevice, ipConfig, macTable, missingLinks, ping, stars,
  type Device, type DeviceId, type Link,
} from "@/lib/sim/network";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Stage = "cable" | "path" | "fault" | "done";
const STAGES: { id: Stage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "cable", label: "Đấu nối mạng", icon: Cable },
  { id: "path", label: "Hành trình gói tin", icon: Route },
  { id: "fault", label: "Sự cố mạng", icon: Terminal },
];
const SWITCH_PORT: Partial<Record<DeviceId, number>> = { pc1: 1, pc2: 2, printer: 3, router: 8 };

function DeviceIcon({ d, active, dim }: { d: Device; active: boolean; dim?: boolean }) {
  const stroke = active ? "#22d3ee" : "#334155";
  switch (d.kind) {
    case "pc":
      return (
        <g>
          <rect x={-38} y={-34} width={76} height={50} rx={6} fill="#0f172a" stroke={stroke} strokeWidth={active ? 4 : 2} />
          <rect x={-32} y={-28} width={64} height={38} rx={3} fill={dim ? "#334155" : "#38bdf8"} />
          <rect x={-6} y={16} width={12} height={10} fill="#334155" />
          <rect x={-22} y={26} width={44} height={6} rx={3} fill="#334155" />
        </g>
      );
    case "printer":
      return (
        <g>
          <rect x={-22} y={-38} width={44} height={20} fill="#f8fafc" stroke="#94a3b8" />
          <rect x={-38} y={-20} width={76} height={36} rx={7} fill="#475569" stroke={stroke} strokeWidth={active ? 4 : 2} />
          <rect x={-24} y={10} width={48} height={18} fill="#f8fafc" stroke="#94a3b8" />
          <circle cx={26} cy={-8} r={4} fill="#22c55e" />
        </g>
      );
    case "switch":
      return (
        <g>
          <rect x={-70} y={-22} width={140} height={44} rx={8} fill="#1e3a8a" stroke={stroke} strokeWidth={active ? 4 : 2} />
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-58 + i * 15} y={-6} width={11} height={12} rx={2} fill="#0b1220" />)}
        </g>
      );
    case "router":
      return (
        <g>
          <path d="M-30 -22 L-38 -58 M30 -22 L38 -58" stroke="#334155" strokeWidth={5} strokeLinecap="round" />
          <rect x={-52} y={-24} width={104} height={46} rx={10} fill="#7c3aed" stroke={stroke} strokeWidth={active ? 4 : 2} />
          {[-30, -14, 2, 18, 34].map((x) => <circle key={x} cx={x} cy={0} r={4} fill="#ddd6fe" />)}
        </g>
      );
    case "internet":
      return <path d="M-55 22 a26 26 0 0 1 4-50 a34 34 0 0 1 62-10 a28 28 0 0 1 46 22 a22 22 0 0 1-8 38 Z" fill="#e0f2fe" stroke={stroke} strokeWidth={active ? 4 : 2.5} />;
    case "server":
      return (
        <g>
          <rect x={-30} y={-48} width={60} height={96} rx={6} fill="#0f172a" stroke={stroke} strokeWidth={active ? 4 : 2} />
          {[-34, -10, 14].map((y) => <g key={y}><rect x={-22} y={y} width={44} height={16} rx={3} fill="#1e293b" /><circle cx={14} cy={y + 8} r={3} fill="#22c55e" /></g>)}
        </g>
      );
  }
}

/**
 * Hành trình gói tin (Tin 12 – Bài 3, 4): đấu nối LAN với switch/router, dự đoán đường đi gói tin
 * (switch học MAC, router tra bảng định tuyến, TTL giảm), rồi dùng ping/ipconfig chẩn đoán sự cố.
 */
export function NetworkLab() {
  const [stage, setStage] = useState<Stage>("cable");
  const [links, setLinks] = useState<Link[]>([]);
  const [pending, setPending] = useState<DeviceId | null>(null);
  const [taskIdx, setTaskIdx] = useState(0);
  const [hops, setHops] = useState<DeviceId[]>([]);
  const [sentFrom, setSentFrom] = useState<DeviceId[]>([]);
  const [faultIdx, setFaultIdx] = useState(0);
  const [console_, setConsole] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const task = PATH_TASKS[taskIdx];
  const fault = NET_FAULTS[faultIdx];
  const net = { fault: stage === "fault" ? fault.fault : ("none" as const) };
  const allLinks: Link[] = stage === "cable" ? [...PRESET_LINKS, ...links] : [...PRESET_LINKS, ...REQUIRED_LINKS];
  const stageIdx = STAGES.findIndex((s) => s.id === stage);
  const pathDone = hops.length === task.hops.length;

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Hành trình gói tin (mạng máy tính lớp 12)",
    summary: stage === "cable" ? `Đang đấu nối: còn thiếu ${missingLinks(links).length} dây.` : stage === "path" ? `Nhiệm vụ: ${task.title}. Đường đã chọn: ${hops.map((h) => getDevice(h).name).join(" → ") || "chưa có"}.` : stage === "fault" ? `Ca sự cố: ${fault.symptom} Kết quả lệnh: ${console_.join(" | ") || "chưa chạy"}` : "Đã hoàn thành.",
    problems: feedback && !feedback.ok ? [feedback.text] : [],
    facts: { stage, mistakes },
  }), { title: "Hành trình gói tin · Tin 12", topic: "general", level: "free" });

  const fail = (text: string) => { setMistakes((m) => m + 1); setFeedback({ ok: false, text }); };

  const clickDevice = (id: DeviceId) => {
    touchTutor();
    if (stage === "cable") {
      if (!pending) {
        setPending(id);
        return setFeedback({ ok: true, text: `Đã chọn ${getDevice(id).name}. Chọn thiết bị thứ hai để nối dây.` });
      }
      const r = checkLink(links, pending, id);
      setPending(null);
      if (!r.ok) return pending === id ? setFeedback(null) : fail(r.message);
      setLinks((l) => [...l, [pending, id]]);
      setFeedback({ ok: true, text: r.message });
    } else if (stage === "path" && !pathDone) {
      const r = checkHop(task, hops, id);
      if (!r.ok) return fail(r.message);
      setHops((h) => [...h, id]);
      if (hops.length === 0) setSentFrom((s) => [...s, id]);
      // máy đích trả lời qua switch → switch học thêm MAC phía trả lời (máy in, hoặc router với gói từ Internet)
      if (r.done) setSentFrom((s) => [...s, id === "server" ? "router" : id]);
      setFeedback({ ok: true, text: r.message + (r.done ? " Gói tin đã tới đích!" : "") });
    }
  };

  const run = (cmd: string, fn: () => string) => {
    touchTutor();
    setConsole((c) => [...c, `C:\\> ${cmd}`, fn()].slice(-12));
  };
  const choose = (i: number) => {
    if (answer !== null) return;
    setAnswer(i);
    if (i !== fault.answer) setMistakes((m) => m + 1);
    setFeedback({ ok: i === fault.answer, text: (i === fault.answer ? "Chính xác. " : `Chưa đúng — đáp án: ${fault.options[fault.answer]}. `) + fault.explain });
  };
  const nextFault = () => {
    setAnswer(null); setConsole([]); setFeedback(null);
    if (faultIdx + 1 < NET_FAULTS.length) setFaultIdx(faultIdx + 1);
    else setStage("done");
  };
  const restart = () => {
    setStage("cable"); setLinks([]); setPending(null); setTaskIdx(0); setHops([]); setSentFrom([]); setFaultIdx(0); setConsole([]); setAnswer(null); setMistakes(0); setFeedback(null);
  };

  const linkKey = (a: DeviceId, b: DeviceId) => [a, b].sort().join("-");
  const hopPairs = new Set(hops.slice(1).map((h, i) => linkKey(hops[i], h)));
  const packetAt = hops.length ? getDevice(hops[hops.length - 1]) : null;
  const ttl = 64 - (hops.includes("internet") ? 1 : 0);
  const cableDown = stage === "fault" && fault.fault === "pc1-cable";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="self-start overflow-x-auto rounded-2xl border border-line bg-gradient-to-br from-[#eef6ff] to-[#f5f0ff]" tabIndex={0} aria-label="Sơ đồ mạng (cuộn ngang trên màn hình nhỏ)">
        <svg viewBox="0 0 1000 580" className="block h-auto w-full min-w-[640px]" role="group" aria-label="Sơ đồ mạng phòng Tin">
          <rect x={30} y={40} width={560} height={500} rx={24} fill="#ffffff" fillOpacity={0.55} stroke="#94a3b8" strokeDasharray="8 8" />
          <text x={50} y={70} fontSize={15} fontWeight={700} fill="#475569">Mạng LAN phòng Tin · 192.168.1.x</text>
          {allLinks.map(([a, b]) => {
            const da = getDevice(a), db = getDevice(b);
            const k = linkKey(a, b);
            const used = hopPairs.has(k);
            const broken = (cableDown && k === linkKey("pc1", "switch")) || (stage === "fault" && fault.fault === "wan-down" && k === linkKey("router", "internet"));
            return <line key={k} x1={da.x} y1={da.y} x2={db.x} y2={db.y} stroke={broken ? "#ef4444" : used ? "#22d3ee" : "#64748b"} strokeWidth={used ? 6 : 4} strokeDasharray={broken ? "6 8" : k === linkKey("internet", "server") ? "10 8" : undefined} strokeLinecap="round" />;
          })}
          {stage === "cable" && pending && <circle cx={getDevice(pending).x} cy={getDevice(pending).y} r={62} fill="none" stroke="#22d3ee" strokeWidth={3} strokeDasharray="6 6" className="sim-flow" />}
          {DEVICES.map((d) => {
            const active = pending === d.id || hops.includes(d.id);
            const port = SWITCH_PORT[d.id];
            return (
              <g
                key={d.id}
                transform={`translate(${d.x} ${d.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${d.name}${d.ip ? `, IP ${d.ip}` : ""}`}
                onClick={() => clickDevice(d.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clickDevice(d.id); } }}
                className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-cyan"
              >
                <rect x={-70} y={-65} width={140} height={150} fill="transparent" />
                <DeviceIcon d={d} active={active} dim={cableDown && d.id === "pc1"} />
                <text y={d.kind === "server" ? 70 : 52} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0f172a">{d.name}</text>
                {d.ip && <text y={d.kind === "server" ? 88 : 70} textAnchor="middle" fontSize={12} fontFamily="ui-monospace,monospace" fill="#475569">{d.ip}</text>}
                {port && stage !== "cable" && <text x={d.kind === "router" ? -64 : 52} y={-28} fontSize={11} fill="#64748b">cổng {port}</text>}
              </g>
            );
          })}
          {/* đèn cổng switch theo dây đã nối */}
          {Object.entries(SWITCH_PORT).map(([dev, p]) => {
            const on = allLinks.some(([a, b]) => linkKey(a, b) === linkKey(dev as DeviceId, "switch")) && !(cableDown && dev === "pc1");
            return <circle key={dev} cx={getDevice("switch").x - 52 + (p! - 1) * 15} cy={getDevice("switch").y - 12} r={3} fill={on ? "#22c55e" : "#475569"} />;
          })}
          {packetAt && stage === "path" && (
            <g style={{ transform: `translate(${packetAt.x}px, ${packetAt.y - 82}px)`, transition: "transform 600ms ease-in-out" }}>
              <rect x={-74} y={-30} width={148} height={44} rx={10} fill="#0b1220" />
              <text x={0} y={-12} textAnchor="middle" fontSize={11} fill="#67e8f9" fontFamily="ui-monospace,monospace">→ {getDevice(task.to).ip}</text>
              <text x={0} y={5} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontFamily="ui-monospace,monospace">từ {getDevice(task.from).ip} · TTL {ttl}</text>
            </g>
          )}
        </svg>
      </div>

      <aside className="flex flex-col gap-3" aria-label="Nhiệm vụ">
        <ol className="grid grid-cols-3 gap-1.5" aria-label="Tiến trình">
          {STAGES.map((s, i) => {
            const done = stage === "done" || i < stageIdx;
            return (
              <li key={s.id} aria-current={s.id === stage ? "step" : undefined} className={cn("flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold", s.id === stage ? "border-cyan bg-cyan/10 text-cyan-fg" : done ? "border-success/40 bg-success/10 text-success-fg" : "border-line text-muted")}>
                {done ? <CheckCircle2 className="size-4" aria-hidden /> : <s.icon className="size-4" aria-hidden />}
                {i + 1}. {s.label}
              </li>
            );
          })}
        </ol>

        <section className="rounded-2xl border border-line bg-surface p-4">
          {stage === "cable" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 1 · Đấu nối mạng phòng Tin</h3>
              <p className="mt-1 text-sm text-muted">Cả phòng cần dùng chung máy in và vào được Internet. Bấm hai thiết bị để nối một sợi dây.</p>
              <p className="mt-3 text-xs font-semibold text-muted">Đã nối {REQUIRED_LINKS.length - missingLinks(links).length}/{REQUIRED_LINKS.length} dây cần thiết</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-gradient-to-r from-[#22d3ee] to-[#4f7fff] transition-all" style={{ width: `${((REQUIRED_LINKS.length - missingLinks(links).length) / REQUIRED_LINKS.length) * 100}%` }} /></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {DEVICES.filter((d) => d.id !== "server").map((d) => (
                  <button key={d.id} type="button" aria-pressed={pending === d.id} onClick={() => clickDevice(d.id)} className={cn("rounded-lg border px-2 py-1 text-xs font-medium", pending === d.id ? "border-cyan bg-cyan/15 text-cyan-fg" : "border-line text-fg hover:border-cyan/40")}>{d.name}</button>
                ))}
              </div>
              {missingLinks(links).length === 0 && <Button size="sm" className="mt-3" onClick={() => { setStage("path"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
            </>
          )}

          {stage === "path" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 2 · {task.title}</h3>
              <p className="mt-1 text-sm text-muted">Bấm lần lượt các thiết bị gói tin đi qua, bắt đầu từ máy gửi.</p>
              <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs font-semibold">
                {hops.map((h, i) => <li key={h} className="flex items-center gap-1"><span className="rounded-lg bg-cyan/15 px-2 py-1 text-cyan-fg">{getDevice(h).name}</span>{i < task.hops.length - 1 && <span className="text-muted">→</span>}</li>)}
                {!pathDone && <li className="rounded-lg border border-dashed border-line px-2 py-1 text-muted">?</li>}
              </ol>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className={cn("rounded-xl border p-2", hops.includes("switch") ? "border-cyan/40 bg-cyan/5" : "border-line")}>
                  <p className="font-semibold text-fg">Bảng MAC của switch</p>
                  {macTable(sentFrom).length ? macTable(sentFrom).map((r) => <p key={r.mac} className="font-mono text-muted">{r.mac} → cổng {r.port}</p>) : <p className="text-muted">(trống)</p>}
                </div>
                <div className={cn("rounded-xl border p-2", hops.includes("router") ? "border-violet/40 bg-violet/5" : "border-line")}>
                  <p className="font-semibold text-fg">Bảng định tuyến router</p>
                  {ROUTING_TABLE.map((r) => <p key={r.dest} className="text-muted"><span className="font-mono">{r.dest}</span> → {r.via}</p>)}
                </div>
              </div>
              {pathDone && (
                <Button size="sm" className="mt-3" onClick={() => { setFeedback(null); setHops([]); if (taskIdx + 1 < PATH_TASKS.length) setTaskIdx(taskIdx + 1); else setStage("fault"); }}>
                  {taskIdx + 1 < PATH_TASKS.length ? "Gói tin tiếp theo →" : "Nhiệm vụ tiếp theo →"}
                </Button>
              )}
            </>
          )}

          {stage === "fault" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Kỹ thuật viên mạng ({faultIdx + 1}/{NET_FAULTS.length})</h3>
              <p className="mt-2 rounded-xl bg-warning/10 p-3 text-sm text-fg">“{fault.symptom}”</p>
              <p className="mt-2 text-xs font-semibold text-muted">Chạy lệnh trên {getDevice(fault.from).name} để tìm nguyên nhân:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(["printer", "router", "server"] as DeviceId[]).map((t) => (
                  <button key={t} type="button" onClick={() => run(`ping ${getDevice(t).ip}`, () => ping(net, fault.from, t).output)} className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-[11px] text-fg hover:bg-cyan/15">ping {getDevice(t).kind === "server" ? "edunova.vn" : getDevice(t).name.toLowerCase()}</button>
                ))}
                <button type="button" onClick={() => run("ipconfig", () => { const c = ipConfig(net, fault.from); return `IPv4: ${c.ip} · Mặt nạ: 255.255.255.0 · Cổng mặc định: ${c.gateway}`; })} className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-[11px] text-fg hover:bg-cyan/15">ipconfig</button>
              </div>
              <pre aria-live="polite" className="mt-2 max-h-36 min-h-14 overflow-auto whitespace-pre-wrap rounded-xl bg-[#0b1220] p-2.5 font-mono text-[11px] leading-5 text-slate-200">{console_.length ? console_.join("\n") : "C:\\> _"}</pre>
              <p className="mt-2 text-xs font-semibold text-muted">Nguyên nhân là gì?</p>
              <div className="mt-1.5 space-y-1.5">
                {fault.options.map((o, i) => (
                  <button key={o} type="button" disabled={answer !== null} onClick={() => choose(i)} className={cn("block w-full rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium", answer !== null && i === fault.answer ? "border-success bg-success/15 text-success-fg" : answer === i ? "border-danger bg-danger/10 text-danger-fg" : "border-line text-fg hover:border-cyan/40")}>{o}</button>
                ))}
              </div>
              {answer !== null && <Button size="sm" className="mt-3" onClick={nextFault}>{faultIdx + 1 < NET_FAULTS.length ? "Ca tiếp theo →" : "Xem kết quả"}</Button>}
            </>
          )}

          {stage === "done" && (
            <div className="text-center">
              <div className="flex justify-center gap-1" aria-label={`${stars(mistakes)} trên 3 sao`}>
                {[1, 2, 3].map((i) => <Star key={i} className={cn("size-8", i <= stars(mistakes) ? "fill-warning text-warning" : "text-line")} aria-hidden />)}
              </div>
              <h3 className="mt-2 font-semibold text-fg">Mạng phòng Tin đã chạy tốt!</h3>
              <p className="mt-1 text-sm text-muted">Số lần chọn sai: <b className="text-fg">{mistakes}</b></p>
              <LabScore mistakes={mistakes} />
              <ul className="mt-3 space-y-1 text-left text-xs text-fg">
                <li>• <b>Switch</b> nối thiết bị trong một mạng LAN, chuyển đúng cổng nhờ bảng MAC.</li>
                <li>• <b>Router</b> nối các mạng với nhau, chọn đường theo địa chỉ IP; đích khác mạng → gửi cho cổng mặc định.</li>
                <li>• <b>ping</b> và <b>ipconfig</b> giúp khoanh vùng lỗi: dây, cấu hình IP, hay đường ra Internet.</li>
              </ul>
              <Button size="sm" variant="secondary" className="mt-3" onClick={restart}><RotateCcw /> Làm lại</Button>
            </div>
          )}
        </section>

        {feedback && (
          <p role="status" className={cn("flex gap-2 rounded-xl border px-3 py-2 text-sm", feedback.ok ? "border-success/30 bg-success/10 text-fg" : "border-danger/30 bg-danger/10 text-fg")}>
            <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> {feedback.text}
          </p>
        )}
        <p className="text-xs text-muted">Số lần chọn sai: {mistakes}</p>
      </aside>
    </div>
  );
}

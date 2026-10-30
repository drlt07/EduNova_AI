"use client";
/** Tin 12 Bài 3 – Xây dựng mạng trường học: đặt switch, router, access point, modem vào sơ đồ, kiểm tra máy nào vào được mạng nội bộ và Internet. */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChallengeFrame, Panel, ResetAll, SimShell, Stage, useChallenge } from "./kit";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { buildLadder } from "@/lib/ai/sim-hints";

export type Gear = "switch" | "router" | "ap" | "modem";
const GEAR: Record<Gear, { label: string; color: string; info: string }> = {
  switch: { label: "Switch", color: "#2563eb", info: "Nối nhiều máy bằng dây trong cùng một mạng LAN, chuyển dữ liệu đúng tới máy nhận." },
  router: { label: "Router", color: "#7c3aed", info: "Nối các mạng với nhau (các phòng, mạng trường với Internet), chọn đường cho gói tin." },
  ap: { label: "Access point", color: "#0891b2", info: "Điểm truy cập không dây: phát Wi-Fi cho laptop, điện thoại, nối vào mạng có dây." },
  modem: { label: "Modem", color: "#ea580c", info: "Chuyển đổi tín hiệu giữa mạng của trường và đường truyền của nhà cung cấp Internet." },
};
export type SlotId = "lab" | "lib" | "office" | "core" | "edge";
const SLOTS: { id: SlotId; label: string; x: number; y: number }[] = [
  { id: "lab", label: "Phòng máy", x: 120, y: 120 },
  { id: "lib", label: "Thư viện", x: 330, y: 120 },
  { id: "office", label: "Văn phòng", x: 540, y: 120 },
  { id: "core", label: "Phòng thiết bị", x: 330, y: 260 },
  { id: "edge", label: "Lối ra Internet", x: 540, y: 300 },
];
export type Net = Partial<Record<SlotId, Gear>>;

/** Mỗi khu vực vào được mạng nội bộ? ra được Internet? kèm lí do. */
export function analyse(n: Net) {
  const roomOk = { lab: n.lab === "switch", lib: n.lib === "ap", office: n.office === "switch" };
  const core = n.core === "router";
  const internet = core && n.edge === "modem";
  const why: Record<"lab" | "lib" | "office", string> = {
    lab: n.lab === "switch" ? "6 máy bàn nối dây vào switch" : n.lab === "ap" ? "máy bàn không có Wi-Fi, cần dây nối vào switch" : n.lab === "router" ? "router ít cổng, không đủ cho 6 máy" : "chưa có thiết bị nối các máy",
    lib: n.lib === "ap" ? "laptop vào Wi-Fi của access point" : n.lib ? "laptop thư viện dùng không dây, cần access point" : "chưa có Wi-Fi",
    office: n.office === "switch" ? "máy in và máy tính nối vào switch" : n.office ? "máy in dùng dây, cần switch" : "chưa có thiết bị",
  };
  return {
    roomOk, core, internet, why,
    lan: (r: "lab" | "lib" | "office") => roomOk[r] && core,
    net: (r: "lab" | "lib" | "office") => roomOk[r] && internet,
  };
}

function Plan({ n, sel, onSlot, test }: { n: Net; sel?: SlotId; onSlot: (s: SlotId) => void; test?: boolean }) {
  const a = analyse(n);
  const pos = Object.fromEntries(SLOTS.map((s) => [s.id, s])) as Record<SlotId, (typeof SLOTS)[number]>;
  const wire = (from: SlotId, to: SlotId, ok: boolean) => <line x1={pos[from].x} y1={pos[from].y + 26} x2={pos[to].x} y2={pos[to].y - 26} stroke={test ? (ok ? "#22c55e" : "#ef4444") : "#94a3b8"} strokeWidth="4" strokeDasharray={n[from] && n[to] ? "0" : "8 6"} />;
  return (
    <svg viewBox="0 0 660 380" className="h-auto w-full" role="group" aria-label="Sơ đồ mạng trường học">
      {(["lab", "lib", "office"] as const).map((r) => wire(r, "core", a.roomOk[r] && a.core))}
      <line x1={pos.core.x + 40} y1={pos.core.y} x2={pos.edge.x - 40} y2={pos.edge.y} stroke={test ? (a.internet ? "#22c55e" : "#ef4444") : "#94a3b8"} strokeWidth="4" strokeDasharray={n.core && n.edge ? "0" : "8 6"} />
      <g transform="translate(610 352)"><circle r="20" fill="#0ea5e9" /><text y="5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">WWW</text></g>
      <line x1={pos.edge.x + 30} y1={pos.edge.y + 10} x2="596" y2="340" stroke={test ? (a.internet ? "#22c55e" : "#ef4444") : "#94a3b8"} strokeWidth="4" />
      {(["lab", "lib", "office"] as const).map((r) => {
        const s = pos[r];
        const endpoints = r === "lab" ? 6 : r === "lib" ? 3 : 2;
        return (
          <g key={r}>
            <rect x={s.x - 95} y={s.y - 100} width="190" height="78" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
            {Array.from({ length: endpoints }, (_, k) => {
              const x = s.x - 80 + k * (160 / endpoints) + 10, y = s.y - 70;
              const ok = test ? a.net(r) : undefined;
              return (
                <g key={k} transform={`translate(${x} ${y})`}>
                  {r === "lib" ? <path d="M-11 6 h22 l4 6 h-30 Z M-9 -8 h18 v14 h-18 Z" fill="#475569" /> : r === "office" && k === 1 ? <path d="M-11 -4 h22 v12 h-22 Z M-7 -10 h14 v6 h-14 Z" fill="#475569" /> : <path d="M-10 -9 h20 v14 h-20 Z M-4 5 h8 v4 h-8 Z" fill="#475569" />}
                  {r === "lib" && !test && <path d="M-6 -16 q6 -6 12 0" stroke="#0891b2" fill="none" />}
                  {ok !== undefined && <circle cx="10" cy="-11" r="5" fill={ok ? "#22c55e" : "#ef4444"} />}
                </g>
              );
            })}
            <text x={s.x} y={s.y - 32} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{s.label}</text>
          </g>
        );
      })}
      {SLOTS.map((s) => {
        const g = n[s.id];
        return (
          <g key={s.id} role="button" tabIndex={0} aria-label={`Vị trí ${s.label}: ${g ? GEAR[g].label : "trống"}`} onClick={() => onSlot(s.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSlot(s.id); }} className="cursor-pointer">
            <rect x={s.x - 44} y={s.y - 22} width="88" height="44" rx="10" fill={g ? GEAR[g].color : "#fff"} stroke={sel === s.id ? "#f59e0b" : g ? "transparent" : "#94a3b8"} strokeWidth={sel === s.id ? 4 : 2} strokeDasharray={g ? "0" : "6 4"} />
            <text x={s.x} y={s.y + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={g ? "#fff" : "#64748b"}>{g ? GEAR[g].label : "+ đặt thiết bị"}</text>
            {(s.id === "core" || s.id === "edge") && <text x={s.x} y={s.y + 38} textAnchor="middle" fontSize="11" fill="#64748b">{s.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Palette({ onPick, current }: { onPick: (g: Gear | undefined) => void; current?: Gear }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {(Object.keys(GEAR) as Gear[]).map((g) => <button key={g} type="button" aria-pressed={current === g} onClick={() => onPick(g)} className={cn("rounded-xl px-2 py-2 text-xs font-bold text-white", current === g && "ring-2 ring-amber-400")} style={{ background: GEAR[g].color }}>{GEAR[g].label}</button>)}
      <button type="button" onClick={() => onPick(undefined)} className="col-span-2 rounded-xl border border-line px-2 py-1.5 text-xs text-muted hover:text-fg">Gỡ thiết bị</button>
    </div>
  );
}

function Report({ n }: { n: Net }) {
  const a = analyse(n);
  return (
    <ul className="space-y-1.5 text-xs">
      {(["lab", "lib", "office"] as const).map((r) => <li key={r}><b className="text-fg">{SLOTS.find((s) => s.id === r)!.label}:</b> <span className={a.net(r) ? "text-success-fg" : a.lan(r) ? "text-warning-fg" : "text-danger-fg"}>{a.net(r) ? "vào được Internet" : a.lan(r) ? "chỉ mạng nội bộ" : "chưa vào mạng"}</span> <span className="text-muted">({a.why[r]})</span></li>)}
      {!a.core && <li className="text-muted">Phòng thiết bị cần router để nối các phòng với nhau.</li>}
      {a.core && !a.internet && <li className="text-muted">Cần modem ở lối ra để nối với nhà cung cấp Internet.</li>}
    </ul>
  );
}

function Builder({ n, setN, test, setTest }: { n: Net; setN: (f: (n: Net) => Net) => void; test: boolean; setTest: (v: boolean) => void }) {
  const [sel, setSel] = useState<SlotId>("lab");
  const touch = useTutorActivity("simulation", () => {
    const a = analyse(n);
    const placed = SLOTS.map((x) => `${x.label}: ${n[x.id] ? GEAR[n[x.id]!].label : "trống"}`).join("; ");
    return { kind: "simulation", sim: "Xây dựng mạng trường học", summary: `Sơ đồ hiện tại — ${placed}.${test ? ` Kết quả kiểm tra: ${(["lab", "lib", "office"] as const).map((r) => `${SLOTS.find((x) => x.id === r)!.label} ${a.net(r) ? "ra được Internet" : a.lan(r) ? "chỉ mạng nội bộ" : "chưa vào mạng"}`).join(", ")}.` : ""}`, problems: [], facts: { da_kiem_tra: test }, ladder: buildLadder(n) };
  }, { title: "Xây dựng mạng trường học · Tin 12", topic: "general", level: "guided" });
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
      <Stage className="p-2"><Plan n={n} sel={sel} onSlot={(s) => { setSel(s); setTest(false); touch(); }} test={test} /></Stage>
      <div className="space-y-3">
        <Panel title={`Đặt vào: ${SLOTS.find((s) => s.id === sel)!.label}`}><Palette current={n[sel]} onPick={(g) => { setN((x) => ({ ...x, [sel]: g })); setTest(false); touch(); }} /></Panel>
        {n[sel] && <Panel title={GEAR[n[sel]!].label}><p className="text-xs">{GEAR[n[sel]!].info}</p></Panel>}
        <Button className="w-full" variant={test ? "secondary" : "primary"} onClick={() => { setTest(!test); touch(); }}>{test ? "Ẩn kết quả kiểm tra" : "Kiểm tra mạng (ping)"}</Button>
      </div>
    </div>
  );
}

function Explore() {
  const [n, setNet] = useState<Net>({});
  const [test, setTest] = useState(false);
  return (
    <div className="space-y-3">
      <Builder n={n} setN={(f) => setNet(f)} test={test} setTest={setTest} />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Panel title="Kết quả">{test ? <Report n={n} /> : <p className="text-xs text-muted">Bấm vào ô “+ đặt thiết bị”, chọn thiết bị, rồi bấm “Kiểm tra mạng”. Chấm xanh: máy ra được Internet.</p>}</Panel>
        <Panel title="Các thiết bị">{(Object.keys(GEAR) as Gear[]).map((g) => <p key={g} className="text-xs"><b style={{ color: GEAR[g].color }}>{GEAR[g].label}:</b> {GEAR[g].info}</p>)}</Panel>
        <div className="flex items-end"><ResetAll onClick={() => { setNet({}); setTest(false); }} /></div>
      </div>
    </div>
  );
}

const TASKS: { prompt: string; ok: (n: Net) => boolean; hint: string; why: string }[] = [
  { prompt: "Nối 6 máy bàn trong phòng máy thành một mạng LAN có dây.", ok: (n) => n.lab === "switch", hint: "Thiết bị nào nối nhiều máy bằng dây trong một phòng?", why: "Switch nối các máy trong cùng mạng LAN." },
  { prompt: "Cho laptop ở thư viện vào mạng mà không cần đi dây.", ok: (n) => n.lib === "ap", hint: "Laptop cần sóng Wi-Fi.", why: "Access point phát Wi-Fi và nối vào mạng có dây." },
  { prompt: "Nối cả 3 phòng thành mạng chung của trường để in từ mọi nơi ra máy in văn phòng.", ok: (n) => { const a = analyse(n); return a.lan("lab") && a.lan("lib") && a.lan("office"); }, hint: "Mỗi phòng cần thiết bị đúng, và các phòng phải nối với nhau ở phòng thiết bị.", why: "Router ở phòng thiết bị nối các phòng với nhau." },
  { prompt: "Cho toàn trường ra được Internet.", ok: (n) => { const a = analyse(n); return a.net("lab") && a.net("lib") && a.net("office"); }, hint: "Mạng trường cần thêm thiết bị ở lối ra Internet.", why: "Modem nối router của trường với nhà cung cấp Internet." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [n, setNet] = useState<Net>({});
  const [test, setTest] = useState(false);
  const key = `${c.run}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setNet({}); setTest(false); }
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={() => { setTest(true); c.check(t.ok(n), t.ok(n) ? t.why : t.hint); }} summary={["Switch nối các máy trong một mạng LAN có dây.", "Access point phát Wi-Fi cho thiết bị không dây.", "Router nối các mạng với nhau; modem nối mạng của trường với Internet."]}>
      <Builder n={n} setN={(f) => setNet(f)} test={test} setTest={setTest} />
    </ChallengeFrame>
  );
}

export function NetworkBuilderLab() {
  return <SimShell title="Xây dựng mạng trường học" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

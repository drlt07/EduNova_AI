"use client";
/** Tin 11 Bài 5 – Trạm kết nối thiết bị số: chọn thiết bị rồi chọn cổng ở mặt sau máy tính, hoặc ghép nối không dây. */
import { useState } from "react";
import { Bluetooth, Cable, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, ResetAll, SimLayout, SimShell, Stage, useChallenge } from "./kit";

type PortKind = "usba" | "usbc" | "hdmi" | "lan" | "audio" | "mic" | "bt" | "wifi";
interface Port { id: string; kind: PortKind; label: string; x: number; y: number; w: number; h: number; color: string; info: string }
const PORTS: Port[] = [
  { id: "usb1", kind: "usba", label: "USB-A", x: 60, y: 70, w: 34, h: 14, color: "#1e40af", info: "Truyền dữ liệu, cấp điện nhỏ: chuột, bàn phím, USB, máy in." },
  { id: "usb2", kind: "usba", label: "USB-A", x: 60, y: 100, w: 34, h: 14, color: "#1e40af", info: "Truyền dữ liệu, cấp điện nhỏ: chuột, bàn phím, USB, máy in." },
  { id: "usbc", kind: "usbc", label: "USB-C", x: 120, y: 84, w: 26, h: 12, color: "#0f172a", info: "Cổng nhỏ, cắm chiều nào cũng được: điện thoại, sạc, dữ liệu tốc độ cao." },
  { id: "hdmi", kind: "hdmi", label: "HDMI", x: 172, y: 80, w: 46, h: 18, color: "#334155", info: "Truyền hình ảnh và âm thanh tới màn hình, ti vi, máy chiếu." },
  { id: "lan", kind: "lan", label: "LAN (RJ45)", x: 244, y: 74, w: 34, h: 30, color: "#a16207", info: "Nối dây mạng tới switch, router." },
  { id: "audio", kind: "audio", label: "Loa (xanh lá)", x: 304, y: 72, w: 18, h: 18, color: "#16a34a", info: "Đầu ra âm thanh 3,5 mm: loa, tai nghe." },
  { id: "mic", kind: "mic", label: "Micro (hồng)", x: 304, y: 102, w: 18, h: 18, color: "#db2777", info: "Đầu vào âm thanh 3,5 mm: micro." },
];
const WIRELESS: Port[] = [
  { id: "bt", kind: "bt", label: "Bluetooth", x: 0, y: 0, w: 0, h: 0, color: "#2563eb", info: "Không dây, tầm gần (vài mét): tai nghe, chuột, loa." },
  { id: "wifi", kind: "wifi", label: "Wi-Fi", x: 0, y: 0, w: 0, h: 0, color: "#0891b2", info: "Không dây, vào mạng LAN/Internet; máy in mạng." },
];
interface Dev { id: string; label: string; emoji: string; accepts: PortKind[]; does: string }
const DEVICES: Dev[] = [
  { id: "chuot", label: "Chuột", emoji: "🖱️", accepts: ["usba", "bt"], does: "nhập: di chuyển con trỏ" },
  { id: "banphim", label: "Bàn phím", emoji: "⌨️", accepts: ["usba", "bt"], does: "nhập: gõ chữ" },
  { id: "usb", label: "USB lưu trữ", emoji: "💾", accepts: ["usba"], does: "lưu trữ: chép tệp" },
  { id: "dienthoai", label: "Điện thoại", emoji: "📱", accepts: ["usbc", "bt"], does: "chép ảnh, sạc" },
  { id: "maychieu", label: "Máy chiếu", emoji: "📽️", accepts: ["hdmi"], does: "xuất: chiếu hình" },
  { id: "manhinh", label: "Màn hình phụ", emoji: "🖥️", accepts: ["hdmi"], does: "xuất: hiển thị" },
  { id: "loa", label: "Loa", emoji: "🔊", accepts: ["audio", "bt"], does: "xuất: phát âm thanh" },
  { id: "micro", label: "Micro", emoji: "🎙️", accepts: ["mic", "bt"], does: "nhập: thu tiếng nói" },
  { id: "mayin", label: "Máy in", emoji: "🖨️", accepts: ["usba", "wifi"], does: "xuất: in giấy" },
  { id: "mang", label: "Dây mạng", emoji: "🌐", accepts: ["lan"], does: "vào mạng có dây" },
];
const ALL_PORTS = [...PORTS, ...WIRELESS];
type Links = Record<string, string>;

function BackPanel({ links, picked, onPort }: { links: Links; picked?: string; onPort: (p: Port) => void }) {
  const used = new Set(Object.values(links));
  const dev = picked ? DEVICES.find((d) => d.id === picked) : undefined;
  return (
    <svg viewBox="0 0 390 170" className="mx-auto h-auto w-full max-w-[640px]" role="group" aria-label="Mặt sau máy tính">
      <rect x="20" y="40" width="352" height="110" rx="12" fill="#1f2937" />
      <text x="190" y="30" textAnchor="middle" fontSize="12" fill="#64748b">Mặt sau máy tính – bấm vào cổng để cắm</text>
      {PORTS.map((p) => {
        const fits = dev?.accepts.includes(p.kind);
        return (
          <g key={p.id} role="button" tabIndex={0} aria-label={`Cổng ${p.label}${used.has(p.id) ? " (đang dùng)" : ""}`} onClick={() => onPort(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPort(p); }} className="cursor-pointer">
            <rect x={p.x - 6} y={p.y - 6} width={p.w + 12} height={p.h + 12} rx="6" fill={dev ? (fits ? "#22c55e33" : "transparent") : "transparent"} stroke={dev && fits ? "#22c55e" : "transparent"} strokeDasharray="4 3" />
            {p.kind === "audio" || p.kind === "mic" ? <circle cx={p.x + p.w / 2} cy={p.y + p.h / 2} r={p.w / 2} fill={p.color} /> : <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" fill={p.color} stroke="#94a3b8" />}
            {used.has(p.id) && <circle cx={p.x + p.w} cy={p.y} r="5" fill="#22c55e" />}
            {p.kind === "audio" || p.kind === "mic" ? <text x={p.x + p.w + 8} y={p.y + p.h / 2 + 3} fontSize="9" fill="#cbd5e1">{p.label}</text> : <text x={p.x + p.w / 2} y={p.kind === "usba" && p.id === "usb1" ? p.y - 6 : p.y + p.h + 14} textAnchor="middle" fontSize="9" fill="#cbd5e1">{p.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function useStation() {
  const [links, setLinks] = useState<Links>({});
  const [picked, setPicked] = useState<string | undefined>("maychieu");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [info, setInfo] = useState<Port | null>(null);
  const connect = (p: Port) => {
    setInfo(p);
    const d = DEVICES.find((x) => x.id === picked);
    if (!d) return;
    if (!d.accepts.includes(p.kind)) return setMsg({ ok: false, text: `${d.label} không cắm vào cổng ${p.label} được.` });
    if (p.kind !== "bt" && p.kind !== "wifi" && Object.entries(links).some(([k, v]) => v === p.id && k !== d.id)) return setMsg({ ok: false, text: `Cổng ${p.label} đang có thiết bị khác.` });
    setLinks((l) => ({ ...l, [d.id]: p.id }));
    setMsg({ ok: true, text: `${d.label} đã kết nối qua ${p.label}: ${d.does}.` });
  };
  return { links, setLinks, picked, setPicked, msg, setMsg, info, connect };
}

function Station({ st }: { st: ReturnType<typeof useStation> }) {
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {DEVICES.map((d) => {
          const link = st.links[d.id];
          return (
            <li key={d.id}>
              <button type="button" aria-pressed={st.picked === d.id} onClick={() => { st.setPicked(d.id); st.setMsg(null); }} className={cn("flex w-full flex-col items-center gap-1 rounded-xl border p-2 text-xs font-semibold transition-colors", st.picked === d.id ? "border-brand bg-brand/10 text-fg" : "border-line bg-surface text-fg hover:border-brand/40")}>
                <span className={cn("text-2xl", link && "animate-[pulse_2s_ease-in-out_infinite]")} aria-hidden>{d.emoji}</span>{d.label}
                <span className={cn("text-[10px] font-normal", link ? "text-success-fg" : "text-muted")}>{link ? `✓ ${ALL_PORTS.find((p) => p.id === link)!.label}` : "chưa nối"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Stage dark className="p-2"><BackPanel links={st.links} picked={st.picked} onPort={st.connect} /></Stage>
      <div className="flex flex-wrap gap-2">
        {WIRELESS.map((w) => <button key={w.id} type="button" onClick={() => st.connect(w)} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:border-brand/40">{w.kind === "bt" ? <Bluetooth className="size-4 text-blue-fg" aria-hidden /> : <Wifi className="size-4 text-cyan-fg" aria-hidden />} Ghép nối qua {w.label}</button>)}
      </div>
      {st.msg && <p role="status" className={cn("rounded-xl px-3 py-2 text-sm", st.msg.ok ? "bg-success/10 text-success-fg" : "bg-danger/10 text-danger-fg")}>{st.msg.text}</p>}
    </div>
  );
}

function Explore() {
  const st = useStation();
  const d = DEVICES.find((x) => x.id === st.picked);
  return (
    <SimLayout
      stage={<Station st={st} />}
      controls={
        <>
          {d && <Panel title={`${d.emoji} ${d.label}`}><p>Chức năng: {d.does}</p><p className="text-muted">Kết nối được qua: {d.accepts.map((k) => ALL_PORTS.find((p) => p.kind === k)!.label).join(", ")}</p></Panel>}
          {st.info && <Panel title={`Cổng ${st.info.label}`}><p className="flex gap-2"><Cable className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />{st.info.info}</p></Panel>}
          <Panel title="Đã kết nối">
            {Object.keys(st.links).length === 0 ? <p className="text-muted">Chưa có thiết bị nào.</p> : <ul className="space-y-1">{Object.entries(st.links).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{DEVICES.find((x) => x.id === k)!.label}</span><button type="button" className="text-xs text-danger-fg hover:underline" onClick={() => st.setLinks((l) => { const n = { ...l }; delete n[k]; return n; })}>Rút {ALL_PORTS.find((p) => p.id === v)!.label}</button></li>)}</ul>}
          </Panel>
          <ResetAll onClick={() => { st.setLinks({}); st.setPicked("maychieu"); st.setMsg(null); }} />
        </>
      }
    />
  );
}

const TASKS: { prompt: string; need: Record<string, PortKind[]>; why: string }[] = [
  { prompt: "Chuẩn bị trình chiếu bài thuyết trình lên máy chiếu của lớp.", need: { maychieu: ["hdmi"] }, why: "Máy chiếu nhận hình qua HDMI." },
  { prompt: "Học trực tuyến: nghe cô giảng qua loa và nói được qua micro, dùng dây.", need: { loa: ["audio"], micro: ["mic"] }, why: "Loa cắm cổng xanh lá (ra), micro cắm cổng hồng (vào)." },
  { prompt: "Chép ảnh từ điện thoại sang máy tính bằng cáp và in một bức qua mạng không dây.", need: { dienthoai: ["usbc"], mayin: ["wifi"] }, why: "Điện thoại dùng USB-C; máy in mạng nối qua Wi-Fi." },
  { prompt: "Phòng máy mất Wi-Fi. Cho máy vào mạng và cắm chuột, bàn phím có dây.", need: { mang: ["lan"], chuot: ["usba"], banphim: ["usba"] }, why: "Dây mạng cắm cổng LAN; chuột và bàn phím dùng hai cổng USB-A." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const st = useStation();
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); st.setLinks({}); st.setMsg(null); st.setPicked(Object.keys(t.need)[0]); }
  const check = () => {
    const miss = Object.entries(t.need).filter(([d, kinds]) => { const p = ALL_PORTS.find((x) => x.id === st.links[d]); return !p || !kinds.includes(p.kind); });
    c.check(!miss.length, miss.length ? `Chưa đúng: ${miss.map(([d]) => DEVICES.find((x) => x.id === d)!.label).join(", ")}.` : t.why);
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["Mỗi loại cổng có hình dạng và việc riêng: USB cho dữ liệu, HDMI cho hình ảnh, LAN cho mạng, 3,5 mm cho âm thanh.", "Thiết bị nhập đưa dữ liệu vào máy, thiết bị xuất đưa kết quả ra.", "Bluetooth và Wi-Fi kết nối không dây."]}>
      <Station st={st} />
    </ChallengeFrame>
  );
}

export function DeviceConnectionLab() {
  return <SimShell title="Trạm kết nối thiết bị số" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

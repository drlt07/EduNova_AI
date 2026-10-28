"use client";
/** Tin 11 Bài 6 – Đám mây dữ liệu: đồng bộ tệp giữa các thiết bị qua đám mây, phân quyền chia sẻ (xem, bình luận, chỉnh sửa), liên kết công khai. */
import { useState } from "react";
import { Cloud, CloudOff, Laptop, Link2, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChallengeFrame, Panel, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

type Perm = "khong" | "xem" | "binhluan" | "sua";
const PERM_LABEL: Record<Perm, string> = { khong: "Không", xem: "Xem", binhluan: "Bình luận", sua: "Chỉnh sửa" };
const PEOPLE = [
  { id: "co", label: "Cô giáo", emoji: "👩‍🏫" },
  { id: "nhom", label: "Nhóm 4 bạn", emoji: "👥" },
  { id: "lop", label: "Cả lớp", emoji: "🏫" },
] as const;
type Person = (typeof PEOPLE)[number]["id"];
type LinkMode = "hanche" | "congkhai";
export interface Share { perms: Record<Person, Perm>; link: LinkMode; linkPerm: Exclude<Perm, "khong"> }
const NOBODY: Share = { perms: { co: "khong", nhom: "khong", lop: "khong" }, link: "hanche", linkPerm: "xem" };

const DEVICES = [
  { id: "truong", label: "Máy ở trường", icon: Monitor },
  { id: "dt", label: "Điện thoại", icon: Smartphone },
  { id: "nha", label: "Máy ở nhà", icon: Laptop },
] as const;
type Device = (typeof DEVICES)[number]["id"];

function SharePanel({ s, onChange }: { s: Share; onChange: (s: Share) => void }) {
  return (
    <div className="space-y-2.5">
      {PEOPLE.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2">
          <span className="text-sm">{p.emoji} {p.label}</span>
          <select aria-label={`Quyền của ${p.label}`} value={s.perms[p.id]} onChange={(e) => onChange({ ...s, perms: { ...s.perms, [p.id]: e.target.value as Perm } })} className="h-8 rounded-lg border border-line bg-surface px-1.5 text-xs">{(Object.keys(PERM_LABEL) as Perm[]).map((k) => <option key={k} value={k}>{PERM_LABEL[k]}</option>)}</select>
        </div>
      ))}
      <Segmented label="Ai có liên kết" value={s.link} options={[{ value: "hanche", label: "Chỉ người được mời" }, { value: "congkhai", label: "Bất kỳ ai có liên kết" }]} onChange={(link) => onChange({ ...s, link })} />
      {s.link === "congkhai" && (
        <select aria-label="Quyền của người có liên kết" value={s.linkPerm} onChange={(e) => onChange({ ...s, linkPerm: e.target.value as Share["linkPerm"] })} className="h-8 w-full rounded-lg border border-line bg-surface px-1.5 text-xs">{(["xem", "binhluan", "sua"] as const).map((k) => <option key={k} value={k}>Người có liên kết được {PERM_LABEL[k].toLowerCase()}</option>)}</select>
      )}
    </div>
  );
}

/** Sơ đồ: tệp trên đám mây, các thiết bị đồng bộ, những người được chia sẻ. */
function CloudScene({ s, online, versions, cloudV }: { s: Share; online: Record<Device, boolean>; versions: Record<Device, number>; cloudV: number }) {
  const W = 640, H = 300, cx = W / 2, cy = 120;
  const devX = [110, 320, 530];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Đám mây, thiết bị và người được chia sẻ">
      <g transform={`translate(${cx} ${cy - 40})`}>
        <path d="M-90 30 a40 40 0 0 1 30 -62 a55 55 0 0 1 100 0 a40 40 0 0 1 50 62 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="3" />
        <rect x="-26" y="-22" width="52" height="40" rx="6" fill="#fff" stroke="#2563eb" strokeWidth="2" />
        <text y="4" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1d4ed8">bai.docx</text>
        <text y="34" textAnchor="middle" fontSize="11" fill="#0369a1">phiên bản {cloudV}</text>
      </g>
      {DEVICES.map((d, i) => {
        const on = online[d.id];
        const fresh = versions[d.id] === cloudV;
        return (
          <g key={d.id}>
            <line x1={cx} y1={cy - 10} x2={devX[i]} y2={210} stroke={on ? (fresh ? "#22c55e" : "#f59e0b") : "#cbd5e1"} strokeWidth="3" strokeDasharray={on ? "0" : "6 6"} />
            <g transform={`translate(${devX[i]} 230)`}>
              <rect x="-62" y="-22" width="124" height="54" rx="10" fill="#fff" stroke={on ? "#94a3b8" : "#e2e8f0"} />
              <text y="-2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">{d.label}</text>
              <text y="18" textAnchor="middle" fontSize="11" fill={!on ? "#94a3b8" : fresh ? "#16a34a" : "#d97706"}>{!on ? "mất mạng" : fresh ? `bản ${versions[d.id]} ✓ mới nhất` : `bản ${versions[d.id]} – đang đồng bộ`}</text>
            </g>
          </g>
        );
      })}
      {PEOPLE.map((p, i) => {
        const perm = s.perms[p.id];
        return (
          <g key={p.id} transform={`translate(${W - 120 + (i - 1) * 0} ${30 + i * 38})`} opacity={perm === "khong" && s.link === "hanche" ? 0.35 : 1}>
            <rect x="-14" y="-14" width="134" height="30" rx="8" fill={perm === "sua" ? "#dcfce7" : perm === "khong" ? "#f1f5f9" : "#e0f2fe"} />
            <text x="-4" y="6" fontSize="12">{p.emoji}</text>
            <text x="18" y="5" fontSize="11" fill="#0f172a">{p.label}: {perm === "khong" ? (s.link === "congkhai" ? `có link → ${PERM_LABEL[s.linkPerm].toLowerCase()}` : "không thấy") : PERM_LABEL[perm].toLowerCase()}</text>
          </g>
        );
      })}
      {s.link === "congkhai" && <g transform="translate(40 40)"><rect x="-14" y="-16" width="150" height="30" rx="8" fill="#fee2e2" /><text y="4" fontSize="11" fill="#b91c1c">🌍 Người lạ có link: {PERM_LABEL[s.linkPerm].toLowerCase()}</text></g>}
    </svg>
  );
}

function useSync() {
  const [online, setOnline] = useState<Record<Device, boolean>>({ truong: true, dt: true, nha: false });
  const [versions, setVersions] = useState<Record<Device, number>>({ truong: 1, dt: 1, nha: 1 });
  const [cloudV, setCloudV] = useState(1);
  const edit = (d: Device) => {
    const v = Math.max(cloudV, versions[d]) + 1;
    setVersions((x) => ({ ...x, [d]: v }));
    if (online[d]) setCloudV(v);
  };
  const sync = () => {
    let c = cloudV;
    for (const d of DEVICES) if (online[d.id]) c = Math.max(c, versions[d.id]);
    setCloudV(c);
    setVersions((x) => Object.fromEntries(DEVICES.map((d) => [d.id, online[d.id] ? c : x[d.id]])) as Record<Device, number>);
  };
  return { online, setOnline, versions, cloudV, edit, sync, reset: () => { setOnline({ truong: true, dt: true, nha: false }); setVersions({ truong: 1, dt: 1, nha: 1 }); setCloudV(1); } };
}

function Explore() {
  const [s, setS] = useState<Share>(NOBODY);
  const y = useSync();
  return (
    <SimLayout
      stage={
        <div className="space-y-3">
          <Stage className="p-2"><CloudScene s={s} online={y.online} versions={y.versions} cloudV={y.cloudV} /></Stage>
          <div className="flex flex-wrap gap-2">
            {DEVICES.map((d) => <Button key={d.id} size="sm" variant="secondary" onClick={() => y.edit(d.id)}><d.icon /> Sửa tệp trên {d.label.toLowerCase()}</Button>)}
            <Button size="sm" onClick={y.sync}><Cloud /> Đồng bộ</Button>
          </div>
        </div>
      }
      controls={
        <>
          <Panel title="Kết nối mạng của thiết bị">{DEVICES.map((d) => <SimToggle key={d.id} label={d.label} checked={y.online[d.id]} onChange={(v) => y.setOnline((o) => ({ ...o, [d.id]: v }))} />)}</Panel>
          <Panel title="Chia sẻ bai.docx"><SharePanel s={s} onChange={setS} /></Panel>
          <p className="flex gap-1.5 text-xs text-muted"><Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Liên kết công khai: ai nhận được đường link cũng mở được, kể cả người lạ.</p>
          <ResetAll onClick={() => { setS(NOBODY); y.reset(); }} />
        </>
      }
    />
  );
}

type Task = { kind: "share"; prompt: string; ok: (s: Share) => boolean; hint: (s: Share) => string; why: string } | { kind: "sync"; prompt: string; why: string };
const TASKS: Task[] = [
  { kind: "share", prompt: "Nộp bài cho cô giáo: cô xem và góp ý được nhưng không sửa bài của em. Không ai khác thấy.", ok: (s) => s.perms.co === "binhluan" && s.perms.nhom === "khong" && s.perms.lop === "khong" && s.link === "hanche", hint: (s) => (s.link === "congkhai" ? "Liên kết công khai thì ai có link cũng mở được." : "Quyền nào cho phép góp ý mà không sửa?"), why: "Quyền bình luận: xem và ghi góp ý, không sửa nội dung." },
  { kind: "share", prompt: "Bài thuyết trình nhóm: 4 bạn cùng sửa, cô giáo chỉ xem.", ok: (s) => s.perms.nhom === "sua" && (s.perms.co === "xem" || s.perms.co === "binhluan") && s.perms.lop === "khong" && s.link === "hanche", hint: () => "Nhóm cần quyền chỉnh sửa, cô giáo không cần.", why: "Chia đúng quyền cho đúng người, không mở link công khai." },
  { kind: "share", prompt: "Tệp có số điện thoại, địa chỉ nhà của các bạn. Đặt chia sẻ an toàn nhất.", ok: (s) => Object.values(s.perms).every((p) => p === "khong") && s.link === "hanche", hint: () => "Thông tin cá nhân không nên chia sẻ cho ai, nhất là qua link công khai.", why: "Không chia sẻ tệp có thông tin cá nhân." },
  { kind: "sync", prompt: "Em sửa bài trên điện thoại. Làm sao để máy ở nhà cũng có bản mới nhất?", why: "Thiết bị phải có mạng và đồng bộ với đám mây thì mới nhận bản mới." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [s, setS] = useState<Share>(NOBODY);
  const y = useSync();
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setS(t.kind === "share" && c.idx === 2 ? { ...NOBODY, perms: { co: "xem", nhom: "sua", lop: "xem" }, link: "congkhai" } : NOBODY); y.reset(); }
  const check = () => {
    if (t.kind === "share") return c.check(t.ok(s), t.ok(s) ? t.why : t.hint(s));
    const ok = y.versions.nha === y.cloudV && y.versions.dt === y.cloudV && y.cloudV > 1;
    c.check(ok, ok ? t.why : y.cloudV === 1 ? "Hãy sửa tệp trên điện thoại trước." : "Máy ở nhà đang mất mạng hoặc chưa đồng bộ.");
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["Lưu trên đám mây: tệp ở máy chủ, mọi thiết bị có mạng đều đồng bộ được bản mới nhất.", "Phân quyền: xem < bình luận < chỉnh sửa; chỉ cho đủ quyền cần thiết.", "Liên kết công khai: ai có đường link cũng mở được, cần cẩn thận."]}>
      {t.kind === "share" ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <Stage className="p-2"><CloudScene s={s} online={y.online} versions={y.versions} cloudV={y.cloudV} /></Stage>
          <Panel title="Chia sẻ"><SharePanel s={s} onChange={setS} /></Panel>
        </div>
      ) : (
        <div className="space-y-3">
          <Stage className="p-2"><CloudScene s={s} online={y.online} versions={y.versions} cloudV={y.cloudV} /></Stage>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => y.edit("dt")}><Smartphone /> Sửa trên điện thoại</Button>
            {DEVICES.map((d) => <button key={d.id} type="button" onClick={() => y.setOnline((o) => ({ ...o, [d.id]: !o[d.id] }))} className={cn("inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm", y.online[d.id] ? "border-success/40 text-success-fg" : "border-line text-muted")}>{y.online[d.id] ? <Cloud className="size-4" /> : <CloudOff className="size-4" />} {d.label}</button>)}
            <Button size="sm" onClick={y.sync}><Cloud /> Đồng bộ</Button>
          </div>
        </div>
      )}
    </ChallengeFrame>
  );
}

export function CloudSharingLab() {
  return <SimShell title="Đám mây dữ liệu" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

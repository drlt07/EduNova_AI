"use client";
/**
 * Tin 10 Bài 9 – Tình huống an toàn số (kiểu PhET).
 * Màn Mật khẩu: chỉnh độ dài, loại kí tự, thêm thông tin cá nhân hay từ phổ biến; máy dò mật khẩu
 * cho thấy thời gian bẻ khóa trên thang log từ "dưới 1 giây" đến "triệu năm".
 * Màn Đường link: ghép tên miền con + tên miền + đuôi + đường dẫn, xem trình duyệt thực sự đi đâu.
 * Thử thách: phân loại tin nhắn, chọn mật khẩu mạnh nhất, tìm chỗ lộ thông tin trong ảnh.
 */
import { useState } from "react";
import { Globe, KeyRound, Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { checkPassword, HOTSPOTS, INBOX, judgeMessage, PROFILE, SENSITIVE_COUNT } from "@/lib/sim/digital-safety";
import { ChallengeFrame, Panel, ResetAll, Segmented, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "./kit";

const SETS = { lower: "abcdefghijkmnpqrstuvwxyz", upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", digit: "23456789", sym: "!@#$%&*?+=" };
function makePw(len: number, use: Record<keyof typeof SETS, boolean>, extra: "none" | "year" | "common") {
  const pool = (Object.keys(SETS) as (keyof typeof SETS)[]).filter((k) => use[k]);
  const head = extra === "year" ? `an${PROFILE.birthYear}` : extra === "common" ? "123456" : "";
  let s = head;
  for (let i = 0; s.length < Math.max(len, head.length); i++) { const set = SETS[pool.length ? pool[i % pool.length] : "lower"]; s += set[(i * 7 + len * 3) % set.length]; }
  return s.slice(0, Math.max(len, head.length));
}
const SCALE = [{ s: 1, t: "1 giây" }, { s: 3600, t: "1 giờ" }, { s: 86400 * 365, t: "1 năm" }, { s: 86400 * 365 * 1000, t: "1000 năm" }, { s: 86400 * 365 * 1e6, t: "1 triệu năm" }];
const METER = ["#e11d48", "#f97316", "#eab308", "#22c55e", "#059669"];

/** Ước lượng số giây (log10) để vẽ trên thang. */
function logSeconds(pw: string, score: number) {
  const pool = (/[a-z]/.test(pw) ? 26 : 0) + (/[A-Z]/.test(pw) ? 26 : 0) + (/\d/.test(pw) ? 10 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 33 : 0);
  const raw = pw.length * Math.log10(Math.max(pool, 1)) - 10;
  return score <= 1 ? Math.min(raw, score === 0 ? -1 : 3) : raw;
}

function CrackMeter({ pw }: { pw: string }) {
  const r = checkPassword(pw);
  const lg = logSeconds(pw, r.score);
  const pct = Math.max(0, Math.min(100, ((lg + 1) / 15.5) * 100));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl text-white shadow-lg transition-colors" style={{ background: METER[r.score] }}>{r.score >= 3 ? <Lock className="size-8" aria-hidden /> : <ShieldAlert className="size-8" aria-hidden />}</span>
        <div className="min-w-0">
          <p className="break-all font-mono text-xl font-bold text-white">{pw || "…"}</p>
          <p className="text-sm text-slate-300">Máy dò thử 10 tỉ mật khẩu mỗi giây cần <b className="text-white">{r.crackTime}</b></p>
        </div>
      </div>
      <div>
        <div className="relative h-4 rounded-full bg-gradient-to-r from-rose-600 via-amber-400 to-emerald-500">
          <span className="absolute -top-1 size-6 -translate-x-1/2 rounded-full border-4 border-white bg-slate-900 shadow transition-all duration-500" style={{ left: `${pct}%` }} aria-hidden />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">{SCALE.map((x) => <span key={x.t}>{x.t}</span>)}</div>
      </div>
      <div className="flex gap-1" aria-label={`Độ mạnh: ${r.label}`}>{[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i <= r.score ? METER[r.score] : "#334155" }} />)}</div>
      <p className="text-sm font-bold" style={{ color: METER[r.score] }}>{r.label}</p>
      {r.issues.length > 0 && <ul className="space-y-1 text-sm text-amber-200">{r.issues.map((x) => <li key={x}>• {x}</li>)}</ul>}
    </div>
  );
}

function PasswordScreen() {
  const [len, setLen] = useState(8);
  const [use, setUse] = useState({ lower: true, upper: false, digit: true, sym: false });
  const [extra, setExtra] = useState<"none" | "year" | "common">("none");
  const [own, setOwn] = useState("");
  const pw = own || makePw(len, use, extra);
  return (
    <SimLayout
      stage={<Stage dark className="p-5 sm:p-6"><CrackMeter pw={pw} /></Stage>}
      controls={
        <>
          <Panel title="Tạo mật khẩu">
            <SimSlider label="Độ dài" value={len} min={4} max={20} onChange={(v) => { setLen(v); setOwn(""); }} unit=" kí tự" />
            <SimToggle label="Chữ thường a–z" checked={use.lower} onChange={(v) => { setUse({ ...use, lower: v }); setOwn(""); }} />
            <SimToggle label="Chữ hoa A–Z" checked={use.upper} onChange={(v) => { setUse({ ...use, upper: v }); setOwn(""); }} />
            <SimToggle label="Chữ số 0–9" checked={use.digit} onChange={(v) => { setUse({ ...use, digit: v }); setOwn(""); }} />
            <SimToggle label="Kí hiệu !@#…" checked={use.sym} onChange={(v) => { setUse({ ...use, sym: v }); setOwn(""); }} />
          </Panel>
          <Panel title="Thêm vào đầu">
            <Segmented label="Phần dễ nhớ" value={extra} options={[{ value: "none", label: "Không" }, { value: "year", label: "Tên + năm sinh" }, { value: "common", label: "123456" }]} onChange={(v) => { setExtra(v); setOwn(""); }} />
          </Panel>
          <Panel title="Hoặc tự gõ">
            <Input aria-label="Mật khẩu tự gõ" className="font-mono" placeholder="Gõ thử một mật khẩu" value={own} onChange={(e) => setOwn(e.target.value)} />
            <p className="text-xs text-muted">Chỉ chạy trong trình duyệt, không gửi đi đâu. Đừng gõ mật khẩu thật.</p>
          </Panel>
          <ResetAll onClick={() => { setLen(8); setUse({ lower: true, upper: false, digit: true, sym: false }); setExtra("none"); setOwn(""); }} />
        </>
      }
    />
  );
}

const SUBS = ["", "www.", "vietcombank.com.vn.", "login."];
const DOMAINS = ["vietcombank", "vcb-xacminh", "thptleloi"];
const TLDS = [".com.vn", ".top", ".edu.vn", ".xyz"];
function LinkScreen() {
  const [sub, setSub] = useState(2);
  const [dom, setDom] = useState(1);
  const [tld, setTld] = useState(1);
  const [https, setHttps] = useState(true);
  const host = `${SUBS[sub]}${DOMAINS[dom]}${TLDS[tld]}`;
  const real = `${DOMAINS[dom]}${TLDS[tld]}`;
  const trusted = (dom === 0 && tld === 0) || (dom === 2 && tld === 2);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-5">
          <div className="rounded-2xl border border-line bg-white p-3 shadow-sm dark:bg-slate-900">
            <p className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">{https && <Lock className="size-4 text-emerald-600" aria-label="có https" />}<span className="text-slate-400">{https ? "https://" : "http://"}</span><span className="text-slate-500">{SUBS[sub]}</span><b className={cn("rounded px-1", trusted ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900")}>{real}</b><span className="text-slate-400">/xac-minh</span></p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-center text-sm">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><p className="text-xs uppercase text-muted">Phần đầu (tên miền con)</p><p className="font-mono font-semibold">{SUBS[sub] || "(không có)"}</p><p className="text-xs text-muted">ai cũng tự đặt được</p></div>
            <div className={cn("rounded-xl p-3", trusted ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-rose-100 dark:bg-rose-500/15")}><p className="text-xs uppercase text-muted">Tên miền thật</p><p className="font-mono font-bold">{real}</p><p className="text-xs text-muted">nằm ngay trước dấu “/” đầu tiên</p></div>
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><p className="text-xs uppercase text-muted">Ổ khóa https</p><p className="font-semibold">{https ? "Có" : "Không"}</p><p className="text-xs text-muted">chỉ là mã hóa, không chứng minh trang thật</p></div>
          </div>
          <p role="status" className={cn("rounded-xl px-3 py-2 text-sm font-semibold", trusted ? "bg-emerald-500/10 text-success-fg" : "bg-rose-500/10 text-danger-fg")}>Trình duyệt sẽ đi tới máy chủ của <b>{real}</b>{trusted ? " — đúng tên miền chính thức." : " — KHÔNG phải trang chính thức, dù đầu link trông quen."}</p>
          <p className="text-xs text-muted">Địa chỉ đầy đủ: <code>{host}</code></p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Ghép đường link">
            <Segmented label="Tên miền con" value={sub} options={SUBS.map((s, i) => ({ value: i, label: s || "—" }))} onChange={setSub} />
            <Segmented label="Tên miền" value={dom} options={DOMAINS.map((s, i) => ({ value: i, label: s }))} onChange={setDom} />
            <Segmented label="Đuôi" value={tld} options={TLDS.map((s, i) => ({ value: i, label: s }))} onChange={setTld} />
            <SimToggle label="Có ổ khóa https" checked={https} onChange={setHttps} />
          </Panel>
          <ResetAll onClick={() => { setSub(2); setDom(1); setTld(1); setHttps(true); }} />
        </>
      }
    />
  );
}

type Task = { kind: "msg"; i: number } | { kind: "pw" } | { kind: "photo" };
const TASKS: Task[] = [{ kind: "msg", i: 0 }, { kind: "msg", i: 2 }, { kind: "msg", i: 3 }, { kind: "pw" }, { kind: "msg", i: 5 }, { kind: "photo" }];
const PW_OPTIONS = ["an2009leloi", "Mimi@2009", "matkhau123456", "Ca-phe+Sua!Da_7h"];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [ans, setAns] = useState<string | null>(null);
  const [marks, setMarks] = useState<string[]>([]);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setAns(null); setMarks([]); }
  const m = t.kind === "msg" ? INBOX[t.i] : undefined;
  const prompt = m ? "Tin nhắn này an toàn hay lừa đảo?" : t.kind === "pw" ? "Mật khẩu nào mạnh nhất?" : `Ảnh sắp đăng có ${SENSITIVE_COUNT} chỗ làm lộ thông tin. Bấm vào đủ các chỗ đó.`;
  const check = () => {
    if (m) { if (!ans) return c.check(false, "Chọn An toàn hoặc Lừa đảo."); const r = judgeMessage(m, ans === "scam"); return c.check(r.ok, r.message); }
    if (t.kind === "pw") { const best = PW_OPTIONS.reduce((a, b) => (checkPassword(b).score > checkPassword(a).score ? b : a)); return c.check(ans === best, ans === best ? `Đúng: dài, trộn đủ loại kí tự, không có thông tin cá nhân — cần ${checkPassword(best).crackTime} để dò.` : ans ? `Chưa: ${checkPassword(ans).issues[0] ?? "còn mật khẩu mạnh hơn."}` : "Chọn một mật khẩu."); }
    const wrong = marks.filter((id) => !HOTSPOTS.find((h) => h.id === id)!.sensitive);
    const found = marks.filter((id) => HOTSPOTS.find((h) => h.id === id)!.sensitive).length;
    return c.check(!wrong.length && found === SENSITIVE_COUNT, wrong.length ? `${HOTSPOTS.find((h) => h.id === wrong[0])!.label}: ${HOTSPOTS.find((h) => h.id === wrong[0])!.why}` : found < SENSITIVE_COUNT ? `Mới tìm được ${found}/${SENSITIVE_COUNT} chỗ.` : "Đủ cả! Che thẻ, biển số, mã vé và đừng báo nhà vắng người.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Lừa đảo hay giục gấp, đe dọa, xin OTP, đòi phí; xem tên miền thật trước dấu “/”.", "Mật khẩu mạnh: dài, trộn loại kí tự, không chứa thông tin cá nhân.", "Trước khi đăng ảnh, che thông tin cá nhân và không báo lịch vắng nhà."]}>
      <Stage className="p-4">
        {m && (
          <div className="space-y-3">
            <div className="max-w-md rounded-2xl rounded-tl-sm bg-white p-3 shadow dark:bg-slate-900"><p className="text-xs font-semibold text-muted">{m.channel} · {m.from}</p><p className="mt-1 text-sm text-fg">{m.text}</p>{m.link && <p className="mt-1 text-sm text-blue-600 underline" title={`Thật ra dẫn tới: ${m.link.real}`}>{m.link.shown}</p>}{m.link && <p className="mt-1 text-xs text-muted">Di chuột vào link: thật ra dẫn tới <code>{m.link.real}</code></p>}</div>
            <div className="flex gap-2">{[["safe", "An toàn"], ["scam", "Lừa đảo"]].map(([id, l]) => <button key={id} type="button" aria-pressed={ans === id} onClick={() => setAns(id)} className={cn("rounded-xl border-2 px-4 py-2 font-semibold", ans === id ? (id === "scam" ? "border-rose-500 bg-rose-500 text-white" : "border-emerald-500 bg-emerald-500 text-white") : "border-line bg-surface text-fg")}>{l}</button>)}</div>
          </div>
        )}
        {t.kind === "pw" && <div className="grid gap-2 sm:grid-cols-2">{PW_OPTIONS.map((p) => <button key={p} type="button" aria-pressed={ans === p} onClick={() => setAns(p)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-mono", ans === p ? "border-brand bg-brand/10" : "border-line bg-surface")}><KeyRound className="mr-2 inline size-4" aria-hidden />{p}</button>)}</div>}
        {t.kind === "photo" && (
          <svg viewBox="0 0 600 380" className="w-full rounded-xl" role="group" aria-label="Ảnh sắp đăng">
            <rect width="600" height="380" fill="#bae6fd" /><rect y="200" width="600" height="180" fill="#bbf7d0" />
            <circle cx="90" cy="60" r="28" fill="#fde047" /><rect x="430" y="60" width="150" height="150" fill="#fca5a5" /><rect x="450" y="45" width="100" height="34" rx="4" fill="#1e3a8a" /><text x="500" y="68" textAnchor="middle" className="fill-white text-[16px] font-bold">Số 12 ngõ 5</text>
            <rect x="160" y="200" width="92" height="56" rx="6" fill="white" stroke="#334155" /><text x="206" y="222" textAnchor="middle" className="text-[11px] font-bold">THẺ HỌC SINH</text><text x="206" y="240" textAnchor="middle" className="text-[10px]">Nguyễn Văn An 10A1</text>
            <rect x="305" y="255" width="80" height="70" rx="4" fill="white" stroke="#334155" /><rect x="320" y="268" width="48" height="44" fill="#0f172a" /><rect x="328" y="276" width="14" height="14" fill="white" />
            <ellipse cx="85" cy="275" rx="40" ry="28" fill="#f97316" /><circle cx="60" cy="250" r="16" fill="#f97316" />
            <rect x="20" y="335" width="560" height="36" rx="8" fill="white" opacity="0.92" /><text x="300" y="358" textAnchor="middle" className="text-[15px]">Cả nhà đi Đà Nẵng 1 tuần, nhà vắng tanh! 🏖️</text>
            {HOTSPOTS.map((h) => { const on = marks.includes(h.id); return <rect key={h.id} x={h.x} y={h.y} width={h.w} height={h.h} rx={8} fill={on ? "rgba(244,63,94,.25)" : "transparent"} stroke={on ? "#e11d48" : "transparent"} strokeWidth={3} className="cursor-pointer hover:stroke-amber-400" onClick={() => setMarks(on ? marks.filter((x) => x !== h.id) : [...marks, h.id])}><title>{h.label}</title></rect>; })}
          </svg>
        )}
      </Stage>
    </ChallengeFrame>
  );
}

export function DigitalSafetyLab() {
  return <SimShell title="Tình huống an toàn số" screens={[{ id: "mat-khau", label: "Mật khẩu", icon: KeyRound, render: () => <PasswordScreen /> }, { id: "duong-link", label: "Đường link", icon: Globe, render: () => <LinkScreen /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

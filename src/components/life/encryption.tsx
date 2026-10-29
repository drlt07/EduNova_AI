"use client";
/** Mã hóa tin nhắn: mật mã Caesar (dễ bẻ vì chỉ 25 khóa) và ý tưởng ổ khóa công khai / chìa riêng của mã hóa đầu cuối. */
import { useState } from "react";
import { KeyRound, Lock, LockOpen, MessageSquareLock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "@/components/phet/kit";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase();
export const caesar = (s: string, k: number) => plain(s).replace(/[A-Z]/g, (ch) => A[(A.indexOf(ch) + k + 26) % 26]);

function Wheel({ k }: { k: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full gap-0.5 font-mono text-xs" style={{ gridTemplateColumns: "repeat(26, minmax(18px, 1fr))" }}>
        {A.split("").map((c) => <span key={c} className="rounded-t bg-slate-200 py-1 text-center font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{c}</span>)}
        {A.split("").map((c, i) => <span key={c} className="rounded-b bg-blue-600 py-1 text-center font-bold text-white">{A[(i + k) % 26]}</span>)}
      </div>
    </div>
  );
}

function CaesarScreen() {
  const [msg, setMsg] = useState("Hen gap o cong truong luc 5 gio");
  const [k, setK] = useState(3);
  const [spy, setSpy] = useState(false);
  const enc = caesar(msg, k);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <Wheel k={k} />
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900"><p className="flex items-center gap-1 text-xs font-semibold text-muted"><User className="size-3.5" aria-hidden /> An viết</p><p className="font-mono text-sm text-fg">{plain(msg)}</p></div>
            <Lock className="mx-auto size-6 text-blue-600" aria-hidden />
            <div className="rounded-2xl bg-slate-900 p-3"><p className="text-xs font-semibold text-slate-400">Đi trên mạng</p><p className="break-all font-mono text-sm text-emerald-300">{enc}</p></div>
          </div>
          {spy && (
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 dark:bg-rose-500/10">
              <p className="mb-2 text-sm font-semibold text-rose-700 dark:text-rose-300">Kẻ nghe lén thử hết 25 khóa (mất chưa tới 1 giây):</p>
              <ul className="grid max-h-48 gap-0.5 overflow-y-auto font-mono text-xs sm:grid-cols-2">{Array.from({ length: 25 }, (_, i) => i + 1).map((t) => <li key={t} className={cn("rounded px-1", t === k && "bg-rose-200 font-bold text-rose-900")}>khóa {t}: {caesar(enc, -t)}</li>)}</ul>
            </div>
          )}
        </Stage>
      }
      controls={
        <>
          <Panel title="Tin nhắn"><Input aria-label="Tin nhắn" value={msg} onChange={(e) => setMsg(e.target.value)} /></Panel>
          <Panel title="Khóa"><SimSlider label="Dịch mỗi chữ" value={k} min={1} max={25} onChange={setK} unit=" chữ" /></Panel>
          <Panel title="Tấn công"><SimToggle label="Có kẻ nghe lén" checked={spy} onChange={setSpy} /><p className="text-xs text-muted">Chỉ có 25 khóa nên thử hết là ra. Mã hóa thật dùng khóa dài hàng trăm bit: thử hết mất hàng tỉ năm.</p></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Số khóa" value="25" tone="rose" /><Readout label="Khóa thật" value="2²⁵⁶" tone="green" /></div>
          <ResetAll onClick={() => { setMsg("Hen gap o cong truong luc 5 gio"); setK(3); setSpy(false); }} />
        </>
      }
    />
  );
}

type Step = 0 | 1 | 2 | 3;
const STEPS = ["Bình gửi ổ khóa công khai (đang mở) cho An — ai thấy cũng không sao.", "An bỏ tin nhắn vào hộp và bấm khóa bằng ổ khóa của Bình.", "Hộp đi qua máy chủ ứng dụng nhắn tin: máy chủ chỉ thấy hộp khóa.", "Chỉ Bình có chìa riêng nên chỉ Bình mở được hộp."];
function LockScreen() {
  const [step, setStep] = useState<Step>(0);
  const [eve, setEve] = useState(true);
  return (
    <SimLayout
      stage={
        <Stage className="p-4">
          <div className="grid grid-cols-3 items-center gap-2 text-center">
            {[{ n: "An", show: true }, { n: "Máy chủ", show: true }, { n: "Bình", show: true }].map((p, i) => (
              <div key={p.n} className="flex flex-col items-center gap-2">
                <span className={cn("grid size-14 place-items-center rounded-full text-white", i === 1 ? "bg-slate-500" : "bg-blue-600")}><User className="size-7" aria-hidden /></span>
                <b className="text-sm text-fg">{p.n}</b>
                {i === 2 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"><KeyRound className="size-3.5" aria-hidden /> chìa riêng</span>}
              </div>
            ))}
          </div>
          <div className="relative mt-6 h-24 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-100 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
            <span className="absolute top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-amber-500 text-white shadow-lg transition-all duration-700" style={{ left: step === 0 ? "83%" : step === 1 ? "17%" : step === 2 ? "50%" : "83%" }}>
              {step === 0 ? <LockOpen className="size-7" aria-label="ổ khóa mở" /> : step === 3 ? <MessageSquareLock className="size-7" aria-label="đã mở" /> : <Lock className="size-7" aria-label="hộp đã khóa" />}
            </span>
          </div>
          <p className="mt-4 rounded-xl bg-white p-3 text-sm text-fg shadow-sm dark:bg-slate-900" aria-live="polite">Bước {step + 1}/4: {STEPS[step]}</p>
          {eve && step === 2 && <p className="mt-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">Kẻ xấu chặn được hộp ở máy chủ nhưng không có chìa riêng của Bình nên chỉ thấy: <span className="font-mono">9f3a…c71e</span></p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Gửi tin">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1) as Step)} className="rounded-xl bg-surface py-2 text-sm font-semibold hover:bg-line">← Lùi</button>
              <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1) as Step)} className="rounded-xl bg-brand py-2 text-sm font-semibold text-brand-ink">Bước tiếp →</button>
            </div>
          </Panel>
          <Panel title="Thử"><SimToggle label="Có kẻ chặn ở máy chủ" checked={eve} onChange={setEve} /><p className="text-xs text-muted">Đây là ý tưởng của mã hóa đầu cuối trong Zalo, Messenger, WhatsApp: cả công ty cũng không đọc được tin.</p></Panel>
          <ResetAll onClick={() => { setStep(0); setEve(true); }} />
        </>
      }
    />
  );
}

const TASKS = [
  { kind: "decode" as const, enc: caesar("XIN CHAO", 4), ans: "XIN CHAO", key: 4 },
  { kind: "encode" as const, msg: "MEO", key: 2 },
  { kind: "who" as const },
  { kind: "why" as const },
];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [ans, setAns] = useState<string | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setAns(null); }
  const prompt = t.kind === "decode" ? <>Giải mã <span className="font-mono">{t.enc}</span> biết khóa là {t.key} (lùi {t.key} chữ).</> : t.kind === "encode" ? <>Mã hóa chữ <span className="font-mono">{t.msg}</span> với khóa {t.key}.</> : t.kind === "who" ? "Với mã hóa đầu cuối, ai đọc được tin An gửi Bình?" : "Vì sao mật mã Caesar không an toàn?";
  const opts = t.kind === "who" ? [["binh", "Chỉ Bình"], ["server", "Bình và công ty nhắn tin"], ["all", "Ai có Wi-Fi cùng quán"]] : [["it-khoa", "Chỉ có 25 khóa, thử hết rất nhanh"], ["dai", "Tin nhắn quá dài"], ["chu", "Không mã hóa được chữ số"]];
  const check = () => {
    if (t.kind === "decode") { const ok = plain(typed).trim() === t.ans; return c.check(ok, ok ? "Đúng!" : "Lùi mỗi chữ 4 vị trí trong bảng chữ cái."); }
    if (t.kind === "encode") { const want = caesar(t.msg, t.key); const ok = plain(typed).trim() === want; return c.check(ok, ok ? `Đúng: ${want}.` : "Dịch mỗi chữ tiến 2 vị trí: M → O."); }
    if (t.kind === "who") return c.check(ans === "binh", ans === "binh" ? "Đúng: chỉ người có chìa riêng mới mở được; máy chủ chỉ chuyển hộp đã khóa." : "Ai giữ chìa riêng?");
    return c.check(ans === "it-khoa", ans === "it-khoa" ? "Đúng: kẻ nghe lén thử 25 khóa là đọc được." : "Thử bật kẻ nghe lén ở màn Caesar.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Mã hóa biến tin nhắn thành dạng không đọc được nếu không có khóa.", "Khóa càng nhiều khả năng càng khó bẻ: Caesar 25 khóa, mã hóa hiện đại 2²⁵⁶.", "Mã hóa đầu cuối: khóa bằng ổ khóa công khai của người nhận, chỉ chìa riêng của họ mở được."]}>
      <Stage className="space-y-3 p-4">
        {(t.kind === "decode" || t.kind === "encode") ? <><Wheel k={t.key} /><Input aria-label="Câu trả lời" className="max-w-60 font-mono uppercase" value={typed} onChange={(e) => setTyped(e.target.value)} /></>
          : <div className="grid gap-2 sm:grid-cols-3">{opts.map(([id, l]) => <button key={id} type="button" aria-pressed={ans === id} onClick={() => setAns(id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", ans === id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{l}</button>)}</div>}
      </Stage>
    </ChallengeFrame>
  );
}

export function EncryptionLab() {
  return <SimShell title="Mã hóa tin nhắn" screens={[{ id: "caesar", label: "Mật mã Caesar", icon: KeyRound, render: () => <CaesarScreen /> }, { id: "o-khoa", label: "Ổ khóa công khai", icon: Lock, render: () => <LockScreen /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

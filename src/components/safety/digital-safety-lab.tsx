"use client";
import { useState } from "react";
import { Camera, CheckCircle2, Eye, EyeOff, KeyRound, Link2, Mail, MessageCircle, ShieldAlert, Smartphone } from "lucide-react";
import { HOTSPOTS, INBOX, PROFILE, SENSITIVE_COUNT, checkPassword, judgeMessage } from "@/lib/sim/digital-safety";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { MissionDone, MissionLayout, type Feedback, type MissionStage } from "@/components/sim/mission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGES: MissionStage[] = [
  { id: "inbox", label: "Hộp thư lừa đảo", icon: Mail },
  { id: "password", label: "Mật khẩu", icon: KeyRound },
  { id: "photo", label: "Ảnh trước khi đăng", icon: Camera },
];
const METER = ["bg-red-500", "bg-orange-500", "bg-amber-400", "bg-lime-500", "bg-emerald-500"];

function Phone({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between rounded-t-[1.5rem] bg-white px-4 pb-1 pt-2 text-[10px] font-semibold text-slate-900"><span>09:41</span><span className="h-4 w-20 rounded-full bg-slate-900" /><span>5G ▮▮▮</span></div>
      <p className="border-b border-slate-200 bg-white px-4 pb-2 text-sm font-bold text-slate-900">{title}</p>
      <div className="h-[430px] overflow-y-auto rounded-b-[1.5rem] bg-slate-50 text-slate-900">{children}</div>
    </div>
  );
}

/** Ảnh “sắp đăng”: vẽ bằng SVG, có các vùng bấm được. */
function PostPhoto({ found, onPick }: { found: string[]; onPick: (id: string) => void }) {
  return (
    <svg viewBox="0 0 600 380" className="block h-auto w-full rounded-xl" role="group" aria-label="Ảnh sắp đăng lên mạng xã hội">
      <rect width="600" height="330" fill="#bae6fd" />
      <circle cx="80" cy="60" r="28" fill="#fde047" />
      <rect y="200" width="600" height="130" fill="#86efac" />
      <path d="M150 60 l30-30 30 30z M140 90 l40-40 40 40z" fill="#16a34a" />
      {/* nhà và biển số */}
      <rect x="400" y="30" width="190" height="180" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
      <path d="M390 35 L495 -20 L600 35z" fill="#b45309" />
      <rect x="455" y="130" width="60" height="80" fill="#92400e" />
      <rect x="445" y="50" width="110" height="34" rx="4" fill="#1d4ed8" />
      <text x="500" y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">Số 12 ngõ 5</text>
      {/* người, thẻ học sinh, vé */}
      <circle cx="260" cy="120" r="34" fill="#fcd34d" />
      <rect x="215" y="155" width="90" height="120" rx="20" fill="#2563eb" />
      <rect x="160" y="195" width="100" height="62" rx="6" fill="#fff" stroke="#0f172a" />
      <text x="170" y="212" fontSize="9" fontWeight="700" fill="#0f172a">THẺ HỌC SINH</text>
      <text x="170" y="226" fontSize="8" fill="#0f172a">Nguyễn Văn An · 10A1</text>
      <text x="170" y="238" fontSize="8" fill="#0f172a">THPT Lê Lợi · HS0213</text>
      <rect x="305" y="255" width="80" height="70" rx="4" fill="#fff" stroke="#0f172a" />
      <text x="345" y="268" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f172a">BOARDING PASS</text>
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ((r * 3 + c * 7) % 3 ? null : <rect key={`${r}${c}`} x={325 + c * 8} y={275 + r * 8} width="7" height="7" fill="#0f172a" />)))}
      {/* mèo */}
      <ellipse cx="85" cy="275" rx="38" ry="24" fill="#f97316" />
      <circle cx="60" cy="250" r="18" fill="#f97316" />
      <path d="M48 236 l4-14 8 10z M66 234 l6-12 4 14z" fill="#f97316" />
      {/* chú thích */}
      <rect y="330" width="600" height="50" fill="#fff" />
      <text x="24" y="360" fontSize="15" fill="#0f172a">📍 Cả nhà đi Đà Nẵng 1 tuần, nhà vắng tanh! ✈️ #dulich</text>
      {HOTSPOTS.map((h) => {
        const hit = found.includes(h.id);
        return (
          <rect
            key={h.id}
            x={h.x} y={h.y} width={h.w} height={h.h} rx="8"
            role="button" tabIndex={0} aria-label={h.label}
            onClick={() => onPick(h.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(h.id); } }}
            className="cursor-pointer outline-none focus-visible:stroke-cyan-500"
            fill={hit ? (h.sensitive ? "rgba(239,68,68,0.25)" : "rgba(148,163,184,0.25)") : "transparent"}
            stroke={hit ? (h.sensitive ? "#ef4444" : "#94a3b8") : "transparent"}
            strokeWidth="3"
            strokeDasharray={hit ? undefined : "6 6"}
          />
        );
      })}
    </svg>
  );
}

/**
 * Tình huống an toàn số (Tin 10 – Bài 9, 11): phân loại tin nhắn lừa đảo trong điện thoại (kiểm tra link thật),
 * đặt mật khẩu đủ mạnh không lộ thông tin cá nhân, tìm chi tiết lộ thông tin trong ảnh trước khi đăng.
 */
export function DigitalSafetyLab() {
  const [stage, setStage] = useState("inbox");
  const [msgIdx, setMsgIdx] = useState(0);
  const [peek, setPeek] = useState(false);
  const [judged, setJudged] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const msg = INBOX[msgIdx];
  const check = checkPassword(pw);
  const sensitiveFound = found.filter((id) => HOTSPOTS.find((h) => h.id === id)?.sensitive).length;

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Tình huống an toàn số",
    summary: stage === "inbox" ? `Đang xét tin nhắn từ ${msg.from}: "${msg.text}"` : stage === "password" ? `Mật khẩu hiện ở mức ${check.label}, ${pw.length} kí tự (không gửi nội dung mật khẩu).` : `Đã tìm ${sensitiveFound}/${SENSITIVE_COUNT} chi tiết lộ thông tin trong ảnh.`,
    problems: stage === "password" ? check.issues : feedback && !feedback.ok ? [feedback.text] : [],
    facts: { stage, mistakes },
  }), { title: "An toàn số · Tin 10", topic: "general", level: "free" });

  const judge = (scam: boolean) => {
    if (judged !== null) return;
    touchTutor();
    const r = judgeMessage(msg, scam);
    setJudged(scam);
    if (!r.ok) setMistakes((m) => m + 1);
    setFeedback({ ok: r.ok, text: r.message });
  };
  const pick = (id: string) => {
    if (found.includes(id)) return;
    touchTutor();
    const h = HOTSPOTS.find((x) => x.id === id)!;
    setFound((f) => [...f, id]);
    if (!h.sensitive) setMistakes((m) => m + 1);
    setFeedback({ ok: h.sensitive, text: h.sensitive ? `Phát hiện: ${h.label}. ${h.why}` : `${h.label}: ${h.why}` });
  };
  const restart = () => { setStage("inbox"); setMsgIdx(0); setPeek(false); setJudged(null); setPw(""); setFound([]); setMistakes(0); setFeedback(null); };

  const scene = (
    <div className="rounded-2xl border border-line bg-gradient-to-br from-[#e0e7ff] to-[#fce7f3] p-4">
      {stage === "inbox" && (
        <Phone title="Tin nhắn">
          <ul className="divide-y divide-slate-200">
            {INBOX.map((m, i) => (
              <li key={m.id} className={cn("flex gap-2 px-3 py-2.5", i === msgIdx ? "bg-blue-50" : i < msgIdx ? "opacity-50" : "")}>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-white", m.channel === "Zalo" ? "bg-blue-500" : m.channel === "Email" ? "bg-rose-500" : "bg-emerald-500")}>{m.channel === "Email" ? <Mail className="size-4" /> : <MessageCircle className="size-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-xs font-semibold"><span className="truncate">{m.from}</span><span className="text-[10px] font-normal text-slate-400">{m.channel}</span></span>
                  <span className={cn("block text-xs text-slate-600", i !== msgIdx && "line-clamp-1")}>{m.text}</span>
                  {i === msgIdx && m.link && (
                    <span className="mt-1 block">
                      <span className="block break-all text-xs text-blue-600 underline">{m.link.shown}</span>
                      {peek && <span className={cn("mt-1 block rounded bg-slate-900 px-2 py-1 font-mono text-[10px]", m.link.real === m.link.shown ? "text-emerald-300" : "text-red-300")}>Địa chỉ thật: {m.link.real}</span>}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Phone>
      )}
      {stage === "password" && (
        <Phone title="Tạo tài khoản học tập">
          <div className="space-y-3 p-4 text-sm">
            <p className="text-xs text-slate-500">Hồ sơ của em: {PROFILE.fullName}, sinh năm {PROFILE.birthYear}, trường Lê Lợi, mèo tên Mimi.</p>
            <label className="block text-xs font-semibold" htmlFor="sf-pw">Mật khẩu</label>
            <div className="relative">
              <input id="sf-pw" type={showPw ? "text" : "password"} autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 font-mono text-sm" placeholder="Nhập mật khẩu…" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">{showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </div>
            <div className="grid grid-cols-5 gap-1" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={cn("h-2 rounded-full", pw && i <= check.score ? METER[check.score] : "bg-slate-200")} />)}</div>
            <p className="text-xs"><b>{pw ? check.label : "—"}</b>{pw && <> · máy tính dò ra trong <b>{check.crackTime}</b></>}</p>
            <ul className="space-y-1 text-xs text-red-600">{pw && check.issues.map((i) => <li key={i}>• {i}</li>)}</ul>
            {check.ok && <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="size-4" /> Mật khẩu đạt yêu cầu!</p>}
          </div>
        </Phone>
      )}
      {(stage === "photo" || stage === "done") && (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <p className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900"><span className="grid size-7 place-items-center rounded-full bg-blue-500 text-xs text-white">A</span> Nguyễn Văn An · <span className="font-normal text-slate-500">Công khai 🌐</span></p>
          <PostPhoto found={found} onPick={pick} />
          <p className="px-4 py-2 text-xs text-slate-500">Bản nháp — chưa đăng</p>
        </div>
      )}
    </div>
  );

  return (
    <MissionLayout scene={scene} stages={STAGES} current={stage} feedback={feedback} mistakes={mistakes}>
      {stage === "inbox" && (
        <>
          <h3 className="flex items-center gap-1.5 font-semibold text-fg"><Smartphone className="size-4" aria-hidden /> Nhiệm vụ 1 · Tin nhắn {msgIdx + 1}/{INBOX.length}</h3>
          <p className="mt-1 text-sm text-muted">Đọc tin đang sáng trong điện thoại. {msg.link ? "Có đường link — hãy kiểm tra địa chỉ thật trước khi quyết định." : ""}</p>
          {msg.link && <Button size="sm" variant="secondary" className="mt-2" onClick={() => { setPeek(true); touchTutor(); }}><Link2 /> Kiểm tra link</Button>}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Button size="sm" variant={judged === false ? "primary" : "secondary"} disabled={judged !== null} onClick={() => judge(false)}>An toàn</Button>
            <Button size="sm" variant={judged === true ? "primary" : "secondary"} disabled={judged !== null} onClick={() => judge(true)}><ShieldAlert /> Lừa đảo</Button>
          </div>
          {judged !== null && <Button size="sm" className="mt-3" onClick={() => { setJudged(null); setPeek(false); setFeedback(null); if (msgIdx + 1 < INBOX.length) setMsgIdx(msgIdx + 1); else setStage("password"); }}>{msgIdx + 1 < INBOX.length ? "Tin tiếp theo →" : "Nhiệm vụ tiếp theo →"}</Button>}
        </>
      )}
      {stage === "password" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 2 · Đặt mật khẩu “Rất mạnh”</h3>
          <p className="mt-1 text-sm text-muted">Gõ thử trong điện thoại và xem đồng hồ đo. Mẹo: ghép vài từ không liên quan với kí hiệu và số, ví dụ kiểu <code>Trâu-Vàng#Gác7Cầu</code> (đừng dùng đúng ví dụ này).</p>
          <ul className="mt-2 space-y-0.5 text-xs text-muted"><li>• Không dùng tên, năm sinh, tên trường, tên thú cưng.</li><li>• Mỗi tài khoản một mật khẩu; bật xác thực hai lớp nếu có.</li></ul>
          {check.ok && <Button size="sm" className="mt-3" onClick={() => { setStage("photo"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
        </>
      )}
      {stage === "photo" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Trước khi bấm “Đăng” ({sensitiveFound}/{SENSITIVE_COUNT})</h3>
          <p className="mt-1 text-sm text-muted">An định đăng ảnh này ở chế độ Công khai. Bấm vào những chi tiết làm lộ thông tin cá nhân.</p>
          <ul className="mt-2 space-y-1 text-xs">{found.map((id) => { const h = HOTSPOTS.find((x) => x.id === id)!; return <li key={id} className={h.sensitive ? "text-danger-fg" : "text-muted line-through"}>• {h.label}</li>; })}</ul>
          {sensitiveFound === SENSITIVE_COUNT && <Button size="sm" className="mt-3" onClick={() => { setStage("done"); setFeedback(null); }}>Xem kết quả</Button>}
        </>
      )}
      {stage === "done" && (
        <MissionDone
          mistakes={mistakes}
          title="Em đã tự bảo vệ mình trên không gian mạng!"
          onRestart={restart}
          points={[
            <>Tin lừa đảo thường <b>giục gấp, đòi tiền, xin OTP hoặc dẫn tới link lạ</b> — kiểm tra địa chỉ thật, gọi xác minh người thân.</>,
            <>Mật khẩu mạnh: <b>dài, nhiều loại kí tự, không chứa thông tin cá nhân</b>, mỗi tài khoản một mật khẩu.</>,
            <>Trước khi đăng: che <b>giấy tờ, địa chỉ, mã QR</b>, đừng báo “nhà vắng”; chọn chế độ chỉ bạn bè.</>,
          ]}
        />
      )}
    </MissionLayout>
  );
}

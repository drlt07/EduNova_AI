"use client";
import { useMemo, useState } from "react";
import { Brain, Database, FlaskConical, Plus, Sparkles, Tag } from "lucide-react";
import { AI_OR_NOT, BIAS_ANSWER, BIAS_OPTIONS, EXTRA_KEO, LABEL_TEXT, TEST, TRAIN, decisionGrid, evaluate, type Label, type Mango } from "@/lib/sim/ai-mango";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { MissionDone, MissionLayout, type Feedback, type MissionStage } from "@/components/sim/mission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGES: MissionStage[] = [
  { id: "label", label: "Gán nhãn & huấn luyện", icon: Tag },
  { id: "test", label: "Kiểm tra & thiên lệch", icon: FlaskConical },
  { id: "aiornot", label: "AI hay không?", icon: Brain },
];

const mix = (t: number) => {
  // xanh lá (#4d7c0f) → vàng (#facc15)
  const a = [0x4d, 0x7c, 0x0f], b = [0xfa, 0xcc, 0x15];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
};

function MangoIcon({ color, className }: { color: number; className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <path d="M30 8 C46 8 54 24 50 38 C46 52 30 56 20 50 C8 44 8 26 16 16 C20 11 25 8 30 8Z" fill={mix(color)} stroke="#365314" strokeWidth="1.5" />
      <path d="M30 8 C34 2 42 2 44 6 C38 8 34 8 30 8Z" fill="#16a34a" />
      <ellipse cx="22" cy="24" rx="5" ry="8" fill="#fff" opacity="0.25" />
    </svg>
  );
}

/** Biểu đồ 2 đặc trưng (màu vỏ, độ mềm) với vùng quyết định của mô hình. */
function Scatter({ train, test, trained, results }: { train: Mango[]; test?: Mango[]; trained: boolean; results?: Map<string, Label> }) {
  const S = 300, P = 36;
  const grid = useMemo(() => (trained ? decisionGrid(train, 24) : null), [train, trained]);
  const px = (v: number) => P + v * S;
  const py = (v: number) => P + (1 - v) * S;
  return (
    <svg viewBox={`0 0 ${S + P + 12} ${S + P + 30}`} className="mx-auto block h-auto w-full max-w-[420px]" role="img" aria-label="Biểu đồ màu vỏ và độ mềm">
      <rect x={P} y={P} width={S} height={S} fill="#f8fafc" stroke="#cbd5e1" />
      {grid?.map((row, r) => row.map((l, c) => <rect key={`${r}-${c}`} x={P + (c * S) / 24} y={P + (r * S) / 24} width={S / 24 + 0.5} height={S / 24 + 0.5} fill={l === "chin" ? "#fde68a" : "#bbf7d0"} opacity={0.7} />))}
      <text x={P + S / 2} y={P + S + 26} textAnchor="middle" fontSize="12" fill="#475569">Màu vỏ: xanh → vàng</text>
      <text x={12} y={P + S / 2} textAnchor="middle" fontSize="12" fill="#475569" transform={`rotate(-90 12 ${P + S / 2})`}>Độ mềm: cứng → mềm</text>
      {train.map((t) => <circle key={t.id} cx={px(t.color)} cy={py(t.soft)} r={7} fill={t.label === "chin" ? "#f59e0b" : "#16a34a"} stroke={t.variety === "Xoài keo" ? "#7c3aed" : "#fff"} strokeWidth={2.5} />)}
      {test?.map((t) => {
        const g = results?.get(t.id);
        const ok = g === t.label;
        return (
          <g key={t.id} transform={`translate(${px(t.color)} ${py(t.soft)})`}>
            <rect x={-7} y={-7} width={14} height={14} transform="rotate(45)" fill={t.label === "chin" ? "#f59e0b" : "#16a34a"} stroke={g ? (ok ? "#0f172a" : "#ef4444") : "#0f172a"} strokeWidth={g && !ok ? 3.5 : 1.5} />
            {g && !ok && <text y={-12} textAnchor="middle" fontSize="13" fontWeight="800" fill="#ef4444">✗</text>}
          </g>
        );
      })}
      <g transform={`translate(${P} 12)`} fontSize="11" fill="#334155">
        <circle cx={6} cy={0} r={5} fill="#f59e0b" /><text x={14} y={4}>chín</text>
        <circle cx={60} cy={0} r={5} fill="#16a34a" /><text x={68} y={4}>còn xanh</text>
        <rect x={130} y={-5} width={10} height={10} transform="rotate(45 135 0)" fill="#94a3b8" /><text x={146} y={4}>quả mới cần đoán</text>
      </g>
    </svg>
  );
}

/**
 * Khám phá AI (Tin 12 – Bài 1, 2): gán nhãn xoài để huấn luyện mô hình phân loại, kiểm tra trên lô mới,
 * phát hiện thiên lệch do dữ liệu chỉ có một giống xoài, bổ sung dữ liệu và huấn luyện lại; phân biệt AI với chương trình thường.
 */
export function AiDiscoveryLab() {
  const [stage, setStage] = useState("label");
  const [labels, setLabels] = useState<Record<string, Label>>({});
  const [trained, setTrained] = useState(false);
  const [extra, setExtra] = useState(false);
  const [tested, setTested] = useState(false);
  const [biasAns, setBiasAns] = useState<number | null>(null);
  const [aiIdx, setAiIdx] = useState(0);
  const [aiAns, setAiAns] = useState<boolean | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const next = TRAIN.find((t) => !labels[t.id]);
  const trainSet = useMemo(() => [...TRAIN, ...(extra ? EXTRA_KEO : [])], [extra]);
  const result = useMemo(() => evaluate(trainSet, TEST), [trainSet]);
  const resultMap = useMemo(() => new Map(result.rows.map((r) => [r.id, r.guess])), [result]);
  const q = AI_OR_NOT[aiIdx];

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Khám phá AI (phân loại xoài)",
    summary: stage === "label" ? `Đã gán nhãn ${Object.keys(labels).length}/${TRAIN.length} quả.` : stage === "test" ? `Độ chính xác trên lô mới: ${tested ? result.accuracy + "%" : "chưa kiểm tra"}; ${extra ? "đã" : "chưa"} bổ sung dữ liệu xoài keo.` : `Tình huống: ${q?.text}`,
    problems: feedback && !feedback.ok ? [feedback.text] : [],
    facts: { stage, mistakes, accuracy: tested ? result.accuracy : -1 },
  }), { title: "Khám phá AI · Tin 12", topic: "general", level: "free" });

  const label = (l: Label) => {
    if (!next) return;
    touchTutor();
    if (l !== next.label) {
      setMistakes((x) => x + 1);
      setFeedback({ ok: false, text: `Chưa đúng: quả này vỏ ${next.color > 0.5 ? "vàng" : "xanh"}, ${next.soft > 0.5 ? "mềm" : "cứng"} → ${LABEL_TEXT[next.label].toLowerCase()}. Nhãn sai sẽ dạy máy sai!` });
    } else setFeedback({ ok: true, text: `Gán nhãn “${LABEL_TEXT[l]}”.` });
    setLabels((x) => ({ ...x, [next.id]: next.label }));
  };

  const restart = () => { setStage("label"); setLabels({}); setTrained(false); setExtra(false); setTested(false); setBiasAns(null); setAiIdx(0); setAiAns(null); setMistakes(0); setFeedback(null); };

  const scene = (
    <div className="space-y-3 rounded-2xl border border-line bg-gradient-to-br from-[#fef9c3] to-[#ede9fe] p-3 text-slate-900">
      {stage === "label" && (
        <ul className="grid grid-cols-5 gap-2">
          {TRAIN.map((t) => {
            const l = labels[t.id];
            return (
              <li key={t.id} className={cn("rounded-xl border-2 bg-white p-2 text-center", t === next ? "border-cyan-500 shadow-lg" : l ? (l === "chin" ? "border-amber-300" : "border-green-300") : "border-transparent opacity-70")}>
                <MangoIcon color={t.color} className="mx-auto size-12" />
                <p className="mt-1 text-[10px] text-slate-500">mềm</p>
                <div className="mx-auto h-1.5 w-12 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-rose-400" style={{ width: `${t.soft * 100}%` }} /></div>
                <p className={cn("mt-1 text-[11px] font-semibold", l === "chin" ? "text-amber-600" : l ? "text-green-700" : "text-slate-400")}>{l ? LABEL_TEXT[l] : "?"}</p>
              </li>
            );
          })}
        </ul>
      )}
      {(stage === "label" ? trained || !next : true) && stage !== "aiornot" && stage !== "done" && (
        <div className="rounded-xl bg-white/80 p-2">
          <Scatter train={trainSet} test={stage === "test" ? TEST : undefined} trained={trained} results={tested ? resultMap : undefined} />
          {stage === "test" && tested && (
            <p className="text-center text-sm">Độ chính xác: <b className={cn("text-2xl", result.accuracy === 100 ? "text-emerald-600" : "text-red-600")}>{result.accuracy}%</b> ({result.correct}/{TEST.length} quả)</p>
          )}
        </div>
      )}
      {stage === "test" && tested && (
        <ul className="grid grid-cols-5 gap-1.5">
          {result.rows.map((r) => (
            <li key={r.id} className={cn("rounded-lg border bg-white p-1 text-center text-[10px]", r.guess === r.label ? "border-slate-200" : "border-red-400 bg-red-50")}>
              <MangoIcon color={r.color} className="mx-auto size-8" />
              <p className="font-semibold">{r.variety}</p>
              <p>AI: {LABEL_TEXT[r.guess]}</p>
              <p className="text-slate-500">Thật: {LABEL_TEXT[r.label]}</p>
            </li>
          ))}
        </ul>
      )}
      {(stage === "aiornot" || stage === "done") && q && (
        <div className="grid min-h-60 place-items-center rounded-xl bg-white/80 p-6 text-center">
          <div>
            <Sparkles className="mx-auto size-8 text-violet-600" aria-hidden />
            <p className="mt-3 text-base font-medium">“{stage === "done" ? "Em đã hiểu AI học từ dữ liệu như thế nào!" : q.text}”</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <MissionLayout scene={scene} stages={STAGES} current={stage} feedback={feedback} mistakes={mistakes}>
      {stage === "label" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 1 · Dạy camera nhận biết xoài chín</h3>
          <p className="mt-1 text-sm text-muted">Người bán dạy rằng: <b>xoài cát chín có vỏ vàng và mềm</b>. Gán nhãn đúng cho từng quả (quả đang sáng), rồi huấn luyện.</p>
          {next ? (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => label("chin")}>Chín</Button>
              <Button size="sm" variant="secondary" onClick={() => label("xanh")}>Còn xanh</Button>
            </div>
          ) : !trained ? (
            <Button size="sm" className="mt-3" onClick={() => { touchTutor(); setTrained(true); setFeedback({ ok: true, text: "Đã huấn luyện! Vùng vàng là nơi máy sẽ đoán “chín”, vùng xanh là “còn xanh”: mỗi quả mới được so với 3 quả đã học gần nhất." }); }}><Brain /> Huấn luyện mô hình</Button>
          ) : (
            <Button size="sm" className="mt-3" onClick={() => { setStage("test"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>
          )}
        </>
      )}
      {stage === "test" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 2 · Lô xoài mới về chợ</h3>
          <p className="mt-1 text-sm text-muted">Hôm nay có cả <b>xoài keo</b> — loại chín mà vỏ vẫn xanh, chỉ mềm hơn.</p>
          {!tested ? (
            <Button size="sm" className="mt-3" onClick={() => { touchTutor(); setTested(true); setFeedback({ ok: false, text: `Máy chỉ đúng ${result.accuracy}%: đoán sai mọi quả xoài keo chín.` }); }}><FlaskConical /> Cho máy phân loại lô mới</Button>
          ) : biasAns === null || (biasAns !== BIAS_ANSWER && !extra) ? (
            <>
              <p className="mt-3 text-sm font-semibold text-fg">Vì sao máy đoán sai?</p>
              <div className="mt-1.5 space-y-1.5">
                {BIAS_OPTIONS.map((o, i) => (
                  <Button key={o} size="sm" variant={biasAns === i ? "primary" : "secondary"} className="h-auto w-full justify-start whitespace-normal py-1.5 text-left" onClick={() => {
                    touchTutor(); setBiasAns(i);
                    if (i !== BIAS_ANSWER) { setMistakes((x) => x + 1); setFeedback({ ok: false, text: "Chưa đúng. Nhìn biểu đồ: các quả bị sai (viền đỏ) nằm ở vùng nào, và lúc học máy đã từng thấy quả nào ở đó chưa?" }); }
                    else setFeedback({ ok: true, text: "Đúng — đây là thiên lệch dữ liệu: máy chỉ học từ xoài cát nên nghĩ “vỏ xanh = còn xanh”. AI chỉ tốt bằng dữ liệu nó được học." });
                  }}>{o}</Button>
                ))}
              </div>
            </>
          ) : !extra ? (
            <Button size="sm" className="mt-3" onClick={() => { touchTutor(); setExtra(true); setFeedback({ ok: true, text: `Đã thêm 4 quả xoài keo chín có nhãn và huấn luyện lại. Độ chính xác: ${evaluate([...TRAIN, ...EXTRA_KEO], TEST).accuracy}%.` }); }}><Plus /><Database /> Bổ sung dữ liệu xoài keo & huấn luyện lại</Button>
          ) : (
            <Button size="sm" className="mt-3" onClick={() => { setStage("aiornot"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>
          )}
        </>
      )}
      {stage === "aiornot" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Có phải AI không? ({aiIdx + 1}/{AI_OR_NOT.length})</h3>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Button size="sm" variant={aiAns === true ? "primary" : "secondary"} disabled={aiAns !== null} onClick={() => { touchTutor(); setAiAns(true); if (!q.ai) setMistakes((x) => x + 1); setFeedback({ ok: q.ai, text: `${q.ai ? "Đúng, đây là AI" : "Không phải AI"}. ${q.why}` }); }}>Có dùng AI</Button>
            <Button size="sm" variant={aiAns === false ? "primary" : "secondary"} disabled={aiAns !== null} onClick={() => { touchTutor(); setAiAns(false); if (q.ai) setMistakes((x) => x + 1); setFeedback({ ok: !q.ai, text: `${q.ai ? "Thực ra đây là AI" : "Đúng, không phải AI"}. ${q.why}` }); }}>Không phải AI</Button>
          </div>
          {aiAns !== null && <Button size="sm" className="mt-3" onClick={() => { setAiAns(null); setFeedback(null); if (aiIdx + 1 < AI_OR_NOT.length) setAiIdx(aiIdx + 1); else setStage("done"); }}>{aiIdx + 1 < AI_OR_NOT.length ? "Tình huống tiếp →" : "Xem kết quả"}</Button>}
        </>
      )}
      {stage === "done" && (
        <MissionDone
          mistakes={mistakes}
          title="Em đã huấn luyện và sửa một mô hình AI!"
          onRestart={restart}
          points={[
            <>Học máy = học từ <b>dữ liệu có nhãn</b>; nhãn sai thì máy học sai.</>,
            <><b>Thiên lệch dữ liệu</b>: thiếu loại dữ liệu nào thì AI đoán sai loại đó — cần dữ liệu đa dạng.</>,
            <>Chương trình chạy theo luật viết sẵn (if–else, hẹn giờ) không phải AI.</>,
          ]}
        />
      )}
    </MissionLayout>
  );
}

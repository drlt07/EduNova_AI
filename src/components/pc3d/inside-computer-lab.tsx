"use client";
import { LabScore } from "@/components/sim/lab-result";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Cpu, MonitorPlay, Power, RotateCcw, Star, Stethoscope, Wrench, XCircle } from "lucide-react";
import {
  DATA_NODE_LABEL, DATA_PATH, FAULTS, PARTS, SLOT_LABEL, getPart, newBuild, nextDataStep, placePart, powerOn, stars,
  type BuildState, type DataNode, type PartId, type PostStep, type SlotId,
} from "@/lib/sim/pc-build";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

const PcScene = dynamic(() => import("./pc-scene").then((m) => m.PcScene), { ssr: false, loading: () => <Skeleton className="size-full" /> });

type Stage = "build" | "data" | "fault" | "done";
const STAGES: { id: Stage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "build", label: "Lắp máy", icon: Wrench },
  { id: "data", label: "Đường đi dữ liệu", icon: MonitorPlay },
  { id: "fault", label: "Chẩn đoán sự cố", icon: Stethoscope },
];
const ALL_SLOTS = [...new Set(PARTS.map((p) => p.slot))] as SlotId[];

interface Feedback { ok: boolean; text: string }

/**
 * Bên trong máy tính 3D (Tin 11 – Bài 4): ba nhiệm vụ nối tiếp — lắp linh kiện đúng khe và bật nguồn,
 * xếp đường đi dữ liệu khi mở một tệp ảnh, chẩn đoán sự cố từ triệu chứng. Có thể thao tác trong cảnh 3D hoặc bằng các nút.
 */
export function InsideComputerLab() {
  const [stage, setStage] = useState<Stage>("build");
  const [build, setBuild] = useState<BuildState>(newBuild);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [post, setPost] = useState<{ booted: boolean; steps: PostStep[]; screen: string } | null>(null);
  const [path, setPath] = useState<DataNode[]>([]);
  const [faultIdx, setFaultIdx] = useState(0);
  const [faultAnswered, setFaultAnswered] = useState<PartId | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const totalMistakes = build.mistakes + mistakes;
  const booted = !!post?.booted;
  const stageIdx = STAGES.findIndex((s) => s.id === stage);

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Bên trong máy tính 3D",
    summary: `Nhiệm vụ: ${STAGES.find((s) => s.id === stage)?.label ?? "Hoàn thành"}. Đã lắp: ${build.placed.map((p) => getPart(p).name).join(", ") || "chưa có"}.${stage === "data" ? ` Đường đi đã chọn: ${path.map((n) => DATA_NODE_LABEL[n]).join(" → ") || "chưa có"}.` : ""}${stage === "fault" ? ` Ca sự cố: ${FAULTS[faultIdx].symptom}` : ""}`,
    problems: [...(feedback && !feedback.ok ? [feedback.text] : []), ...(post && !post.booted ? [post.steps.at(-1)!.detail] : [])],
    facts: { stage, placed: build.placed.length, mistakes: totalMistakes, booted },
  }), { title: "Bên trong máy tính · Tin 11", topic: "general", level: "free" });

  const pickPart = (id: PartId) => {
    touchTutor();
    if (build.placed.includes(id)) return;
    setSelected((s) => (s === id ? null : id));
    setFeedback({ ok: true, text: `Đã chọn ${getPart(id).name}. Bây giờ chọn khe phát sáng nơi nó được lắp.` });
  };
  const pickSlot = (slot: SlotId) => {
    if (!selected) return;
    const r = placePart(build, selected, slot);
    setBuild(r.state);
    setFeedback({ ok: r.ok, text: r.message });
    if (r.ok) setSelected(null);
    setPost(null);
  };
  const power = () => {
    touchTutor();
    const r = powerOn(build);
    setPost(r);
    setFeedback(r.booted ? { ok: true, text: "Máy khởi động thành công! Chuyển sang nhiệm vụ tiếp theo." } : { ok: false, text: r.steps.at(-1)!.detail });
  };
  const pickNode = (n: DataNode) => {
    if (stage !== "data") return;
    touchTutor();
    const r = nextDataStep(path, n);
    if (!r.ok) {
      setMistakes((m) => m + 1);
      return setFeedback({ ok: false, text: r.message });
    }
    setPath((p) => [...p, n]);
    setFeedback({ ok: true, text: r.message + (r.done ? " Hoàn thành đường đi!" : "") });
  };
  const answerFault = (p: PartId) => {
    if (faultAnswered) return;
    touchTutor();
    const f = FAULTS[faultIdx];
    setFaultAnswered(p);
    if (p !== f.answer) setMistakes((m) => m + 1);
    setFeedback({ ok: p === f.answer, text: (p === f.answer ? "Chính xác. " : `Chưa đúng — nguyên nhân là ${getPart(f.answer).name}. `) + f.explain });
  };
  const nextFault = () => {
    setFaultAnswered(null);
    setFeedback(null);
    if (faultIdx + 1 < FAULTS.length) setFaultIdx(faultIdx + 1);
    else setStage("done");
  };
  const restart = () => {
    setStage("build"); setBuild(newBuild()); setSelected(null); setPost(null); setPath([]); setFaultIdx(0); setFaultAnswered(null); setMistakes(0); setFeedback(null);
  };

  const slotsToShow = useMemo(() => (stage === "build" && selected ? ALL_SLOTS.filter((s) => !build.placed.some((p) => getPart(p).slot === s)) : []), [stage, selected, build.placed]);
  const screen = stage === "build" ? (post ? (post.booted ? "EduNova OS ✓" : post.screen) : "") : stage === "data" && path.includes("monitor") ? "🐱 meo.png" : booted ? "EduNova OS ✓" : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="relative h-[460px] overflow-hidden rounded-2xl border border-line bg-[#e0ecff] sm:h-[560px]">
        <PcScene placed={build.placed} selected={selected} slots={slotsToShow} booted={booted} screen={screen} dataPath={path} pickingData={stage === "data"} onPickPart={pickPart} onPickSlot={pickSlot} onPickNode={pickNode} />
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs text-slate-700 shadow">Kéo để xoay · cuộn để phóng to</p>
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
          {stage === "build" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 1 · Lắp một chiếc máy tính chạy được</h3>
              <p className="mt-1 text-sm text-muted">Chọn linh kiện trên bàn (hoặc trong danh sách), rồi chọn khe phát sáng. Có thể bấm <b>Bật nguồn</b> bất cứ lúc nào để xem máy báo lỗi gì.</p>
              <ul className="mt-3 grid grid-cols-2 gap-1.5">
                {PARTS.map((p) => {
                  const placed = build.placed.includes(p.id);
                  return (
                    <li key={p.id}>
                      <button type="button" disabled={placed} aria-pressed={selected === p.id} onClick={() => pickPart(p.id)} className={cn("flex w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors", placed ? "border-success/30 bg-success/10 text-success-fg" : selected === p.id ? "border-cyan bg-cyan/15 text-cyan-fg" : "border-line text-fg hover:border-cyan/40")}>
                        {placed ? <CheckCircle2 className="size-3.5 shrink-0" aria-hidden /> : <Cpu className="size-3.5 shrink-0" aria-hidden />}
                        <span className="truncate">{p.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selected && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-muted">Lắp {getPart(selected).name} vào:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {slotsToShow.map((s) => <button key={s} type="button" onClick={() => pickSlot(s)} className="rounded-lg bg-cyan/10 px-2 py-1 text-xs font-medium text-cyan-fg hover:bg-cyan/20">{SLOT_LABEL[s]}</button>)}
                  </div>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={power}><Power /> Bật nguồn</Button>
                {booted && <Button size="sm" variant="secondary" onClick={() => { setStage("data"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
              </div>
              {post && (
                <ol className="mt-3 space-y-1 text-xs" aria-label="Kết quả kiểm tra khởi động">
                  {post.steps.map((s) => (
                    <li key={s.label} className={cn("flex gap-1.5", s.ok ? "text-success-fg" : "text-danger-fg")}>
                      {s.ok ? <CheckCircle2 className="mt-px size-3.5 shrink-0" aria-hidden /> : <XCircle className="mt-px size-3.5 shrink-0" aria-hidden />}
                      <span><b>{s.label}:</b> {s.detail}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}

          {stage === "data" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 2 · Mở ảnh <span className="font-mono">meo.png</span></h3>
              <p className="mt-1 text-sm text-muted">Tệp ảnh đang lưu trong máy. Bấm lần lượt các bộ phận theo đúng thứ tự dữ liệu đi qua cho tới khi ảnh hiện lên màn hình.</p>
              <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs font-semibold">
                {path.map((n, i) => <li key={n} className="flex items-center gap-1"><span className="rounded-lg bg-cyan/15 px-2 py-1 text-cyan-fg">{DATA_NODE_LABEL[n]}</span>{i < DATA_PATH.length - 1 && <span className="text-muted">→</span>}</li>)}
                {path.length < DATA_PATH.length && <li className="rounded-lg border border-dashed border-line px-2 py-1 text-muted">?</li>}
              </ol>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["ram", "monitor", "ssd", "gpu", "cpu"] as DataNode[]).map((n) => (
                  <button key={n} type="button" disabled={path.includes(n)} onClick={() => pickNode(n)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-fg hover:border-cyan/40 disabled:opacity-40">{DATA_NODE_LABEL[n]}</button>
                ))}
              </div>
              {path.length === DATA_PATH.length && <Button size="sm" className="mt-3" onClick={() => { setStage("fault"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
            </>
          )}

          {stage === "fault" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Kỹ thuật viên ({faultIdx + 1}/{FAULTS.length})</h3>
              <p className="mt-2 rounded-xl bg-warning/10 p-3 text-sm text-fg">“{FAULTS[faultIdx].symptom}”</p>
              <p className="mt-2 text-xs font-semibold text-muted">Linh kiện nào gây ra hiện tượng này?</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {(["ram", "cooler", "gpu", "ssd", "cpu", "psu"] as PartId[]).map((p) => {
                  const f = FAULTS[faultIdx];
                  const state = faultAnswered ? (p === f.answer ? "right" : p === faultAnswered ? "wrong" : "") : "";
                  return (
                    <button key={p} type="button" disabled={!!faultAnswered} onClick={() => answerFault(p)} className={cn("rounded-lg border px-2 py-1.5 text-left text-xs font-medium", state === "right" ? "border-success bg-success/15 text-success-fg" : state === "wrong" ? "border-danger bg-danger/10 text-danger-fg" : "border-line text-fg hover:border-cyan/40")}>
                      {getPart(p).name}
                    </button>
                  );
                })}
              </div>
              {faultAnswered && <Button size="sm" className="mt-3" onClick={nextFault}>{faultIdx + 1 < FAULTS.length ? "Ca tiếp theo →" : "Xem kết quả"}</Button>}
            </>
          )}

          {stage === "done" && (
            <div className="text-center">
              <div className="flex justify-center gap-1" aria-label={`${stars(totalMistakes)} trên 3 sao`}>
                {[1, 2, 3].map((i) => <Star key={i} className={cn("size-8", i <= stars(totalMistakes) ? "fill-warning text-warning" : "text-line")} aria-hidden />)}
              </div>
              <h3 className="mt-2 font-semibold text-fg">Hoàn thành ba nhiệm vụ!</h3>
              <p className="mt-1 text-sm text-muted">Số lần chọn sai: <b className="text-fg">{totalMistakes}</b></p>
              <LabScore mistakes={totalMistakes} />
              <ul className="mt-3 space-y-1 text-left text-xs text-fg">
                <li>• <b>RAM</b> giữ dữ liệu đang dùng, mất khi tắt điện; <b>SSD</b> lưu lâu dài.</li>
                <li>• CPU chỉ làm việc trực tiếp với dữ liệu trong RAM.</li>
                <li>• Máy kiểm tra linh kiện khi bật nguồn; mỗi linh kiện thiếu có triệu chứng riêng.</li>
              </ul>
              <Button size="sm" variant="secondary" className="mt-3" onClick={restart}><RotateCcw /> Làm lại</Button>
            </div>
          )}
        </section>

        {feedback && (
          <p role="status" className={cn("rounded-xl border px-3 py-2 text-sm", feedback.ok ? "border-success/30 bg-success/10 text-fg" : "border-danger/30 bg-danger/10 text-fg")}>
            {feedback.text}
          </p>
        )}
        <p className="text-xs text-muted">Số lần chọn sai: {totalMistakes} · Đã lắp {build.placed.length}/{PARTS.length} linh kiện</p>
      </aside>
    </div>
  );
}

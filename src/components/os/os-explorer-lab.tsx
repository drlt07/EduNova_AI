"use client";
import { LabScore } from "@/components/sim/lab-result";
import { useState } from "react";
import {
  ArrowRightLeft, CheckCircle2, ChevronRight, Circle, Cpu, FileCode2, FileImage, FileText, Folder, FolderPlus, Gauge, HardDrive, ListTree, Pencil, RotateCcw, Rocket, Star, Trash2, Undo2, X,
} from "lucide-react";
import {
  EXAM_APP, FS_GOALS, INITIAL_FS, INITIAL_PROCS, OS_FUNCTION_LABEL, OS_SCENARIOS, RAM_MB, ROOT, TRASH, children, createFolder, deleteNode, endProcess, launch, memoryUse, moveNode, nodeById, pathOf, renameNode, restoreNode, stars,
  type FsNode, type FsResult, type OsFunction, type Proc,
} from "@/lib/sim/os-sim";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Stage = "files" | "procs" | "roles" | "done";
const STAGES: { id: Stage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "files", label: "Quản lí tệp", icon: Folder },
  { id: "procs", label: "Tiến trình & bộ nhớ", icon: Gauge },
  { id: "roles", label: "HĐH làm gì?", icon: ListTree },
];

function FileIcon({ n, className }: { n: FsNode; className?: string }) {
  if (n.kind === "folder") return n.id === TRASH ? <Trash2 className={cn("text-slate-500", className)} aria-hidden /> : <Folder className={cn("fill-amber-300 text-amber-500", className)} aria-hidden />;
  if (n.name.endsWith(".py")) return <FileCode2 className={cn("text-blue-500", className)} aria-hidden />;
  if (n.name.endsWith(".jpg")) return <FileImage className={cn("text-emerald-500", className)} aria-hidden />;
  return <FileText className={cn("text-slate-500", className)} aria-hidden />;
}

/** Thư mục theo thứ tự cây (cha trước, con ngay dưới), kèm độ sâu để thụt lề. */
function folderTree(fs: FsNode[], id = ROOT, depth = 0): { n: FsNode; depth: number }[] {
  const n = nodeById(fs, id);
  if (!n) return [];
  return [{ n, depth }, ...children(fs, id).filter((c) => c.kind === "folder").flatMap((c) => folderTree(fs, c.id, depth + 1))];
}

/** Khung cửa sổ kiểu Windows cho màn hình mô phỏng. */
function Win({ title, icon: Icon, children: body, className }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xl", className)}>
      <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold">
        <Icon className="size-3.5 text-blue-600" aria-hidden /> {title}
        <span className="ml-auto flex gap-3 text-slate-400" aria-hidden><span>—</span><span>☐</span><X className="size-3.5" /></span>
      </header>
      {body}
    </section>
  );
}

/**
 * Khám phá hệ điều hành (Tin 11 – Bài 1, 2): màn hình máy tính thu nhỏ với ba nhiệm vụ —
 * sắp xếp tệp/thư mục (có Thùng rác), giải phóng RAM để chạy phần mềm thi, nhận diện chức năng của HĐH.
 */
export function OsExplorerLab() {
  const [stage, setStage] = useState<Stage>("files");
  const [fs, setFs] = useState<FsNode[]>(INITIAL_FS);
  const [cwd, setCwd] = useState("down");
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ kind: "new" | "rename" | "move"; value: string } | null>(null);
  const [procs, setProcs] = useState<Proc[]>(INITIAL_PROCS);
  const [roleIdx, setRoleIdx] = useState(0);
  const [roleAns, setRoleAns] = useState<OsFunction | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const mem = memoryUse(procs);
  const goalsDone = FS_GOALS.filter((g) => g.done(fs)).length;
  const examRunning = procs.some((p) => p.id === EXAM_APP.id);
  const stageIdx = STAGES.findIndex((s) => s.id === stage);
  const scenario = OS_SCENARIOS[roleIdx];
  const selected = sel ? nodeById(fs, sel) : undefined;
  const folders = fs.filter((n) => n.kind === "folder" && n.id !== TRASH && n.id !== sel && !n.id.startsWith("windows"));

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Khám phá hệ điều hành",
    summary: stage === "files" ? `Quản lí tệp: đang ở ${pathOf(fs, cwd)}; đạt ${goalsDone}/${FS_GOALS.length} việc. Còn: ${FS_GOALS.filter((g) => !g.done(fs)).map((g) => g.text).join("; ")}.` : stage === "procs" ? `RAM dùng ${(mem.used / 1024).toFixed(1)}/${RAM_MB / 1024} GB, ${mem.slow ? "đang dùng bộ nhớ ảo nên chậm" : "ổn định"}; tiến trình: ${procs.map((p) => p.name).join(", ")}.` : `Tình huống: ${scenario?.text ?? ""}`,
    problems: feedback && !feedback.ok ? [feedback.text] : [],
    facts: { stage, mistakes, goalsDone, ramPct: mem.pct },
  }), { title: "Khám phá hệ điều hành · Tin 11", topic: "general", level: "free" });

  const applyFs = (r: FsResult, after?: (fs: FsNode[]) => void) => {
    touchTutor();
    if (!r.ok) {
      setMistakes((m) => m + 1);
      return setFeedback({ ok: false, text: r.message });
    }
    setFs(r.fs);
    setFeedback({ ok: true, text: r.message });
    setForm(null);
    after?.(r.fs);
  };

  const submitForm = () => {
    if (!form) return;
    if (form.kind === "new") applyFs(createFolder(fs, cwd, form.value));
    else if (form.kind === "rename" && sel) applyFs(renameNode(fs, sel, form.value));
    else if (form.kind === "move" && sel) applyFs(moveNode(fs, sel, form.value), () => setSel(null));
  };

  const procAction = (r: { ok: boolean; procs: Proc[]; message: string; mistake: boolean }) => {
    touchTutor();
    if (r.mistake) setMistakes((m) => m + 1);
    setProcs(r.procs);
    setFeedback({ ok: r.ok && !r.mistake, text: r.message });
  };

  const answerRole = (f: OsFunction) => {
    if (roleAns) return;
    touchTutor();
    setRoleAns(f);
    if (f !== scenario.answer) setMistakes((m) => m + 1);
    setFeedback({ ok: f === scenario.answer, text: (f === scenario.answer ? "Đúng. " : `Chưa đúng — đó là ${OS_FUNCTION_LABEL[scenario.answer].toLowerCase()}. `) + scenario.why });
  };

  const restart = () => {
    setStage("files"); setFs(INITIAL_FS); setCwd("down"); setSel(null); setForm(null); setProcs(INITIAL_PROCS); setRoleIdx(0); setRoleAns(null); setMistakes(0); setFeedback(null);
  };

  const crumbs: FsNode[] = [];
  for (let c = nodeById(fs, cwd); c; c = c.parent ? nodeById(fs, c.parent) : undefined) crumbs.unshift(c);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Màn hình máy tính */}
      <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border-[6px] border-slate-800 bg-gradient-to-br from-[#1e3a8a] via-[#4f46e5] to-[#0891b2] shadow-xl">
        <div className="relative min-h-0 flex-1 p-3">
          {stage === "files" && (
            <Win title="File Explorer" icon={Folder} className="h-full">
              <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-1.5 text-xs">
                <HardDrive className="size-3.5 text-slate-500" aria-hidden />
                {crumbs.map((c, i) => (
                  <span key={c.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3 text-slate-400" aria-hidden />}
                    <button type="button" onClick={() => { setCwd(c.id); setSel(null); }} className="rounded px-1 hover:bg-slate-100">{c.id === ROOT ? "C:" : c.name}</button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1.5">
                {cwd === TRASH ? (
                  <button type="button" disabled={!sel} onClick={() => sel && applyFs(restoreNode(fs, sel), () => setSel(null))} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"><Undo2 className="size-3.5" /> Khôi phục</button>
                ) : (
                  <button type="button" onClick={() => setForm({ kind: "new", value: "" })} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100"><FolderPlus className="size-3.5" /> Thư mục mới</button>
                )}
                <button type="button" disabled={!sel || cwd === TRASH} onClick={() => setForm({ kind: "rename", value: selected?.name ?? "" })} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"><Pencil className="size-3.5" /> Đổi tên</button>
                <button type="button" disabled={!sel || cwd === TRASH} onClick={() => setForm({ kind: "move", value: "docs" })} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"><ArrowRightLeft className="size-3.5" /> Chuyển tới…</button>
                <button type="button" disabled={!sel} onClick={() => sel && applyFs(deleteNode(fs, sel), () => setSel(null))} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="size-3.5" /> {cwd === TRASH ? "Xóa vĩnh viễn" : "Xóa"}</button>
              </div>
              {form && (
                <form className="flex items-center gap-1.5 border-b border-slate-200 bg-blue-50 px-2 py-1.5 text-xs" onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
                  <span className="font-medium">{form.kind === "new" ? "Tên thư mục:" : form.kind === "rename" ? "Tên mới:" : "Chuyển vào:"}</span>
                  {form.kind === "move" ? (
                    <select aria-label="Thư mục đích" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1.5 py-1">
                      {folders.map((f) => <option key={f.id} value={f.id}>{pathOf(fs, f.id)}</option>)}
                    </select>
                  ) : (
                    <input aria-label={form.kind === "new" ? "Tên thư mục mới" : "Tên mới"} autoFocus value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1.5 py-1" />
                  )}
                  <button type="submit" className="rounded bg-blue-600 px-2 py-1 font-semibold text-white">OK</button>
                  <button type="button" onClick={() => setForm(null)} className="rounded px-2 py-1 hover:bg-white">Hủy</button>
                </form>
              )}
              <div className="flex min-h-0 flex-1">
                <nav aria-label="Cây thư mục" className="w-36 shrink-0 overflow-auto border-r border-slate-200 p-1.5 text-xs sm:w-44">
                  {folderTree(fs).map(({ n, depth }) => {
                    return (
                      <button key={n.id} type="button" onClick={() => { setCwd(n.id); setSel(null); }} style={{ paddingLeft: 6 + depth * 10 }} className={cn("flex w-full items-center gap-1 rounded py-1 pr-1 text-left", cwd === n.id ? "bg-blue-100 font-semibold" : "hover:bg-slate-100")}>
                        {n.id === ROOT ? <HardDrive className="size-3.5 shrink-0 text-slate-500" aria-hidden /> : <Folder className="size-3.5 shrink-0 fill-amber-300 text-amber-500" aria-hidden />}
                        <span className="truncate">{n.id === ROOT ? "Ổ C:" : n.name}</span>
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => { setCwd(TRASH); setSel(null); }} className={cn("mt-1 flex w-full items-center gap-1 rounded px-1.5 py-1 text-left", cwd === TRASH ? "bg-blue-100 font-semibold" : "hover:bg-slate-100")}>
                    <Trash2 className="size-3.5 text-slate-500" aria-hidden /> Thùng rác ({children(fs, TRASH).length})
                  </button>
                </nav>
                <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1 overflow-auto p-2" aria-label={`Nội dung ${pathOf(fs, cwd)}`}>
                  {children(fs, cwd).length === 0 && <li className="col-span-full p-4 text-center text-xs text-slate-400">Thư mục trống</li>}
                  {children(fs, cwd).map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        aria-pressed={sel === n.id}
                        onClick={() => setSel(n.id)}
                        onDoubleClick={() => { if (n.kind === "folder") { setCwd(n.id); setSel(null); } }}
                        className={cn("flex w-full flex-col items-center gap-1 rounded-lg p-2 text-center text-[11px] leading-tight", sel === n.id ? "bg-blue-100 ring-1 ring-blue-400" : "hover:bg-slate-100")}
                      >
                        <FileIcon n={n} className="size-8" />
                        <span className="break-all">{n.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="border-t border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-500">{sel ? pathOf(fs, sel) : pathOf(fs, cwd)}</p>
            </Win>
          )}

          {stage === "procs" && (
            <Win title="Task Manager" icon={Gauge} className="h-full">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-200 p-3 text-xs">
                {[{ label: "Bộ nhớ (RAM)", pct: mem.pct, text: `${(mem.used / 1024).toFixed(1)} / ${RAM_MB / 1024} GB` }, { label: "CPU", pct: mem.cpu, text: `${mem.cpu}%` }].map((b) => (
                  <div key={b.label}>
                    <p className="flex justify-between font-semibold"><span>{b.label}</span><span className={b.pct >= 100 ? "text-red-600" : ""}>{b.text}</span></p>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200"><div className={cn("h-full transition-all", b.pct >= 95 ? "bg-red-500" : b.pct > 75 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${b.pct}%` }} /></div>
                  </div>
                ))}
                {mem.slow && <p className="col-span-2 rounded-md bg-red-50 px-2 py-1 text-red-700">Thiếu RAM: hệ điều hành đang đẩy {(mem.swap / 1024).toFixed(1)} GB ra ổ đĩa (bộ nhớ ảo) → máy chạy rất chậm.</p>}
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-500"><tr><th className="px-3 py-1.5 font-medium">Tiến trình</th><th className="px-2 py-1.5 font-medium">RAM</th><th className="px-2 py-1.5 font-medium">CPU</th><th /></tr></thead>
                  <tbody>
                    {procs.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{p.name}{p.system && <span className="ml-1 rounded bg-slate-100 px-1 text-[10px] text-slate-500">hệ thống</span>}</td>
                        <td className="px-2 py-1.5 tabular-nums">{(p.ramMb / 1024).toFixed(1)} GB</td>
                        <td className="px-2 py-1.5 tabular-nums">{p.cpu}%</td>
                        <td className="px-2 py-1.5 text-right">{!p.needed && <button type="button" onClick={() => procAction(endProcess(procs, p.id))} className="rounded border border-slate-300 px-2 py-0.5 hover:bg-red-50 hover:text-red-700">Kết thúc</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Win>
          )}

          {stage === "roles" && scenario && (
            <Win title="Hệ điều hành đang làm gì?" icon={Cpu} className="mx-auto h-full max-w-xl">
              <div className="flex flex-1 flex-col justify-center gap-4 p-5">
                <p className="text-xs font-semibold text-slate-500">Tình huống {roleIdx + 1}/{OS_SCENARIOS.length}</p>
                <p className="rounded-xl bg-slate-100 p-4 text-base font-medium">“{scenario.text}”</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(OS_FUNCTION_LABEL) as OsFunction[]).map((f) => (
                    <button key={f} type="button" disabled={!!roleAns} onClick={() => answerRole(f)} className={cn("rounded-lg border px-3 py-2 text-left text-sm font-medium", roleAns && f === scenario.answer ? "border-emerald-500 bg-emerald-50 text-emerald-700" : roleAns === f ? "border-red-400 bg-red-50 text-red-700" : "border-slate-300 hover:border-blue-400")}>{OS_FUNCTION_LABEL[f]}</button>
                  ))}
                </div>
              </div>
            </Win>
          )}

          {stage === "done" && (
            <div className="grid h-full place-items-center">
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-900 shadow-2xl">
                <div className="flex justify-center gap-1" aria-label={`${stars(mistakes)} trên 3 sao`}>{[1, 2, 3].map((i) => <Star key={i} className={cn("size-9", i <= stars(mistakes) ? "fill-amber-400 text-amber-400" : "text-slate-300")} aria-hidden />)}</div>
                <p className="mt-2 font-semibold">Em đã điều khiển hệ điều hành thành thạo!</p>
              </div>
            </div>
          )}
        </div>
        {/* thanh tác vụ */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-200">
          <span className="grid size-6 place-items-center rounded bg-blue-500 font-bold text-white">⊞</span>
          {stage === "procs" && (
            <button type="button" onClick={() => procAction(launch(procs, EXAM_APP))} className={cn("flex items-center gap-1 rounded px-2 py-1", examRunning ? "bg-emerald-600 text-white" : "bg-white/10 hover:bg-white/20")}>
              <Rocket className="size-3.5" /> {examRunning ? "Phần mềm thi đang chạy" : "Mở Phần mềm thi"}
            </button>
          )}
          <span className="ml-auto flex items-center gap-1"><Gauge className="size-3.5" aria-hidden /> RAM {mem.pct}%</span>
          <span>08:15</span>
        </div>
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
          {stage === "files" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 1 · Dọn máy cho An ({goalsDone}/{FS_GOALS.length})</h3>
              <p className="mt-1 text-sm text-muted">Chọn tệp rồi dùng thanh công cụ. Bấm đúp thư mục để mở.</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {FS_GOALS.map((g) => (
                  <li key={g.id} className={cn("flex gap-2", g.done(fs) ? "text-success-fg" : "text-fg")}>
                    {g.done(fs) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />} {g.text}
                  </li>
                ))}
              </ul>
              {goalsDone === FS_GOALS.length && <Button size="sm" className="mt-3" onClick={() => { setStage("procs"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
            </>
          )}
          {stage === "procs" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 2 · Sắp đến giờ thi!</h3>
              <p className="mt-1 text-sm text-muted">Máy đang rất chậm. Hãy giải phóng RAM rồi mở <b>Phần mềm thi</b> ở thanh tác vụ. Đừng làm mất bài chưa lưu và đừng tắt tiến trình của hệ thống.</p>
              {examRunning && <Button size="sm" className="mt-3" onClick={() => { setStage("roles"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
            </>
          )}
          {stage === "roles" && (
            <>
              <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Hệ điều hành đang làm gì?</h3>
              <p className="mt-1 text-sm text-muted">Chọn chức năng của hệ điều hành trong từng tình huống.</p>
              {roleAns && <Button size="sm" className="mt-3" onClick={() => { setRoleAns(null); setFeedback(null); if (roleIdx + 1 < OS_SCENARIOS.length) setRoleIdx(roleIdx + 1); else setStage("done"); }}>{roleIdx + 1 < OS_SCENARIOS.length ? "Tình huống tiếp →" : "Xem kết quả"}</Button>}
            </>
          )}
          {stage === "done" && (
            <div>
              <h3 className="font-semibold text-fg">Hoàn thành · {stars(mistakes)}/3 sao</h3>
              <p className="mt-1 text-sm text-muted">Số lần chọn sai: <b className="text-fg">{mistakes}</b></p>
              <LabScore mistakes={mistakes} />
              <ul className="mt-2 space-y-1 text-xs text-fg">
                <li>• Hệ điều hành tổ chức tệp thành cây thư mục; mỗi tệp có một đường dẫn duy nhất.</li>
                <li>• Hệ điều hành cấp RAM, chia CPU cho các tiến trình; thiếu RAM thì dùng bộ nhớ ảo nên chậm.</li>
                <li>• Dữ liệu chưa lưu chỉ nằm trong RAM — đóng phần mềm hay mất điện là mất.</li>
              </ul>
              <Button size="sm" variant="secondary" className="mt-3" onClick={restart}><RotateCcw /> Làm lại</Button>
            </div>
          )}
        </section>
        {feedback && <p role="status" className={cn("rounded-xl border px-3 py-2 text-sm", feedback.ok ? "border-success/30 bg-success/10 text-fg" : "border-danger/30 bg-danger/10 text-fg")}>{feedback.text}</p>}
        <p className="text-xs text-muted">Số lần chọn sai: {mistakes}</p>
      </aside>
    </div>
  );
}

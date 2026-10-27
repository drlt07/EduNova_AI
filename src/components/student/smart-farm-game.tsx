"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Bot, CheckCircle2, Compass, Lightbulb, ListChecks, Lock, Play, Swords, Trophy, Variable, XCircle } from "lucide-react";
import { toast } from "sonner";
import { FARM_LEVELS, farmGlobals, type FarmCase } from "@/lib/data/games";
import { gradeFarmLevel, runFarmCase, type FarmCaseResult } from "@/lib/practice/farm-grade";
import { runPython, type RunResult } from "@/lib/py/interpreter";
import { useSessionData } from "@/lib/store/use-role";
import { studentMissions } from "@/lib/store/student";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Label } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { CodeEditor } from "@/components/labs/code-editor";
import { CodeVisualizer } from "@/components/code/visualizer";
import { Celebrate } from "@/components/motion";
import { useTutor } from "@/components/tutor/tutor-provider";
import { FarmScene, type BedState } from "./farm-scene";

type Mode = "explore" | "mission" | "assessment";

function bedsFor(c: FarmCase, run?: RunResult): BedState[] {
  if (c.beds) {
    const ev = run?.events ?? [];
    return c.beds.map((h, i) => ({ humidity: h, pump: ev[i] ? ev[i].name === "pump_on" : run ? false : null }));
  }
  const h = c.humidity ?? 50;
  const last = run?.events[run.events.length - 1];
  return [{ humidity: Math.max(0, Math.min(100, h)), error: h < 0 || h > 100, pump: run ? (last ? last.name === "pump_on" : false) : null }];
}

export function SmartFarmGame() {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const progress = d.gameProgress.find((g) => g.studentId === user.id && g.gameSlug === "smart-farm");
  const passed = progress?.passed ?? [];
  const unlocked = (id: number) => id === 1 || passed.includes(id - 1);
  const firstOpen = FARM_LEVELS.find((l) => !passed.includes(l.id))?.id ?? FARM_LEVELS.length;
  const levelId = Math.min(FARM_LEVELS.length, Math.max(1, Number(params.get("level")) || firstOpen));
  const level = FARM_LEVELS.find((l) => l.id === levelId)!;
  const [mode, setMode] = useState<Mode>("mission");

  return (
    <>
      <PageHeader title="Nông trại thông minh" description="CodeCraft World · Tin học 10 · Lập trình Python điều khiển hệ thống tưới tự động" />
      <div role="group" aria-label="Chế độ chơi" className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1">
        {([["explore", "Khám phá", Compass], ["mission", "Nhiệm vụ", Swords], ["assessment", "Đánh giá", Trophy]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", mode === id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === "explore" && <ExploreMode />}
      {mode === "assessment" && assessmentMode()}
      {mode === "mission" && (
        <>
          <nav aria-label="Các cấp độ" className="mb-5">
            <ol className="flex flex-wrap items-center gap-2">
              {FARM_LEVELS.map((l, i) => {
                const done = passed.includes(l.id);
                const open = unlocked(l.id);
                return (
                  <li key={l.id} className="flex items-center gap-2">
                    {i > 0 && <span className={cn("h-0.5 w-6 rounded sm:w-10", passed.includes(l.id - 1) ? "bg-success" : "bg-line")} aria-hidden />}
                    <button
                      type="button"
                      disabled={!open}
                      aria-current={l.id === levelId ? "step" : undefined}
                      onClick={() => router.replace(`${pathname}?level=${l.id}`, { scroll: false })}
                      className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all", l.id === levelId ? "border-cyan/60 bg-cyan/10 shadow-sm" : "border-line bg-surface", !open && "cursor-not-allowed opacity-60")}
                    >
                      <span className={cn("grid size-7 place-items-center rounded-full text-xs font-bold", done ? "bg-success text-white" : open ? "bg-cyan/20 text-cyan-fg" : "bg-surface-2 text-muted")}>
                        {done ? <CheckCircle2 className="size-4" /> : open ? l.id : <Lock className="size-3.5" />}
                      </span>
                      <span className="hidden sm:block">
                        <span className="block text-xs text-muted">Cấp {l.id}</span>
                        <span className="block font-medium text-fg">{l.title}</span>
                      </span>
                      <span className="sr-only">{done ? "đã vượt" : open ? "đang mở" : "đang khóa"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <LevelPlay key={level.id} levelId={level.id} onAskTutor={(ctx) => tutor.open({ title: `Nông trại thông minh — cấp ${level.id}`, topic: level.id >= 4 ? "loop" : "logic", ...ctx, ref: `Game:smart-farm:${level.id}` })} />
        </>
      )}
    </>
  );

  function assessmentMode() {
    const missions = studentMissions(d, user.id).filter((m) => m.labConfig?.labTemplateId === "lab-smart-garden");
    return (
      <Card>
        <CardHeader><CardTitle as="h2">Chế độ đánh giá</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">Bài đánh giá do giáo viên giao. Kết quả và quá trình làm bài được lưu làm minh chứng, khác với phần tự luyện ở chế độ Nhiệm vụ.</p>
          {missions.length === 0 ? <EmptyState title="Chưa có bài đánh giá nào" description="Khi giáo viên giao bài Nông trại thông minh, bài sẽ xuất hiện ở đây." /> : (
            <ul className="space-y-2">{missions.map((m) => <li key={m.assignment.id}><Link className="flex items-center justify-between rounded-xl border border-line p-3 hover:border-cyan/40" href={`/student/missions/${m.assignment.id}`}><span className="font-medium text-fg">{m.assignment.title}</span><Badge>{m.klass?.name}</Badge></Link></li>)}</ul>
          )}
        </CardContent>
      </Card>
    );
  }
}

function LevelPlay({ levelId, onAskTutor }: { levelId: number; onAskTutor: (ctx: { error?: { type: string; explain: string; line: number }; failing?: string[] }) => void }) {
  const { d, user } = useSessionData();
  const level = FARM_LEVELS.find((l) => l.id === levelId)!;
  const saved = d.gameProgress.find((g) => g.studentId === user.id && g.gameSlug === "smart-farm")?.codeByLevel[level.id];
  const [code, setCode] = useState(saved ?? level.starter);
  const [caseIdx, setCaseIdx] = useState(0);
  const [run, setRun] = useState<RunResult | null>(null);
  const [results, setResults] = useState<FarmCaseResult[] | null>(null);
  const [visual, setVisual] = useState(false);
  const [hint, setHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const c = level.cases[caseIdx];
  const scene = bedsFor(c, run ?? undefined);
  const passedAll = results?.every((r) => r.pass);

  function change(v: string) {
    setCode(v);
    d.saveGameCode(user.id, "smart-farm", level.id, v);
  }
  function tryCase(i: number, withVisual = false) {
    setCaseIdx(i);
    const r = runFarmCase(code, level.cases[i], true);
    setRun(r.run);
    setVisual(withVisual);
  }
  function check() {
    const g = gradeFarmLevel(code, level);
    setResults(g.results);
    const firstFail = g.results.findIndex((r) => !r.pass);
    tryCase(firstFail >= 0 ? firstFail : 0);
    const newlyPassed = d.recordGameRun(user.id, "smart-farm", level.id, code, g.score, g.results.length);
    if (g.passed) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1400);
      toast.success(newlyPassed ? (level.id < FARM_LEVELS.length ? `Vượt cấp ${level.id}! Đã mở cấp ${level.id + 1}.` : "Em đã vượt tất cả các cấp!") : "Đạt tất cả trường hợp!");
    } else toast.error(`Đạt ${g.score}/${g.results.length} trường hợp — xem bảng kết quả để sửa.`);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <Celebrate show={celebrate} />
          <CardContent className="space-y-3 pt-5">
            <Badge tone="cyan">Cấp {level.id}</Badge>
            <h2 className="text-xl font-bold text-fg">{level.title}</h2>
            <p className="text-fg">{level.story}</p>
            <p className="rounded-xl bg-success/10 p-3 text-sm font-medium text-fg">🎯 Nhiệm vụ: {level.goal}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">{level.rules.map((r) => <li key={r}>{r}</li>)}</ul>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setHint((h) => !h)} aria-expanded={hint}><Lightbulb /> {hint ? "Ẩn gợi ý" : "Xem gợi ý"}</Button>
              <Button size="sm" variant="ghost" onClick={() => onAskTutor({ error: run?.error, failing: results?.filter((r) => !r.pass).map((r) => `${r.name}: cần ${r.expected}, chương trình cho ${r.actual}`) })}><Bot /> Hỏi gia sư</Button>
            </div>
            {hint && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl bg-warning/10 p-3 text-sm text-fg">{level.hint}</motion.p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h3">Chương trình điều khiển (Python)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <CodeEditor value={code} onChange={change} height={220} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => tryCase(caseIdx)}><Play /> Chạy mô phỏng</Button>
              <Button variant="secondary" onClick={() => tryCase(caseIdx, true)}><Variable /> Chạy từng bước</Button>
              <Button variant="violet" onClick={check}><ListChecks /> Kiểm tra cấp độ ({level.cases.length})</Button>
              <Button variant="ghost" onClick={() => change(level.starter)}>Mã ban đầu</Button>
            </div>
            {run?.error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-fg"><strong className="font-mono text-danger-fg">Dòng {run.error.line}: {run.error.type}</strong> — {run.error.explain}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="overflow-hidden rounded-xl border border-line"><FarmScene beds={scene} hasWater={c.hasWater} /></div>
            <div>
              <Label htmlFor="farm-case" className="text-xs text-muted">Tình huống thử nghiệm</Label>
              <div id="farm-case" role="group" aria-label="Chọn tình huống" className="mt-1 flex flex-wrap gap-1.5">
                {level.cases.map((x, i) => {
                  const r = results?.[i];
                  return (
                    <button key={x.name} type="button" aria-pressed={i === caseIdx} onClick={() => tryCase(i)} className={cn("flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium", i === caseIdx ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted hover:text-fg")}>
                      {r && (r.pass ? <CheckCircle2 className="size-3.5 text-success-fg" aria-label="đạt" /> : <XCircle className="size-3.5 text-danger-fg" aria-label="chưa đạt" />)}
                      {x.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {run && !visual && (
              <div className="rounded-xl bg-surface-2 p-3 text-sm" aria-live="polite">
                <p className="font-medium text-fg">Máy bơm: {run.events.length ? run.events.map((e, i) => <span key={i} className={e.name === "pump_on" ? "text-success-fg" : "text-muted"}>{i ? ", " : ""}{e.name === "pump_on" ? "BẬT" : "TẮT"}</span>) : "chương trình không gọi pump_on/pump_off"}</p>
                {run.output && <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-fg">In ra: {run.output}</pre>}
              </div>
            )}
          </CardContent>
        </Card>
        {visual && run && (
          <Card>
            <CardHeader><CardTitle as="h3">Chương trình chạy từng bước — {c.name}</CardTitle></CardHeader>
            <CardContent><CodeVisualizer key={caseIdx + code} code={code} result={run} /></CardContent>
          </Card>
        )}
        {results && (
          <Card className={cn(passedAll ? "border-success/40" : "border-warning/40")}>
            <CardHeader><CardTitle as="h3" className="flex items-center gap-2">Báo cáo kết quả <Badge tone={passedAll ? "success" : "warning"}>Đạt {results.filter((r) => r.pass).length}/{results.length}</Badge></CardTitle></CardHeader>
            <CardContent className="overflow-x-auto" tabIndex={0}>
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs text-muted"><tr><th className="pb-1 font-medium">Tình huống</th><th className="pb-1 font-medium">Cần</th><th className="pb-1 font-medium">Chương trình</th><th /></tr></thead>
                <tbody>{results.map((r) => <tr key={r.name} className="border-t border-line"><td className="py-1.5 pr-2 text-fg">{r.name}</td><td className="py-1.5 pr-2 text-muted">{r.expected}</td><td className="py-1.5 pr-2 text-fg">{r.actual}</td><td>{r.pass ? <CheckCircle2 className="size-4 text-success-fg" aria-label="đạt" /> : <XCircle className="size-4 text-danger-fg" aria-label="chưa đạt" />}</td></tr>)}</tbody>
              </table>
              {passedAll && level.id < FARM_LEVELS.length && <Button asChild size="sm" className="mt-3"><Link href={`?level=${level.id + 1}`}>Sang cấp {level.id + 1}</Link></Button>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ExploreMode() {
  const [beds, setBeds] = useState([35]);
  const [water, setWater] = useState(true);
  const [code, setCode] = useState("if humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()\n");
  const [run, setRun] = useState<RunResult | null>(null);
  const multi = beds.length > 1;
  const caseData: FarmCase = multi ? { name: "tự do", beds, hasWater: water, expect: [] } : { name: "tự do", humidity: beds[0], hasWater: water, expect: false };
  function go() {
    setRun(runPython(code, { globals: farmGlobals(caseData), hooks: ["pump_on", "pump_off"], echoInput: false, maxSteps: 50_000 }));
  }
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle as="h2">Tự khám phá — không tính điểm</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="bed-count">Số luống</Label>
            {[1, 2, 3].map((n) => <Button key={n} size="sm" variant={beds.length === n ? "primary" : "secondary"} onClick={() => { setBeds(Array.from({ length: n }, (_, i) => beds[i] ?? 35 + i * 20)); setRun(null); setCode(n > 1 ? "for h in beds:\n    if h < 40 and has_water:\n        pump_on()\n    else:\n        pump_off()\n" : "if humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()\n"); }}>{n}</Button>)}
          </div>
          {beds.map((h, i) => (
            <div key={i}>
              <Label htmlFor={`bed-${i}`}>{multi ? `Độ ẩm luống ${i + 1}` : "Độ ẩm (humidity)"}: <span className="font-mono text-cyan-fg">{h}%</span></Label>
              <input id={`bed-${i}`} type="range" min={-10} max={110} value={h} onChange={(e) => { setBeds(beds.map((x, k) => (k === i ? Number(e.target.value) : x))); setRun(null); }} className="w-full accent-[var(--cyan)]" />
            </div>
          ))}
          <Checkbox label="Bình còn nước (has_water)" checked={water} onChange={(e) => { setWater(e.target.checked); setRun(null); }} />
          <CodeEditor value={code} onChange={setCode} height={180} />
          <Button onClick={go}><Play /> Chạy</Button>
          {run?.error && <p role="alert" className="text-sm text-danger-fg">Dòng {run.error.line}: {run.error.type} — {run.error.explain}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <div className="overflow-hidden rounded-xl border border-line"><FarmScene beds={bedsFor(caseData, run ?? undefined)} hasWater={water} /></div>
          {run?.output && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-sm text-fg">{run.output}</pre>}
        </CardContent>
      </Card>
    </div>
  );
}

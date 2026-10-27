"use client";
import { TutorScope } from "@/components/tutor/tutor-provider";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Code2, FolderOpen, Globe, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { CODING_EXERCISES, getExercise } from "@/lib/data/coding-exercises";
import { DIFFICULTY_LABEL } from "@/lib/data/curriculum";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { PythonWorkspace, type WorkspaceEvent } from "@/components/code/python-workspace";
import { WebCreator } from "@/components/labs/web-creator";
import { useTutor } from "@/components/tutor/tutor-provider";

const FREE = "tu-do";
const FREE_START = "# Viết chương trình Python của em ở đây\nten = input('Tên em là gì? ')\nprint('Xin chào', ten)\n";

function CodingLab() {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.get("bai") ?? CODING_EXERCISES[0].id;
  const tab = params.get("che-do") === "web" ? "web" : "python";
  const go = (q: string) => router.replace(`${pathname}?${q}`, { scroll: false });

  return (
    <>
      <PageHeader title="Phòng lập trình" description="Viết, chạy, xem từng bước, kiểm thử và sửa lỗi chương trình Python ngay trên trình duyệt." />
      <div role="group" aria-label="Loại bài" className="mb-5 inline-flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
        <button type="button" aria-pressed={tab === "python"} onClick={() => go(`bai=${id}`)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium", tab === "python" ? "bg-surface text-fg shadow-sm" : "text-muted")}><Code2 className="size-4" /> Python</button>
        <button type="button" aria-pressed={tab === "web"} onClick={() => go("che-do=web")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium", tab === "web" ? "bg-surface text-fg shadow-sm" : "text-muted")}><Globe className="size-4" /> HTML/CSS (Tin 12)</button>
      </div>
      {tab === "web" ? (
        <WebCreator onSave={(content) => d.savePortfolioVersion({ studentId: user.id, kind: "web", title: "Trang web của em", content, itemId: d.portfolio.find((p) => p.studentId === user.id && p.kind === "web")?.id })} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Bài tập lập trình" className="space-y-1">
            <button type="button" onClick={() => go(`bai=${FREE}`)} aria-current={id === FREE ? "page" : undefined} className={cn("w-full rounded-xl border px-3 py-2 text-left text-sm", id === FREE ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
              <span className="font-medium text-fg">Viết tự do</span>
              <span className="block text-xs text-muted">Không có bài kiểm thử</span>
            </button>
            {CODING_EXERCISES.map((e) => {
              const w = d.codeWorks.find((c) => c.studentId === user.id && c.exerciseId === e.id);
              const done = w?.lastRun && w.lastRun.passed === w.lastRun.total;
              return (
                <button key={e.id} type="button" onClick={() => go(`bai=${e.id}`)} aria-current={id === e.id ? "page" : undefined} className={cn("w-full rounded-xl border px-3 py-2 text-left text-sm", id === e.id ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
                  <span className="flex items-center justify-between gap-2 font-medium text-fg">{e.title}{done && <CheckCircle2 className="size-4 text-success-fg" aria-label="đã đạt" />}</span>
                  <span className="block text-xs text-muted">{e.topic} · {DIFFICULTY_LABEL[e.difficulty]}</span>
                </button>
              );
            })}
          </nav>
          <Editor key={id} exId={id} />
        </div>
      )}
    </>
  );
}

function Editor({ exId }: { exId: string }) {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  const ex = exId === FREE ? undefined : getExercise(exId);
  const work = d.codeWorks.find((c) => c.studentId === user.id && c.exerciseId === exId);
  const [code, setCode] = useState(work?.code ?? ex?.starter ?? FREE_START);
  function onEvent(e: WorkspaceEvent) {
    if (e.kind === "save") {
      d.saveCode(user.id, exId, code, `Phiên bản ${(work?.versions.length ?? 0) + 1}`);
      toast.success("Đã lưu phiên bản");
    }
    if (e.kind === "test" && e.tests) {
      const passed = e.tests.filter((t) => t.pass).length;
      d.recordCodeRun(user.id, exId, code, { passed, total: e.tests.length, errorType: e.tests.find((t) => t.error)?.error?.split(":")[0] });
      if (passed === e.tests.length) toast.success("Đạt tất cả trường hợp kiểm thử!");
    }
    if (e.kind === "run") d.saveCode(user.id, exId, code);
  }
  return (
    <TutorScope title={ex ? `Tin học ${ex.grade} – ${ex.title}` : "Phòng lập trình"} topic={ex?.topic.includes("lặp") ? "loop" : ex?.topic.includes("logic") ? "logic" : "if"} level="guided" objectiveId={ex?.objectiveIds[0]}>
    <div className="min-w-0 space-y-4">
      {ex && (
        <Card>
          <CardContent className="space-y-2 pt-5">
            <div className="flex flex-wrap gap-1.5"><Badge tone="blue">Tin {ex.grade}</Badge><Badge>{ex.topic}</Badge><Badge tone="warning">{DIFFICULTY_LABEL[ex.difficulty]}</Badge></div>
            <h2 className="text-xl font-bold text-fg">{ex.title}</h2>
            <p className="text-fg">{ex.task}</p>
            {work?.lastRun && <p className="text-sm text-muted">Lần kiểm thử gần nhất: đạt {work.lastRun.passed}/{work.lastRun.total} · {formatDate(work.lastRun.at, true)}</p>}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="pt-5">
          <PythonWorkspace
            code={code}
            onCodeChange={setCode}
            exercise={ex}
            defaultStdin={ex?.tests[0]?.stdin.join("\n") ?? "Lan"}
            onEvent={onEvent}
            onAskTutor={(ctx) => tutor.open({ title: ex ? `Bài lập trình: ${ex.title}` : "Phòng lập trình", topic: ex?.topic === "Vòng lặp" || ex?.topic === "Danh sách" ? "loop" : ex?.topic === "Biểu thức logic" ? "logic" : "if", ...ctx, ref: `Code:${exId}` })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle as="h3" className="flex items-center gap-2"><History className="size-4 text-violet-fg" /> Lịch sử phiên bản ({work?.versions.length ?? 0})</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => { d.savePortfolioVersion({ studentId: user.id, kind: "code", title: ex ? `Bài: ${ex.title}` : "Chương trình tự do", content: code, itemId: d.portfolio.find((p) => p.studentId === user.id && p.kind === "code" && p.title === (ex ? `Bài: ${ex.title}` : "Chương trình tự do"))?.id }); toast.success("Đã lưu vào hồ sơ học tập"); }}><FolderOpen /> Lưu vào hồ sơ</Button>
        </CardHeader>
        <CardContent>
          {!work?.versions.length ? <p className="text-sm text-muted">Bấm “Lưu phiên bản” để lưu lại các mốc quan trọng của bài làm.</p> : (
            <ol className="space-y-1.5">
              {[...work.versions].reverse().map((v, k) => (
                <li key={v.savedAt + k} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-fg">{v.note} <span className="text-xs text-muted">· {formatDate(v.savedAt, true)} · {v.code.split("\n").length} dòng</span></span>
                  <Button size="sm" variant="ghost" onClick={() => { setCode(v.code); toast.info("Đã khôi phục phiên bản"); }}><RotateCcw /> Khôi phục</Button>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
    </TutorScope>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CodingLab />
    </Suspense>
  );
}

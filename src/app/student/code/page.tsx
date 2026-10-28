"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { CODING_EXERCISES, getExercise } from "@/lib/data/coding-exercises";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { PythonWorkspace, type WorkspaceEvent } from "@/components/code/python-workspace";
import { ProblemWorkspace } from "@/components/code/problem-workspace";
import { WebCreator } from "@/components/labs/web-creator";
import { TutorScope, useTutor } from "@/components/tutor/tutor-provider";

const FREE = "tu-do";
const FREE_START = "# Viết chương trình Python của em ở đây\nten = input('Tên em là gì? ')\nprint('Xin chào', ten)\n";

function Playground() {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  const work = d.codeWorks.find((c) => c.studentId === user.id && c.exerciseId === FREE);
  const [code, setCode] = useState(work?.code ?? FREE_START);
  const onEvent = (e: WorkspaceEvent) => {
    if (e.kind === "save") { d.saveCode(user.id, FREE, code, `Phiên bản ${(work?.versions.length ?? 0) + 1}`); toast.success("Đã lưu phiên bản"); }
    if (e.kind === "run") d.saveCode(user.id, FREE, code);
  };
  return (
    <TutorScope title="Sân chơi Python" topic="if" level="guided">
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/student/practice"><ArrowLeft /> Danh sách bài</Link></Button>
      <PageHeader
        title="Sân chơi Python"
        description="Viết thử bất cứ chương trình nào: chạy, nhập dữ liệu, xem biến và chạy từng bước. Không chấm điểm."
        actions={<Button variant="secondary" onClick={() => { d.savePortfolioVersion({ studentId: user.id, kind: "code", title: "Chương trình tự do", content: code, itemId: d.portfolio.find((p) => p.studentId === user.id && p.kind === "code" && p.title === "Chương trình tự do")?.id }); toast.success("Đã lưu vào hồ sơ học tập"); }}><FolderOpen /> Lưu vào hồ sơ</Button>}
      />
      <div className="rounded-2xl border border-line bg-surface p-4">
        <PythonWorkspace code={code} onCodeChange={setCode} defaultStdin="Lan" onEvent={onEvent} onAskTutor={(ctx) => tutor.open({ title: "Sân chơi Python", topic: "if", ...ctx, ref: `Code:${FREE}` })} />
      </div>
    </TutorScope>
  );
}

function Problem({ id }: { id: string }) {
  const { d, user } = useSessionData();
  const ex = getExercise(id) ?? CODING_EXERCISES[0];
  const work = d.codeWorks.find((c) => c.studentId === user.id && c.exerciseId === ex.id);
  return (
    <TutorScope title={`Tin học ${ex.grade} – ${ex.title}`} topic={ex.topic.includes("lặp") || ex.topic === "Danh sách" ? "loop" : ex.topic.includes("logic") ? "logic" : "if"} level="guided" objectiveId={ex.objectiveIds[0]}>
      <ProblemWorkspace
        key={ex.id}
        ex={ex}
        work={work}
        onSave={(code, note) => d.saveCode(user.id, ex.id, code, note)}
        onSubmit={(code, rows) => {
          const passed = rows.filter((t) => t.pass).length;
          d.recordCodeRun(user.id, ex.id, code, { passed, total: rows.length, errorType: rows.find((t) => t.error)?.error?.split(":")[0] });
          if (passed === rows.length) toast.success("Đạt tất cả trường hợp kiểm thử!");
        }}
      />
    </TutorScope>
  );
}

function CodingLab() {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  if (params.get("che-do") === "web") {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/student/practice"><ArrowLeft /> Luyện tập</Link></Button>
        <PageHeader title="HTML/CSS" description="Dựng trang web và xem kết quả ngay." />
        <WebCreator onSave={(content) => d.savePortfolioVersion({ studentId: user.id, kind: "web", title: "Trang web của em", content, itemId: d.portfolio.find((p) => p.studentId === user.id && p.kind === "web")?.id })} />
      </>
    );
  }
  const id = params.get("bai") ?? CODING_EXERCISES[0].id;
  return id === FREE ? <Playground /> : <Problem id={id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CodingLab />
    </Suspense>
  );
}

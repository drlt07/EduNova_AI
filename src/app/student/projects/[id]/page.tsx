"use client";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, CheckCircle2, FileCode2, History, Save, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import type { StudentProject } from "@/lib/domain/types";
import { runPython } from "@/lib/py/interpreter";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, Progress } from "@/components/ui/feedback";
import { Label, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { Celebrate } from "@/components/motion";
import { CodeEditor } from "@/components/labs/code-editor";
import { PythonWorkspace } from "@/components/code/python-workspace";
import { buildSrcDoc } from "@/components/labs/web-creator";
import { useTutor } from "@/components/tutor/tutor-provider";

/** Trợ lý dự án theo luật: đọc trạng thái dự án và gợi ý việc tiếp theo, không viết hộ. */
function coachTips(p: StudentProject): string[] {
  const tips: string[] = [];
  const todo = p.files.reduce((n, f) => n + (f.content.match(/TODO/g)?.length ?? 0), 0);
  if (todo) tips.push(`Trong code còn ${todo} chỗ “TODO”. Hãy làm từng chỗ một và chạy thử sau mỗi lần sửa.`);
  if (p.kind === "python") {
    const main = p.files.find((f) => f.name.endsWith(".py"));
    if (main) {
      const r = runPython(main.content, { stdin: ["1", "1", "1", "1"], trace: false, echoInput: false, maxSteps: 20_000 });
      if (!r.ok && r.error) tips.push(`Chương trình đang báo lỗi ${r.error.type} ở dòng ${r.error.line}: ${r.error.explain}`);
      if (!/\bif\b/.test(main.content)) tips.push("Dự án cần ra quyết định — em đã dùng câu lệnh if chưa?");
    }
  }
  if (p.kind === "web") {
    const html = p.files.find((f) => f.name.endsWith(".html"))?.content ?? "";
    if (!/<table/i.test(html) && p.tasks.some((t) => /bảng/i.test(t.text))) tips.push("Danh sách việc có yêu cầu bảng, nhưng trang chưa có thẻ <table>.");
    if (!/<h1/i.test(html)) tips.push("Trang nên có một tiêu đề chính <h1>.");
  }
  if (p.kind === "report") {
    const txt = p.files[0]?.content ?? "";
    const empty = txt.split(/^\d+\..*$/m).slice(1).filter((part) => part.trim().length < 10).length;
    if (empty) tips.push(`Báo cáo còn khoảng ${empty} mục chưa viết nội dung.`);
  }
  const left = p.tasks.filter((t) => !t.done);
  if (left.length) tips.push(`Việc nên làm tiếp: “${left[0].text}”.`);
  if (!left.length && !p.reflection.trim()) tips.push("Mọi việc đã xong — hãy viết vài dòng về điều em học được trước khi hoàn thành.");
  if (!tips.length) tips.push("Dự án trông ổn! Em có thể đánh dấu hoàn thành và đưa vào hồ sơ học tập.");
  return tips;
}

const VIS = { private: "Chỉ mình em", teacher: "Giáo viên của em", class: "Cả lớp" } as const;

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const p = d.projects.find((x) => x.id === id && x.studentId === user.id);
  if (!p) return <ErrorState page title="Không tìm thấy dự án" description="Dự án không tồn tại hoặc không thuộc về em." action={<Button asChild variant="secondary"><Link href="/student/projects">Về Xưởng dự án</Link></Button>} />;
  return <Workspace key={p.id} p={p} />;
}

function Workspace({ p }: { p: StudentProject }) {
  const { d, user } = useSessionData();
  const router = useRouter();
  const tutor = useTutor();
  const [files, setFiles] = useState(p.files);
  const [active, setActive] = useState(0);
  const [reflection, setReflection] = useState(p.reflection);
  const [tips, setTips] = useState<string[] | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const dirty = JSON.stringify(files) !== JSON.stringify(p.files) || reflection !== p.reflection;
  const done = p.tasks.filter((t) => t.done).length;
  const setFile = (i: number, content: string) => setFiles((fs) => fs.map((f, k) => (k === i ? { ...f, content } : f)));
  const save = (note = "Lưu phiên bản") => {
    d.updateProject(p.id, { files, reflection }, note);
    toast.success("Đã lưu dự án");
  };
  const html = files.find((f) => f.name.endsWith(".html"))?.content ?? "";
  const css = files.find((f) => f.name.endsWith(".css"))?.content ?? "";
  const complete = () => {
    if (!reflection.trim()) return toast.error("Hãy viết phần “Em học được gì” trước khi hoàn thành.");
    d.updateProject(p.id, { files, reflection, status: "done" }, "Đánh dấu hoàn thành");
    const content = p.kind === "web" ? `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}` : files.map((f) => `# ${f.name}\n${f.content}`).join("\n\n") + `\n\n# Em học được\n${reflection}`;
    const existing = d.portfolio.find((x) => x.studentId === user.id && x.kind === "project" && x.title === p.title);
    d.savePortfolioVersion({ studentId: user.id, kind: p.kind === "web" ? "web" : "project", title: p.title, content, itemId: existing?.id });
    setCelebrate(true);
    toast.success("Dự án đã hoàn thành và được lưu vào hồ sơ học tập");
  };

  return (
    <>
      <Celebrate show={celebrate} />
      <PageHeader
        title={p.title}
        badge={<Badge tone={p.status === "done" ? "success" : "cyan"}>{p.status === "done" ? "Đã hoàn thành" : "Đang làm"}</Badge>}
        actions={<Button asChild variant="ghost" size="sm"><Link href="/student/projects"><ArrowLeft className="size-4" /> Xưởng dự án</Link></Button>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <div role="tablist" aria-label="Tệp của dự án" className="flex flex-wrap gap-1">
            {files.map((f, i) => (
              <button key={f.name} role="tab" type="button" aria-selected={active === i} onClick={() => setActive(i)} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm", active === i ? "border-cyan/60 bg-cyan/10 text-fg" : "border-line text-muted hover:text-fg")}>
                <FileCode2 className="size-4" aria-hidden /> {f.name}
              </button>
            ))}
          </div>
          {p.kind === "python" && files[active].name.endsWith(".py") ? (
            <PythonWorkspace code={files[active].content} onCodeChange={(c) => setFile(active, c)} defaultStdin={"32\n19"} onAskTutor={(ctx) => tutor.open({ title: p.title, topic: "if", ...ctx })} />
          ) : p.kind === "web" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <CodeEditor value={files[active].content} onChange={(v) => setFile(active, v)} height={380} />
              <div>
                <p className="mb-1 text-xs text-muted">Xem trước (không chạy JavaScript)</p>
                <iframe title="Xem trước trang web" sandbox="" srcDoc={buildSrcDoc(html, css)} className="h-[380px] w-full rounded-xl border border-line bg-white" />
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="report">Nội dung {files[active].name}</Label>
              <Textarea id="report" className="min-h-[380px] font-mono text-sm" value={files[active].content} onChange={(e) => setFile(active, e.target.value)} />
            </div>
          )}
          <Card>
            <CardHeader><CardTitle as="h2">Em học được gì?</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="reflection" className="sr-only">Em học được gì</Label>
              <Textarea id="reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Khó khăn em gặp, cách em giải quyết, điều em sẽ làm khác lần sau…" />
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save()} disabled={!dirty} data-testid="project-save"><Save className="size-4" /> Lưu</Button>
            <Button variant="secondary" onClick={complete} disabled={p.status === "done" && !dirty}><Trophy className="size-4" /> Hoàn thành & đưa vào hồ sơ</Button>
            <Button variant="ghost" onClick={() => { if (window.confirm("Xóa dự án này? Không thể hoàn tác.")) { d.deleteProject(p.id); router.push("/student/projects"); } }}><Trash2 className="size-4" /> Xóa</Button>
            {dirty && <span className="self-center text-xs text-warning-fg">Có thay đổi chưa lưu</span>}
          </div>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle as="h2">Việc cần làm</CardTitle></CardHeader>
            <CardContent>
              <Progress value={p.tasks.length ? (done / p.tasks.length) * 100 : 0} label={`${done}/${p.tasks.length} việc`} />
              <ul className="mt-3 space-y-1.5">
                {p.tasks.map((t, i) => (
                  <li key={t.text}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-fg">
                      <input type="checkbox" className="mt-0.5 accent-[var(--cyan)]" checked={t.done} onChange={() => d.updateProject(p.id, { tasks: p.tasks.map((x, k) => (k === i ? { ...x, done: !x.done } : x)) }, `${t.done ? "Bỏ đánh dấu" : "Xong"}: ${t.text}`)} />
                      <span className={cn(t.done && "text-muted line-through")}>{t.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><Bot className="size-4 text-violet-fg" /> Trợ lý dự án</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted">Gợi ý theo luật, dựa trên code và danh sách việc của em. Không viết hộ.</p>
              <Button size="sm" variant="secondary" onClick={() => setTips(coachTips({ ...p, files, reflection }))} data-testid="project-coach">Xem gợi ý</Button>
              {tips && <ul className="list-disc space-y-1 pl-5 text-sm text-fg" aria-live="polite">{tips.map((t) => <li key={t}>{t}</li>)}</ul>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2">Chia sẻ</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="vis">Ai được xem dự án</Label>
              <Select id="vis" value={p.visibility} onChange={(e) => d.updateProject(p.id, { visibility: e.target.value as StudentProject["visibility"] }, `Đổi quyền xem: ${VIS[e.target.value as keyof typeof VIS]}`)}>
                {Object.entries(VIS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <p className="mt-1 text-xs text-muted">Mặc định chỉ mình em. Không công khai ra ngoài lớp.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><History className="size-4" /> Nhật ký</CardTitle></CardHeader>
            <CardContent>
              <ol tabIndex={0} className="max-h-60 space-y-1.5 overflow-y-auto text-sm">
                {[...p.log].reverse().map((l, i) => (
                  <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cyan-fg" aria-hidden /><span className="text-fg">{l.note}</span><span className="ml-auto shrink-0 text-xs text-muted">{formatDate(l.at, true)}</span></li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

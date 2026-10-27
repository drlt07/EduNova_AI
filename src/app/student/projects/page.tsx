"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { PROJECT_TEMPLATES } from "@/lib/data/project-templates";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { Stagger, StaggerItem } from "@/components/motion";

const KIND = { python: "Python", web: "Web", report: "Báo cáo" } as const;
const VIS = { private: "Chỉ mình em", teacher: "Giáo viên", class: "Cả lớp" } as const;

export default function ProjectsPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const mine = d.projects.filter((p) => p.studentId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const start = (tid: string) => {
    const t = PROJECT_TEMPLATES.find((x) => x.id === tid)!;
    const id = d.createProject({ studentId: user.id, templateId: t.id, title: t.title, kind: t.kind, files: t.files.map((f) => ({ ...f })), tasks: t.tasks.map((text) => ({ text, done: false })), visibility: "private", status: "doing", reflection: "" });
    toast.success("Đã tạo dự án");
    router.push(`/student/projects/${id}`);
  };
  return (
    <>
      <PageHeader title="Xưởng dự án" description="Làm sản phẩm hoàn chỉnh từ mẫu: viết code, xem trước, chia việc, ghi nhật ký và đưa vào hồ sơ học tập." />
      <Card className="mb-6">
        <CardHeader><CardTitle as="h2">Dự án của em</CardTitle></CardHeader>
        <CardContent>
          {mine.length === 0 ? <EmptyState icon={FolderKanban} title="Em chưa có dự án nào" description="Chọn một mẫu bên dưới để bắt đầu." /> : (
            <Stagger as="ul" className="grid gap-3 md:grid-cols-2">
              {mine.map((p) => {
                const done = p.tasks.filter((t) => t.done).length;
                return (
                  <StaggerItem as="li" key={p.id}>
                    <Link href={`/student/projects/${p.id}`} className="block rounded-xl border border-line p-4 transition-colors hover:border-cyan/40">
                      <div className="flex flex-wrap gap-1.5"><Badge tone={p.status === "done" ? "success" : "cyan"}>{p.status === "done" ? "Đã hoàn thành" : "Đang làm"}</Badge><Badge>{KIND[p.kind]}</Badge><Badge>{VIS[p.visibility]}</Badge></div>
                      <p className="mt-2 font-semibold text-fg">{p.title}</p>
                      <Progress value={p.tasks.length ? (done / p.tasks.length) * 100 : 0} label={`${done}/${p.tasks.length} việc`} className="mt-2" />
                      <p className="mt-1 text-xs text-muted">{done}/{p.tasks.length} việc · cập nhật {formatDate(p.updatedAt, true)}</p>
                    </Link>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </CardContent>
      </Card>
      <h2 className="mb-3 text-lg font-semibold text-fg">Mẫu dự án</h2>
      <Stagger as="ul" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROJECT_TEMPLATES.map((t) => (
          <StaggerItem as="li" key={t.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap gap-1.5"><Badge tone="blue">Lớp {t.grade}</Badge><Badge>{KIND[t.kind]}</Badge>{t.status === "planned" && <Badge tone="warning">Sắp có</Badge>}</div>
            <p className="mt-2 font-semibold text-fg">{t.title}</p>
            <p className="text-sm text-muted">{t.summary}</p>
            {t.tasks.length > 0 && <p className="mt-2 text-xs text-muted">{t.tasks.length} việc cần làm</p>}
            <div className="mt-auto pt-4">
              <Button size="sm" disabled={t.status === "planned"} onClick={() => start(t.id)} data-testid={`project-start-${t.id}`}><Plus className="size-4" /> Bắt đầu dự án</Button>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
      <p className="mt-6 flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted"><Users className="size-4 shrink-0" aria-hidden /> Làm dự án theo nhóm (chia việc, bình luận chéo) sẽ có khi hệ thống có máy chủ dữ liệu dùng chung. Hiện dự án chỉ lưu trên trình duyệt của em.</p>
    </>
  );
}

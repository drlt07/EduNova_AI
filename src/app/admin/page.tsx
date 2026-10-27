"use client";
import { useMemo, useState } from "react";
import { BadgeCheck, ScrollText, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { LESSONS, getTextbook } from "@/lib/data/curriculum";
import { LAB_TEMPLATES } from "@/lib/data/labs";
const AGENT_NAME: Record<string, string> = { "curriculum-analyst": "Đối chiếu chương trình", "lesson-planner": "Rà soát KHBD", "activity-designer": "Gợi ý nội dung", "learning-mentor": "Trợ lý học tập", "learning-tutor": "Gia sư Tin học", "learning-analyst": "Phân tích & đề xuất" };
const ACTION_NAME: Record<string, string> = { create: "tạo", update: "sửa", delete: "xóa", publish: "giao bài", grade: "chấm", submit: "nộp", version: "lưu bản", restore: "khôi phục", verify: "duyệt" };
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Avatar, PageHeader, StatCard } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_LABEL } from "@/components/layout/nav-config";

export default function AdminPage() {
  const { d, user } = useSessionData();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [lq, setLq] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  const users = useMemo(() => d.users.filter((u) => (!role || u.role === role) && matchesQuery(q, u.name, u.email)), [d.users, q, role]);
  const lessons = LESSONS.filter((l) => matchesQuery(lq, l.title, l.id));

  return (
    <>
      <PageHeader title="Quản trị" description="Tài khoản, phòng thí nghiệm, duyệt nội dung chương trình và nhật ký hoạt động." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Người dùng" value={d.users.length} hint={`${d.users.filter((u) => u.role === "student").length} học sinh`} icon={ShieldCheck} />
        <StatCard label="Phòng thí nghiệm dùng được" value={`${LAB_TEMPLATES.filter((l) => l.featureStatus !== "PLANNED").length}/${LAB_TEMPLATES.length}`} icon={BadgeCheck} tone="success" />
        <StatCard label="Bài đã duyệt" value={`${d.verifications.length}/${LESSONS.length}`} icon={BadgeCheck} tone="violet" />
        <StatCard label="Lượt dùng trợ lý" value={d.aiInteractions.length} icon={ScrollText} tone="blue" />
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Tài khoản</TabsTrigger>
          <TabsTrigger value="labs">Phòng thí nghiệm</TabsTrigger>
          <TabsTrigger value="curriculum">Duyệt chương trình</TabsTrigger>
          <TabsTrigger value="ai">Trợ lý AI</TabsTrigger>
          <TabsTrigger value="audit">Nhật ký hoạt động</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_200px]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><Input aria-label="Tìm người dùng" type="search" placeholder="Tìm tên/email" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Select aria-label="Vai trò" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Mọi vai trò</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
          </div>
          <Card><CardContent tabIndex={0} className="overflow-x-auto pt-4">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted"><tr><th className="pb-2 font-medium">Người dùng</th><th className="pb-2 font-medium">Vai trò</th><th className="pb-2 font-medium">Lớp</th><th className="pb-2 font-medium">Email</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="py-2"><span className="flex items-center gap-2"><Avatar user={u} size={26} /><span className="text-fg">{u.name}</span></span></td>
                    <td className="py-2"><Badge tone={u.role === "teacher" ? "blue" : u.role === "admin" ? "violet" : "neutral"}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="py-2 text-muted">{u.role === "teacher" ? d.classes.filter((c) => c.teacherId === u.id).map((c) => c.name).join(", ") : d.enrollments.filter((e) => e.studentId === u.id).map((e) => d.classes.find((c) => c.id === e.classId)?.name).join(", ") || "—"}</td>
                    <td className="py-2 font-mono text-xs text-muted">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted">Tạo và khóa tài khoản sẽ có ở phiên bản chính thức.</p>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="labs">
          <Card><CardContent tabIndex={0} className="overflow-x-auto pt-4">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted"><tr><th className="pb-2 font-medium">Phòng thí nghiệm</th><th className="pb-2 font-medium">Lớp</th><th className="pb-2 font-medium">Trạng thái</th></tr></thead>
              <tbody>
                {LAB_TEMPLATES.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="py-2 text-fg">{l.title}</td>
                    <td className="py-2 text-muted">{l.grades.join(", ")}</td>
                    <td className="py-2">{l.featureStatus === "PLANNED" ? <StatusBadge status="PLANNED" /> : <Badge tone="success">Dùng được</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="curriculum">
          <Notice tone="info" className="mb-3">Xác nhận sau khi đã đối chiếu bài học và yêu cầu cần đạt với sách giáo khoa.</Notice>
          <Input aria-label="Tìm bài học" type="search" placeholder="Tìm bài học…" className="mb-3" value={lq} onChange={(e) => setLq(e.target.value)} />
          <ul className="space-y-2">
            {lessons.map((l) => {
              const v = d.verifications.find((x) => x.lessonId === l.id);
              return (
                <li key={l.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg">Tin {l.grade} · {l.title}</p>
                    <p className="text-xs text-muted">{getTextbook(l.textbookId).short} · {l.objectiveIds.join(", ")}{v && ` · duyệt ${formatDate(v.verifiedAt)}: ${v.note || "—"}`}</p>
                  </div>
                  {v ? (
                    <div className="flex items-center gap-2"><Badge tone="success">Đã duyệt</Badge><Button size="sm" variant="ghost" onClick={() => d.unverifyLesson(l.id)}>Hủy</Button></div>
                  ) : (
                    <div className="flex gap-2">
                      <Input aria-label={`Ghi chú duyệt ${l.title}`} placeholder="Nguồn đối chiếu (trang sách…)" className="h-8 w-56 text-xs" value={note[l.id] ?? ""} onChange={(e) => setNote({ ...note, [l.id]: e.target.value })} />
                      <Button size="sm" variant="secondary" onClick={() => { if (!(note[l.id] ?? "").trim()) return toast.error("Ghi nguồn đối chiếu trước khi xác nhận"); d.verifyLesson(l.id, user.id, note[l.id]); toast.success("Đã duyệt"); }}>Xác nhận</Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </TabsContent>
        <TabsContent value="ai">
          <div>
            <Card>
              <CardHeader><CardTitle as="h2">Lượt dùng gần đây</CardTitle></CardHeader>
              <CardContent>
                {d.aiInteractions.length === 0 ? <EmptyState title="Chưa có tương tác" /> : (
                  <ul className="space-y-2">
                    {d.aiInteractions.slice(0, 40).map((i) => (
                      <li key={i.id} className="rounded-xl border border-line p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-1.5"><Badge tone="violet">{AGENT_NAME[i.agent]}</Badge>{i.flags.length > 0 && <Badge tone="danger">có nội dung bất thường</Badge>}{i.reviewed && <Badge tone={i.reviewed === "approved" ? "success" : "neutral"}>{i.reviewed === "approved" ? "đã duyệt" : "bỏ qua"}</Badge>}<span className="ml-auto text-xs text-muted">{formatDate(i.createdAt, true)}</span></div>
                        <p className="mt-1 text-fg">{i.inputSummary}</p>
                        <p className="text-xs text-muted">{d.users.find((u) => u.id === i.userId)?.name}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <Card><CardContent className="pt-4">
            {d.auditLog.length === 0 ? <EmptyState title="Chưa có sự kiện" /> : (
              <ol className="space-y-2">
                {d.auditLog.slice(0, 60).map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 border-b border-line pb-2 text-sm sm:flex-row sm:items-center sm:gap-3">
                    <Badge className="w-fit">{ACTION_NAME[a.action] ?? a.action}</Badge>
                    <span className="flex-1 text-fg">{a.summary}</span>
                    <span className="text-xs text-muted">{d.users.find((u) => u.id === a.actorId)?.name} · {formatDate(a.at, true)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

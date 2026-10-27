"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, FlaskConical, Hourglass, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import type { KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import type { PhanTichGiaoAn, ThongTinBai } from "@khbd/lib/pipeline/kieu";
import type { NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { hoatDongDeGanHocLieu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import type { HocLieuGan } from "@khbd/lib/pipeline/6-xuat-file/hoc-lieu";
import type { Lesson } from "@/lib/domain/types";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { applyActivity, simToResource, suggestSimulations } from "@/lib/khbd/bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

export interface SimLinkerProps {
  lesson?: Lesson;
  phanTich: PhanTichGiaoAn;
  thongTin: ThongTinBai;
  luaChon: LuaChon;
  keHoach: KeHoach;
  noiDung: NoiDungSoan;
  value: HocLieuGan[];
  onChange: (v: HocLieuGan[]) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Bước 4 của GV: chọn học liệu và mô phỏng, gắn vào từng hoạt động của bản soạn. */
export function SimLinker({ lesson, phanTich, thongTin, luaChon, keHoach, noiDung, value, onChange, onBack, onNext }: SimLinkerProps) {
  const activities = useMemo(
    () => hoatDongDeGanHocLieu(phanTich, thongTin, luaChon, keHoach, noiDung).map((a) => ({ ...a, loai: phanTich.hoatDong.find((h) => h.ma === a.hd)?.loai })),
    [phanTich, thongTin, luaChon, keHoach, noiDung],
  );
  const suggestions = useMemo(() => suggestSimulations(lesson, activities), [lesson, activities]);
  const [draft, setDraft] = useState<Record<string, { hd: string; task: string }>>({});
  const nameOf = (hd: string) => activities.find((a) => a.hd === hd)?.ten ?? hd;
  const added = (ten: string, hd: string) => value.some((v) => v.ten === ten && v.hd === hd);

  const [other, setOther] = useState({ kind: "mo_phong" as HocLieuGan["loai"], labSlug: "", name: "", link: "", hd: applyActivity(activities) ?? "", task: "" });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2"><Sparkles className="size-4 text-cyan-fg" aria-hidden /> Mô phỏng đề xuất cho bài</CardTitle>
          <CardDescription>Dựa trên yêu cầu cần đạt của bài và hoạt động trong bản soạn. Thầy/cô chọn hoạt động, sửa mô tả nhiệm vụ rồi thêm vào KHBD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length === 0 && <EmptyState icon={FlaskConical} title="Chưa có mô phỏng khớp với bài này" description="Thầy/cô vẫn có thể thêm mô phỏng hoặc học liệu khác ở bên dưới." />}
          {suggestions.map((s) => {
            const d = draft[s.lab.slug] ?? { hd: s.hd ?? activities[0]?.hd ?? "", task: s.task };
            const res = simToResource({ lab: s.lab, task: d.task }, d.hd);
            const planned = s.lab.status === "planned";
            const isAdded = added(res.ten, d.hd);
            return (
              <div key={s.lab.slug} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <FlaskConical className="size-4 text-cyan-fg" aria-hidden />
                  <p className="font-semibold text-fg">{s.lab.title}</p>
                  {planned ? <Badge tone="violet"><Hourglass className="size-3" aria-hidden /> Đang phát triển</Badge> : <Badge tone="success">Dùng được</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">{s.reason}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
                  <Field label="Gắn vào hoạt động" htmlFor={`sl-hd-${s.lab.slug}`}>
                    <Select id={`sl-hd-${s.lab.slug}`} value={d.hd} onChange={(e) => setDraft({ ...draft, [s.lab.slug]: { ...d, hd: e.target.value } })}>
                      {activities.map((a) => <option key={a.hd} value={a.hd}>{a.ten}</option>)}
                    </Select>
                  </Field>
                  <Field label="Nhiệm vụ cho học sinh" htmlFor={`sl-task-${s.lab.slug}`}>
                    <Textarea id={`sl-task-${s.lab.slug}`} rows={2} value={d.task} onChange={(e) => setDraft({ ...draft, [s.lab.slug]: { ...d, task: e.target.value } })} />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  {isAdded ? <Badge tone="success"><CheckCircle2 className="size-3" aria-hidden /> Đã thêm vào {nameOf(d.hd)}</Badge> : (
                    <Button size="sm" disabled={planned || !d.hd} title={planned ? "Mô phỏng chưa chơi được" : undefined} onClick={() => { onChange([...value, res]); toast.success(`Đã thêm vào ${nameOf(d.hd)}`); }}>
                      <Plus className="size-3.5" /> Thêm vào kế hoạch bài dạy
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Thêm mô phỏng hoặc học liệu khác</CardTitle>
          <CardDescription>Mô phỏng trong kho EduNova, hoặc học liệu số khác (video, phiếu, trang web) kèm đường dẫn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const lab = LAB_TEMPLATES.find((l) => l.slug === other.labSlug);
              const ten = other.kind === "mo_phong" ? (lab ? `Mô phỏng "${lab.title}" trên EduNova` : "") : other.name.trim();
              if (!ten || !other.hd) return toast.error(other.kind === "mo_phong" ? "Chọn mô phỏng và hoạt động" : "Nhập tên học liệu và chọn hoạt động");
              onChange([...value, { hd: other.hd, loai: other.kind, ten, nhiemVu: other.task.trim(), ...(other.kind === "hoc_lieu" && other.link.trim() ? { duongDan: other.link.trim() } : {}) }]);
              setOther({ ...other, name: "", link: "", task: "", labSlug: "" });
              toast.success("Đã thêm vào kế hoạch bài dạy");
            }}
          >
            <Field label="Loại" htmlFor="so-kind">
              <Select id="so-kind" value={other.kind} onChange={(e) => setOther({ ...other, kind: e.target.value as HocLieuGan["loai"] })}>
                <option value="mo_phong">Mô phỏng EduNova</option>
                <option value="hoc_lieu">Học liệu số khác</option>
              </Select>
            </Field>
            <Field label="Gắn vào hoạt động" htmlFor="so-hd">
              <Select id="so-hd" value={other.hd} onChange={(e) => setOther({ ...other, hd: e.target.value })}>
                {activities.map((a) => <option key={a.hd} value={a.hd}>{a.ten}</option>)}
              </Select>
            </Field>
            {other.kind === "mo_phong" ? (
              <Field label="Mô phỏng" htmlFor="so-lab" className="md:col-span-2">
                <Select id="so-lab" value={other.labSlug} onChange={(e) => setOther({ ...other, labSlug: e.target.value, task: other.task || (LAB_TEMPLATES.find((l) => l.slug === e.target.value)?.sampleTasks[0] ?? "") })}>
                  <option value="">— Chọn mô phỏng —</option>
                  {LAB_TEMPLATES.filter((l) => l.status !== "planned").map((l) => <option key={l.slug} value={l.slug}>{l.title} · Tin {l.grades.join(", ")}</option>)}
                </Select>
              </Field>
            ) : (
              <>
                <Field label="Tên học liệu" htmlFor="so-name"><Input id="so-name" value={other.name} onChange={(e) => setOther({ ...other, name: e.target.value })} placeholder="Video: Câu lệnh if trong Python" /></Field>
                <Field label="Đường dẫn (không bắt buộc)" htmlFor="so-link"><Input id="so-link" type="url" value={other.link} onChange={(e) => setOther({ ...other, link: e.target.value })} placeholder="https://…" /></Field>
              </>
            )}
            <Field label="Nhiệm vụ cho học sinh" htmlFor="so-task" className="md:col-span-2"><Textarea id="so-task" rows={2} value={other.task} onChange={(e) => setOther({ ...other, task: e.target.value })} /></Field>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" variant="secondary"><Plus className="size-3.5" /> Thêm</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2"><Link2 className="size-4 text-cyan-fg" aria-hidden /> Đã gắn vào KHBD ({value.length})</CardTitle>
          <CardDescription>Mỗi mục được chèn vào cuối hoạt động đã chọn và ghi ở mục Thiết bị dạy học, đánh dấu là phần bổ sung.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {value.length === 0 && <p className="text-sm text-muted">Chưa gắn học liệu nào. Có thể bỏ qua bước này.</p>}
          {activities.filter((a) => value.some((v) => v.hd === a.hd)).map((a) => (
            <div key={a.hd}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{a.ten}</p>
              <ul className="space-y-2">
                {value.map((v, i) => v.hd !== a.hd ? null : (
                  <li key={`${v.ten}-${i}`} className="rounded-xl border border-line p-3">
                    <div className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 text-sm font-medium text-fg">{v.loai === "mo_phong" ? "Mô phỏng: " : "Học liệu số: "}{v.ten}{v.duongDan && <span className="text-muted"> ({v.duongDan})</span>}</span>
                      <Button size="icon" variant="ghost" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label={`Bỏ ${v.ten}`}><Trash2 /></Button>
                    </div>
                    <Textarea aria-label={`Nhiệm vụ của ${v.ten}`} rows={2} className="mt-2" value={v.nhiemVu} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, nhiemVu: e.target.value } : x)))} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext}>{value.length ? "Tiếp tục" : "Bỏ qua và tiếp tục"}</Button>
      </div>
    </div>
  );
}

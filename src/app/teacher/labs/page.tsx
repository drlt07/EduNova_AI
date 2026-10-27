"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { History, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import type { LabConfiguration } from "@/lib/domain/types";
import { DEFAULT_GARDEN_PARAMS, gardenTestCases } from "@/lib/sim/smart-garden";
import { labConfigSchema, type LabConfigForm } from "@/lib/validation/schemas";
import { useApp } from "@/lib/store/app-store";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { LabIcon } from "@/components/labs/lab-card";
import { LabPreview } from "@/components/labs/lab-preview";
import { MODE_LABEL } from "@/lib/labels";
import { SmartGardenLab } from "@/components/labs/smart-garden/smart-garden-lab";

const EMPTY: LabConfigForm = { title: "Vườn tưới — thiết lập mới", visibility: "private", mode: "explore", hintMode: "guided", params: { ...DEFAULT_GARDEN_PARAMS }, testCaseIds: gardenTestCases(40).map((c) => c.id) };

export default function LabStudioPage() {
  const { d, user } = useSessionData();
  const [selected, setSelected] = useState("lab-smart-garden");
  const [loaded, setLoaded] = useState<LabConfiguration | null>(null);
  const lab = LAB_TEMPLATES.find((l) => l.id === selected)!;
  const configs = d.labConfigs.filter((c) => c.ownerId === user.id && c.labTemplateId === selected);

  return (
    <>
      <PageHeader title="Phòng thí nghiệm ảo" description="Thiết lập sẵn ngưỡng, mức độ và các trường hợp kiểm tra để dùng lại khi giao bài." />
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <nav aria-label="Danh sách phòng thí nghiệm" className="space-y-2">
          {LAB_TEMPLATES.map((l) => (
            <button key={l.id} type="button" onClick={() => { setSelected(l.id); setLoaded(null); }} aria-pressed={selected === l.id} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors", selected === l.id ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
              <LabIcon slug={l.slug} className="size-5 shrink-0 text-cyan-fg" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{l.title}</span>
              <StatusBadge status={l.featureStatus} className="px-1.5 text-[10px]" />
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {selected === "lab-smart-garden" ? (
            <GardenStudio key={loaded?.id ?? "new"} initial={loaded} configs={configs} onLoad={setLoaded} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle as="h2" className="flex items-center gap-2">{lab.title} <StatusBadge status={lab.featureStatus} /></CardTitle>
                <CardDescription>{lab.featureStatus === "PLANNED" ? "Phòng thí nghiệm đang được xây dựng." : "Phòng thí nghiệm này chưa có phần thiết lập để giao bài; học sinh có thể tự khám phá."}</CardDescription>
              </CardHeader>
              <CardContent><LabPreview slug={lab.slug} /></CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function GardenStudio({ initial, configs, onLoad }: { initial: LabConfiguration | null; configs: LabConfiguration[]; onLoad: (c: LabConfiguration | null) => void }) {
  const { d, user } = useSessionData();
  const { register, control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<LabConfigForm>({
    resolver: zodResolver(labConfigSchema),
    defaultValues: initial ? { title: initial.title, visibility: initial.visibility, mode: initial.mode, hintMode: initial.hintMode, params: initial.params, testCaseIds: initial.testCaseIds } : EMPTY,
  });
  const v = useWatch({ control }) as LabConfigForm;
  const threshold = Math.min(90, Math.max(10, Math.round(Number(v.params?.threshold) || 40))); // xem trước luôn dùng giá trị hợp lệ
  const cases = useMemo(() => gardenTestCases(threshold), [threshold]);

  const save = handleSubmit((x) => {
    const id = d.saveLabConfig({ ...x, ownerId: user.id, labTemplateId: "lab-smart-garden", parentId: initial ? (initial.parentId ?? initial.id) : undefined });
    toast.success("Đã lưu thiết lập");
    const created = useApp.getState().labConfigs.find((c) => c.id === id) ?? null;
    onLoad(created);
  }, (e) => toast.error(Object.values(e)[0]?.message?.toString() ?? "Cấu hình chưa hợp lệ"));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <div><CardTitle as="h2">Thiết lập Vườn tưới thông minh {initial && <Badge tone="violet" className="ml-1">bản {initial.version}</Badge>}</CardTitle><CardDescription>{initial ? "Lưu sẽ tạo bản mới, không ghi đè bản cũ." : "Thiết lập mới."}</CardDescription></div>
            <div className="flex gap-2">
              {initial && <Button variant="ghost" size="sm" onClick={() => onLoad(null)}>Thiết lập mới</Button>}
              <Button size="sm" onClick={save}><Save /> Lưu</Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Tên thiết lập" htmlFor="ls-title" error={errors.title?.message} className="md:col-span-2"><Input id="ls-title" {...register("title")} /></Field>
            <Field label="Chia sẻ" htmlFor="ls-vis"><Select id="ls-vis" {...register("visibility")}><option value="private">Riêng tư</option><option value="class">Lớp</option><option value="school">Trường</option><option value="public">Công khai</option></Select></Field>
            <Field label="Chế độ" htmlFor="ls-mode"><Select id="ls-mode" {...register("mode")}><option value="explore">Khám phá</option><option value="challenge">Thử thách</option><option value="assessment">Kiểm tra</option></Select></Field>
            <Field label="Gợi ý" htmlFor="ls-hint" error={errors.hintMode?.message}><Select id="ls-hint" {...register("hintMode")}><option value="off">Không gợi ý</option><option value="guided">Gợi ý từng bước</option><option value="full">Gợi ý chi tiết</option></Select></Field>
            <Field label="Ngưỡng (%)" htmlFor="ls-th" error={errors.params?.threshold?.message}><Input id="ls-th" type="number" {...register("params.threshold", { valueAsNumber: true })} /></Field>
            <Field label="Độ ẩm ban đầu (%)" htmlFor="ls-ih" error={errors.params?.initialHumidity?.message}><Input id="ls-ih" type="number" {...register("params.initialHumidity", { valueAsNumber: true })} /></Field>
            <div className="space-y-2 md:col-span-2 md:pt-6">
              <Checkbox label="Bắt buộc kiểm tra bình nước" {...register("params.requireWater")} />
              <Checkbox label="Bình còn nước lúc đầu" {...register("params.initialHasWater")} />
              <Checkbox label="Cho phép tự gõ điều kiện" {...register("params.allowRuleEditor")} />
            </div>
            <fieldset className="md:col-span-2 xl:col-span-3">
              <legend className="text-sm font-medium text-fg">Các trường hợp kiểm tra</legend>
              {errors.testCaseIds && <p className="text-xs font-medium text-danger-fg" role="alert">{errors.testCaseIds.message}</p>}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {cases.map((c) => (
                  <Checkbox key={c.id} checked={v.testCaseIds?.includes(c.id) ?? false} onChange={(e) => { const cur = getValues("testCaseIds"); setValue("testCaseIds", e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id)); }} label={<>{c.name} <span className="text-xs text-muted">→ {c.expected.pump ? "bật" : "tắt"}</span></>} />
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><History className="size-4 text-violet-fg" /> Đã lưu ({configs.length})</CardTitle></CardHeader>
          <CardContent>
            {configs.length === 0 ? <EmptyState title="Chưa có thiết lập nào" /> : (
              <ul className="space-y-2">
                {configs.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onLoad(c)} aria-pressed={initial?.id === c.id} className={cn("w-full rounded-xl border p-3 text-left text-sm", initial?.id === c.id ? "border-cyan/60 bg-cyan/10" : "border-line hover:border-cyan/30")}>
                      <span className="flex items-center justify-between gap-2"><span className="truncate font-medium text-fg">{c.title}</span><Badge tone="violet">bản {c.version}</Badge></span>
                      <span className="mt-1 block text-xs text-muted">{MODE_LABEL[c.mode]} · ngưỡng {c.params.threshold}% · {formatDate(c.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link href="/teacher/activity-builder"><Wand2 /> Giao bài với thiết lập này</Link></Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle as="h2">Học sinh sẽ thấy</CardTitle></CardHeader>
        <CardContent>
          <SmartGardenLab key={JSON.stringify(v.params) + v.mode} params={{ ...DEFAULT_GARDEN_PARAMS, ...v.params, threshold }} testCases={cases.filter((c) => v.testCaseIds?.includes(c.id))} mode={v.mode ?? "explore"} />
        </CardContent>
      </Card>
    </div>
  );
}

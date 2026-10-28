"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ClassRoom } from "@/lib/domain/types";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { classSchema, type ClassForm } from "@/lib/validation/schemas";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";

/** Tạo lớp mới hoặc sửa thông tin lớp (khối, bộ sách, định hướng, năm học). */
export function ClassFormDialog({ open, onOpenChange, editing, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: ClassRoom; onCreated?: (id: string) => void }) {
  const { d, user } = useSessionData();
  const form = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    values: editing ? { name: editing.name, grade: editing.grade, textbookId: editing.textbookId, pathway: editing.pathway, schoolYear: editing.schoolYear } : { name: "", grade: 10, textbookId: "kntt", pathway: "chung", schoolYear: "2026–2027" },
  });
  const submit = form.handleSubmit((v) => {
    if (editing) {
      d.updateClass(editing.id, v);
      toast.success("Đã cập nhật lớp");
    } else {
      if (d.classes.some((c) => c.teacherId === user.id && c.name.toLowerCase() === v.name.toLowerCase())) return form.setError("name", { message: "Thầy cô đã có lớp trùng tên" });
      const id = d.createClass({ ...v, teacherId: user.id, schedule: [] });
      toast.success(`Đã tạo lớp ${v.name}`);
      onCreated?.(id);
    }
    onOpenChange(false);
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? `Sửa lớp ${editing.name}` : "Tạo lớp mới"} description="Khối và bộ sách quyết định lộ trình bài học của lớp.">
        <form onSubmit={submit} noValidate className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên lớp" htmlFor="c-name" error={form.formState.errors.name?.message}><Input id="c-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} /></Field>
            <Field label="Khối" htmlFor="c-grade"><Select id="c-grade" {...form.register("grade", { setValueAs: Number })}>{[10, 11, 12].map((g) => <option key={g} value={g}>{g}</option>)}</Select></Field>
            <Field label="Bộ sách" htmlFor="c-book"><Select id="c-book" {...form.register("textbookId")}>{TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.short}</option>)}</Select></Field>
            <Field label="Định hướng" htmlFor="c-path"><Select id="c-path" {...form.register("pathway")}><option value="chung">Chung</option><option value="ICT">ICT</option><option value="CS">CS</option></Select></Field>
            <Field label="Năm học" htmlFor="c-year" error={form.formState.errors.schoolYear?.message} className="col-span-2"><Input id="c-year" {...form.register("schoolYear")} /></Field>
          </div>
          <Button type="submit" className="w-full">{editing ? "Lưu" : "Tạo lớp"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

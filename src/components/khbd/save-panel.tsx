"use client";
import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Loader2, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import type { LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import type { KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import type { PhanTichGiaoAn, ThongTinBai } from "@khbd/lib/pipeline/kieu";
import type { NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import type { HocLieuGan } from "@khbd/lib/pipeline/6-xuat-file/hoc-lieu";
import { tomTatHoatDong } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { tenFileXuat, xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { htmlXemTruoc } from "@khbd/lib/pipeline/6-xuat-file/xem-truoc";
import { layMauQuaMayChu, type HamLayMau } from "@khbd/components/tao-khbd/Buoc56";
import type { Lesson } from "@/lib/domain/types";
import { toPlanActivities } from "@/lib/khbd/bridge";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LessonChoice } from "./lesson-picker";

/** Giới hạn file Word lưu kèm KHBD ở bản demo (lưu trong trình duyệt). */
const MAX_SAVED_BYTES = 1_500_000;

function toDataUrl(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(new Blob([bytes.slice()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  });
}

export interface SavePanelProps {
  lesson?: Lesson;
  choice: LessonChoice;
  phanTich: PhanTichGiaoAn;
  thongTin: ThongTinBai;
  luaChon: LuaChon;
  keHoach: KeHoach;
  noiDung: NoiDungSoan;
  hocLieu: HocLieuGan[];
  layMau?: HamLayMau;
  onSaved?: (planId: string) => void;
}

/** Lưu bản soạn vào "Kế hoạch bài dạy" của EduNova (có phiên bản) và in ra PDF. */
export function SavePanel({ lesson, choice, phanTich, thongTin, luaChon, keHoach, noiDung, hocLieu, layMau = layMauQuaMayChu, onSaved }: SavePanelProps) {
  const { d, user } = useSessionData();
  const [planId, setPlanId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "print" | null>(null);
  const [printHtml, setPrintHtml] = useState<string | null>(null);

  const word = async () => xuatWord(await layMau(), phanTich, thongTin, luaChon, keHoach, false, noiDung);

  async function save() {
    setBusy("save");
    try {
      const bytes = await word();
      const objectiveIds = lesson?.objectiveIds ?? [];
      const activities = toPlanActivities(tomTatHoatDong(phanTich, thongTin, luaChon, keHoach, noiDung), hocLieu, objectiveIds);
      const name = tenFileXuat(thongTin);
      const assistantFile = bytes.length <= MAX_SAVED_BYTES ? { name, size: bytes.length, dataUrl: await toDataUrl(bytes), savedAt: new Date().toISOString() } : undefined;
      const title = thongTin.tenBai?.trim() || lesson?.title || "KHBD";
      const notes = `Soạn bằng trợ lý KHBD${hocLieu.length ? `; gắn ${hocLieu.length} học liệu/mô phỏng` : ""}.`;
      let id = planId;
      if (id) {
        d.updateLessonPlan(id, { title, activities, notes, assistantFile });
      } else {
        id = d.createLessonPlan({
          ownerId: user.id, title, grade: choice.grade, textbookId: choice.textbookId, lessonId: choice.lessonId, objectiveIds,
          durationMinutes: (thongTin.soTiet ?? choice.periods) * 45, status: "draft", visibility: "private", activities, notes, assistantFile,
        });
        setPlanId(id);
      }
      const v = d.saveLessonPlanVersion(id, planId ? "Cập nhật từ trợ lý KHBD" : "Soạn bằng trợ lý KHBD", user.id);
      toast.success(`Đã lưu KHBD (phiên bản ${v})`);
      if (!assistantFile) toast.warning("File Word lớn hơn giới hạn của bản dùng thử nên chưa lưu kèm; thầy/cô tải file về máy ở bên dưới.");
      onSaved?.(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được KHBD");
    } finally {
      setBusy(null);
    }
  }

  async function print() {
    setBusy("print");
    try {
      setPrintHtml(await htmlXemTruoc(await word()));
      // chờ phần in được vẽ ra rồi mở hộp thoại in (chọn "Lưu dưới dạng PDF")
      setTimeout(() => { window.print(); setBusy(null); }, 300);
    } catch {
      toast.error("Không tạo được bản in");
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Hoàn thiện</CardTitle>
        <CardDescription>Lưu vào mục Kế hoạch bài dạy để chỉnh sửa tiếp, lưu phiên bản và dùng khi giao nhiệm vụ; tải file Word hoặc in ra PDF.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={busy !== null}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {planId ? "Lưu phiên bản mới" : "Lưu vào Kế hoạch bài dạy"}</Button>
        <Button variant="secondary" onClick={print} disabled={busy !== null}>{busy === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />} In / Lưu PDF</Button>
        {planId && (
          <span className="flex items-center gap-2 text-sm text-success-fg">
            <CheckCircle2 className="size-4" aria-hidden /> Đã lưu.
            <Link href={`/teacher/lesson-planner/${planId}`} className="font-medium text-cyan-fg hover:underline">Mở KHBD</Link>
          </span>
        )}
      </CardContent>
      {printHtml && typeof document !== "undefined" && createPortal(<div className="ban-in ban-xem-truoc hidden bg-[#fff] p-8 print:block" dangerouslySetInnerHTML={{ __html: printHtml }} />, document.body)}
    </Card>
  );
}

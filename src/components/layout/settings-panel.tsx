"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store/app-store";
import { useSessionData } from "@/lib/store/use-role";
import { downloadText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { ROLE_LABEL } from "./nav-config";

export function SettingsPanel({ extra }: { extra?: React.ReactNode }) {
  const { d, user } = useSessionData();
  const { theme, setTheme } = useTheme();
  const [confirm, setConfirm] = useState(false);

  function exportMine() {
    const s = useApp.getState();
    const mine = {
      user,
      lessonPlans: s.lessonPlans.filter((x) => x.ownerId === user.id),
      submissions: s.submissions.filter((x) => x.studentId === user.id),
      portfolio: s.portfolio.filter((x) => x.studentId === user.id),
      aiInteractions: s.aiInteractions.filter((x) => x.userId === user.id),
      exportedAt: new Date().toISOString(),
    };
    downloadText(`edunova-du-lieu-cua-toi.json`, JSON.stringify(mine, null, 2), "application/json");
  }

  return (
    <>
      <PageHeader title="Cài đặt" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle as="h2">Hồ sơ</CardTitle><CardDescription>Tài khoản dùng thử.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3"><Avatar user={user} size={52} /><div><p className="font-semibold text-fg">{user.name}</p><p className="text-sm text-muted">{ROLE_LABEL[user.role]} · {user.email}</p></div></div>
            <Field label="Họ tên" htmlFor="pf-name"><Input id="pf-name" value={user.name} readOnly /></Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Giao diện</CardTitle></CardHeader>
          <CardContent>
            <Field label="Chủ đề màu" htmlFor="pf-theme">
              <Select id="pf-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Sáng (mặc định)</option>
                <option value="dark">Tối</option>
              </Select>
            </Field>
            <p className="mt-3 text-xs text-muted">Hiệu ứng chuyển động tự giảm khi hệ điều hành bật “Giảm chuyển động”.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Dữ liệu</CardTitle><CardDescription>Mọi thay đổi chỉ lưu trên trình duyệt này.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportMine}><Download /> Tải dữ liệu của tôi (JSON)</Button>
            <Button variant="danger" onClick={() => setConfirm(true)}><RotateCcw /> Làm lại từ đầu</Button>
          </CardContent>
        </Card>
        {extra}
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Làm lại từ đầu?" description="Xóa mọi KHBD, nhiệm vụ, bài nộp và kết quả chấm bạn đã tạo, rồi nạp lại dữ liệu mẫu ban đầu.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Hủy</Button>
            <Button variant="danger" onClick={() => { d.resetDemo(); setConfirm(false); toast.success("Đã nạp lại dữ liệu mẫu"); }}>Làm lại</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Download, KeyRound, RotateCcw, Save } from "lucide-react";
import { hashPassword, verifyLogin } from "@/lib/auth/local-auth";
import { AUTH_MODE } from "@/lib/supabase/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/auth/password-input";
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
      <PageHeader title="Hồ sơ & Cài đặt" />
      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileCard />
        <PasswordCard />
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

/** Hồ sơ: họ tên, trường, bộ môn (giáo viên), email chỉ xem. */
function ProfileCard() {
  const { d, user } = useSessionData();
  const prof = d.profiles[user.id] ?? {};
  const [name, setName] = useState(user.name);
  const [school, setSchool] = useState(prof.school ?? "");
  const [subject, setSubject] = useState(prof.subject ?? (user.role === "teacher" ? "Tin học" : ""));
  const save = () => {
    if (name.trim().length < 2) return toast.error("Nhập họ tên");
    d.updateProfile(user.id, { name, school: school.trim(), subject: subject.trim() });
    toast.success("Đã lưu hồ sơ");
  };
  return (
    <Card>
      <CardHeader><CardTitle as="h2">Hồ sơ</CardTitle><CardDescription>{ROLE_LABEL[user.role]} · {user.email}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3"><Avatar user={{ ...user, name: name || user.name }} size={52} /><div><p className="font-semibold text-fg">{name || user.name}</p><p className="text-sm text-muted">{[subject, school].filter(Boolean).join(" · ") || "Chưa có trường, bộ môn"}</p></div></div>
        <Field label="Họ tên" htmlFor="pf-name"><Input id="pf-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Trường" htmlFor="pf-school"><Input id="pf-school" value={school} maxLength={120} placeholder="Ví dụ: THPT Lê Lợi" onChange={(e) => setSchool(e.target.value)} /></Field>
        {user.role === "teacher" && <Field label="Bộ môn" htmlFor="pf-subject"><Input id="pf-subject" value={subject} maxLength={60} onChange={(e) => setSubject(e.target.value)} /></Field>}
        <Field label="Email đăng nhập" htmlFor="pf-email"><Input id="pf-email" value={user.email} readOnly /></Field>
        <Button onClick={save}><Save /> Lưu hồ sơ</Button>
      </CardContent>
    </Card>
  );
}

/** Bảo mật: đổi mật khẩu. Bản dùng thử băm và lưu trên trình duyệt; bản nối máy chủ đổi qua Supabase Auth. */
function PasswordCard() {
  const { user } = useSessionData();
  const users = useApp((s) => s.users);
  const creds = useApp((s) => s.credentials);
  const setCredential = useApp((s) => s.setCredential);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const change = async () => {
    if (next.length < 8 || !/[0-9]/.test(next)) return toast.error("Mật khẩu mới tối thiểu 8 ký tự, có chữ số");
    if (next !== again) return toast.error("Mật khẩu nhập lại không khớp");
    setBusy(true);
    try {
      if (AUTH_MODE === "supabase") {
        const sb = supabaseBrowser();
        const { error } = (await sb?.auth.updateUser({ password: next })) ?? { error: new Error("no client") };
        if (error) return toast.error("Chưa đổi được mật khẩu, thử lại sau");
      } else {
        const r = await verifyLogin(user.email, cur, users, creds ?? {});
        if (!r.ok) return toast.error("Mật khẩu hiện tại không đúng");
        setCredential(user.id, await hashPassword(next));
      }
      setCur(""); setNext(""); setAgain("");
      toast.success("Đã đổi mật khẩu");
    } finally { setBusy(false); }
  };
  return (
    <Card>
      <CardHeader><CardTitle as="h2">Bảo mật</CardTitle><CardDescription>Đổi mật khẩu đăng nhập.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {AUTH_MODE !== "supabase" && <Field label="Mật khẩu hiện tại" htmlFor="pw-cur"><PasswordInput id="pw-cur" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>}
        <Field label="Mật khẩu mới" htmlFor="pw-new" hint="≥ 8 ký tự, có chữ số"><PasswordInput id="pw-new" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label="Nhập lại mật khẩu mới" htmlFor="pw-again"><PasswordInput id="pw-again" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} /></Field>
        <Button variant="secondary" onClick={change} loading={busy}><KeyRound /> Đổi mật khẩu</Button>
      </CardContent>
    </Card>
  );
}

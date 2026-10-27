"use client";
import { useState } from "react";
import { Accessibility, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_PREFS } from "@/lib/store/app-store";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/form";
import { SettingsPanel } from "@/components/layout/settings-panel";

const AREAS = ["Bài học", "Trò chơi mô phỏng", "Phòng lập trình", "Gia sư AI", "Luyện tập", "Dự án", "Khác"];

function StudentExtra() {
  const { d, user } = useSessionData();
  const prefs = d.prefs[user.id] ?? DEFAULT_PREFS;
  const [area, setArea] = useState(AREAS[0]);
  const [text, setText] = useState("");
  const mine = d.reports.filter((r) => r.userId === user.id);
  return (
    <>
      <Card>
        <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><Accessibility className="size-4" /> Hỗ trợ đọc và thao tác</CardTitle><CardDescription>Mọi chức năng đều dùng được bằng bàn phím (Tab, Enter, phím mũi tên). Ctrl+K để tìm kiếm.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Field label={`Cỡ chữ: ${Math.round(prefs.fontScale * 100)}%`} htmlFor="pf-font">
            <input id="pf-font" type="range" min={0.9} max={1.3} step={0.05} value={prefs.fontScale} onChange={(e) => d.setPrefs(user.id, { fontScale: Number(e.target.value) })} className="w-full accent-[var(--cyan)]" />
          </Field>
          <Checkbox label="Tăng độ tương phản" checked={prefs.highContrast} onChange={(e) => d.setPrefs(user.id, { highContrast: e.target.checked })} />
          <Button size="sm" variant="ghost" onClick={() => d.setPrefs(user.id, DEFAULT_PREFS)}>Đặt lại</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><LifeBuoy className="size-4" /> Báo lỗi, góp ý</CardTitle><CardDescription>Gặp lỗi hoặc nội dung sai? Hãy cho thầy cô và quản trị viên biết.</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (text.trim().length < 10) return toast.error("Hãy mô tả ít nhất 10 ký tự"); d.reportIssue(user.id, area, text.trim().slice(0, 2000)); setText(""); toast.success("Đã gửi báo lỗi. Cảm ơn em!"); }}>
            <Field label="Khu vực" htmlFor="rp-area"><Select id="rp-area" value={area} onChange={(e) => setArea(e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</Select></Field>
            <Field label="Mô tả" htmlFor="rp-text"><Textarea id="rp-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Em đã làm gì, điều gì xảy ra, em mong đợi điều gì?" /></Field>
            <Button type="submit" size="sm" data-testid="report-submit">Gửi</Button>
          </form>
          {mine.length > 0 && <ul className="mt-4 space-y-1 text-sm">{mine.map((r) => <li key={r.id} className="text-muted"><span className="text-fg">{r.area}:</span> {r.text.slice(0, 80)} · {formatDate(r.at, true)}</li>)}</ul>}
        </CardContent>
      </Card>
    </>
  );
}

export default function StudentSettings() {
  return <SettingsPanel extra={<StudentExtra />} />;
}

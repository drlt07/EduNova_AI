"use client";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { AUTH_MODE } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** Học sinh vào lớp bằng mã mời thầy cô gửi. Bản thật kiểm tra mã trên máy chủ; bản dùng thử tìm trong lớp mẫu. */
export function JoinClass({ studentId, className, compact }: { studentId: string; className?: string; compact?: boolean }) {
  const joinLocal = useApp((s) => s.joinClassLocal);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.trim().length < 6) return setError("Mã lớp có ít nhất 6 ký tự, ví dụ TIN10A1-7KQ.");
    setBusy(true);
    try {
      if (AUTH_MODE === "supabase") {
        const { joinClassCloud } = await import("@/lib/cloud/sync");
        const r = await joinClassCloud(code);
        if (!r.ok) return setError(r.error);
        toast.success(r.name ? `Đã vào lớp ${r.name}` : "Đã vào lớp");
      } else {
        const id = joinLocal(studentId, code);
        if (!id) return setError("Mã lớp không đúng. Hỏi thầy cô mã mời của lớp.");
        toast.success(`Đã vào lớp ${useApp.getState().classes.find((c) => c.id === id)?.name ?? ""}`);
      }
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className={cn("rounded-2xl border border-line bg-surface p-4", className)} aria-label="Vào lớp bằng mã mời">
      <label htmlFor="join-code" className="text-sm font-semibold text-fg">{compact ? "Vào thêm lớp khác" : "Em chưa ở lớp nào — nhập mã mời thầy cô gửi"}</label>
      <div className="mt-2 flex gap-2">
        <Input id="join-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="TIN10A1-7KQ" autoComplete="off" maxLength={40} className="font-mono uppercase" aria-invalid={!!error} aria-describedby={error ? "join-error" : undefined} />
        <Button type="submit" disabled={busy}><LogIn /> {busy ? "Đang vào…" : "Vào lớp"}</Button>
      </div>
      {error && <p id="join-error" role="alert" className="mt-2 text-sm text-danger-fg">{error}</p>}
    </form>
  );
}

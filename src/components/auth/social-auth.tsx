"use client";
import { useState } from "react";
import { AUTH_MODE } from "@/lib/supabase/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Notice } from "@/components/ui/feedback";

type Provider = "google" | "facebook";
const LABEL: Record<Provider, string> = { google: "Google", facebook: "Facebook" };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6H1.4a12 12 0 0 0 0 10.8z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path fill="#fff" d="M13.4 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.2 1.2-1.2h1.2V6.3a16 16 0 0 0-1.8-.1c-1.8 0-3 1.1-3 3.1v1.8H9v2.4h2v6z" />
    </svg>
  );
}

/**
 * Đăng nhập / đăng ký bằng Google (Gmail) hoặc Facebook qua Supabase Auth (OAuth). Vai trò vẫn do cơ sở dữ liệu quyết định theo email.
 * Khi chưa nối máy chủ, nút báo rõ cần cấu hình thay vì giả vờ đăng nhập.
 */
export function SocialAuth({ mode }: { mode: "login" | "register" }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [note, setNote] = useState("");
  const verb = mode === "login" ? "Tiếp tục" : "Đăng ký";

  async function go(p: Provider) {
    setNote("");
    const sb = AUTH_MODE === "supabase" ? supabaseBrowser() : null;
    if (!sb) return setNote(`Đăng nhập bằng ${LABEL[p]} sẽ mở khi EduNova được nối máy chủ tài khoản (Supabase) và bật ${LABEL[p]} trong phần cấu hình. Hiện em dùng email và mật khẩu nhé.`);
    setBusy(p);
    const { error } = await sb.auth.signInWithOAuth({ provider: p, options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
    if (error) { setBusy(null); setNote(`Chưa kết nối được ${LABEL[p]}. Thử lại sau hoặc dùng email.`); }
  }

  const btn = "flex h-12 items-center justify-center gap-2.5 rounded-xl border border-line bg-surface text-sm font-semibold text-fg shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:opacity-60";
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={btn} disabled={!!busy} onClick={() => go("google")}><GoogleIcon /> {busy === "google" ? "Đang mở…" : `${verb} với Google`}</button>
        <button type="button" className={btn} disabled={!!busy} onClick={() => go("facebook")}><FacebookIcon /> {busy === "facebook" ? "Đang mở…" : `${verb} với Facebook`}</button>
      </div>
      {note && <div role="status" className="mt-3"><Notice tone="info">{note}</Notice></div>}
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />hoặc dùng email<span className="h-px flex-1 bg-line" /></div>
    </div>
  );
}

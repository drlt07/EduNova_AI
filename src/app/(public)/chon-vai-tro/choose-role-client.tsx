"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Presentation } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AUTH_MODE } from "@/lib/supabase/config";
import { ROLE_HOME } from "@/lib/auth/paths";
import { needsRoleChoice, profileToUser, type ProfileRow } from "@/lib/auth/profile";
import { useApp } from "@/lib/store/app-store";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Notice } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

type Choice = "teacher" | "student";

const OPTIONS: { role: Choice; title: string; desc: string; icon: typeof Presentation }[] = [
  { role: "teacher", title: "Giáo viên", desc: "Tạo lớp và mã mời, giao bài, mở mô phỏng cho lớp, xem kết quả học tập của học sinh.", icon: Presentation },
  { role: "student", title: "Học sinh", desc: "Vào lớp bằng mã thầy cô gửi, làm nhiệm vụ, luyện tập và chơi mô phỏng.", icon: GraduationCap },
];

/**
 * Lần đăng nhập đầu: người dùng tự xác nhận mình là Giáo viên hay Học sinh (gọi choose_role trên máy chủ, chỉ một lần).
 * Email trường, đăng ký kèm mã lớp và quản trị viên được bỏ qua bước này.
 */
export function ChooseRoleClient() {
  const router = useRouter();
  const signInAs = useApp((s) => s.signInAs);
  const [pick, setPick] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  // Đã có vai trò (hoặc chưa đăng nhập) thì không ở lại trang này
  useEffect(() => {
    const sb = supabaseBrowser();
    if (AUTH_MODE !== "supabase" || !sb) { router.replace("/"); return; }
    let alive = true;
    void (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!alive) return;
      if (!user) { router.replace("/login"); return; }
      const { data } = await sb.from("profiles").select("*").eq("id", user.id).single<ProfileRow>();
      if (!alive) return;
      if (data && !needsRoleChoice(data)) router.replace(ROLE_HOME[data.role]);
      else if (data) setName(data.full_name);
    })();
    return () => { alive = false; };
  }, [router]);

  async function confirm() {
    const sb = supabaseBrowser();
    if (!sb || !pick) return;
    setBusy(true);
    setError("");
    const { error: e } = await sb.rpc("choose_role", { p_role: pick });
    if (e) {
      setBusy(false);
      return setError(/does not exist|schema cache/i.test(e.message) ? "Máy chủ chưa cập nhật chức năng chọn vai trò. Báo quản trị viên chạy migration role_choice." : e.message);
    }
    const { data: { user } } = await sb.auth.getUser();
    const { data } = user ? await sb.from("profiles").select("*").eq("id", user.id).single<ProfileRow>() : { data: null };
    if (data) signInAs(profileToUser(data));
    router.replace(ROLE_HOME[pick]);
    router.refresh();
  }

  return (
    <AuthLayout eyebrow={name ? `Chào ${name}` : "Chào mừng đến EduNova"} title="Bạn là ai?" subtitle="Chọn vai trò để EduNova mở đúng không gian làm việc. Bạn chỉ chọn một lần; muốn đổi sau này cần nhờ quản trị viên.">
      <div role="radiogroup" aria-label="Vai trò" className="space-y-3">
        {OPTIONS.map((o) => {
          const on = pick === o.role;
          return (
            <button
              key={o.role}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPick(o.role)}
              className={cn(
                "flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition",
                on ? "border-blue-600 bg-blue-50 shadow-sm dark:bg-blue-950/40" : "border-border bg-surface hover:border-blue-300",
              )}
            >
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", on ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200")}>
                <o.icon className="size-6" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold text-fg">{o.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{o.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
      {error && <div role="alert" className="mt-4"><Notice tone="danger">{error}</Notice></div>}
      <button
        type="button"
        disabled={!pick || busy}
        onClick={confirm}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-brand-ink shadow-lg shadow-brand/25 transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Đang lưu…" : <>Xác nhận {pick ? (pick === "teacher" ? "Giáo viên" : "Học sinh") : "vai trò"} <ArrowRight className="size-4" aria-hidden /></>}
      </button>
    </AuthLayout>
  );
}

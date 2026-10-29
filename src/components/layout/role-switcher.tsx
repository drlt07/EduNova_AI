"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ROLE_HOME, ROLE_LABEL } from "./nav-config";
import { AUTH_MODE } from "@/lib/supabase/config";
import { signOutEverywhere } from "@/components/auth/supabase-session";

const SWITCHABLE = ["t1", "t2", "s1", "s16", "a1"];
/** Bấm avatar mở hồ sơ & cài đặt của vai trò. */
const PROFILE = { teacher: "/teacher/settings", student: "/student/profile", admin: "/admin" } as const;

export function RoleSwitcher() {
  const user = useCurrentUser();
  const users = useApp((s) => s.users);
  const login = useApp((s) => s.login);
  const logout = useApp((s) => s.logout);
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href={PROFILE[user.role]} title="Hồ sơ & Cài đặt" className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-0.5 hover:bg-surface-2">
        <Avatar user={user} size={32} />
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-semibold leading-tight text-fg">{user.name}</span>
          <span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span>
        </span>
      </Link>
      {AUTH_MODE === "demo" && (
        <>
        <label htmlFor="role-switch" className="sr-only">
          Đổi tài khoản dùng thử
        </label>
        <select
          id="role-switch"
          value={user.id}
          onChange={(e) => {
            const next = users.find((u) => u.id === e.target.value);
            if (!next) return;
            login(next.id);
            router.push(ROLE_HOME[next.role]);
          }}
          className="h-9 max-w-[150px] rounded-lg border border-line bg-surface-2 px-2 text-xs text-fg"
        >
          {SWITCHABLE.map((id) => {
            const u = users.find((x) => x.id === id);
            return u ? (
              <option key={id} value={id}>
                {ROLE_LABEL[u.role]}: {u.name}
              </option>
            ) : null;
          })}
        </select>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Đăng xuất"
        onClick={async () => {
          await signOutEverywhere(logout);
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut />
      </Button>
    </div>
  );
}

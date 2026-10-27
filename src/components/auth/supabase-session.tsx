"use client";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { profileToUser, type ProfileRow } from "@/lib/auth/profile";
import { setAuthReady } from "@/lib/auth/session-state";
import { useApp } from "@/lib/store/app-store";

/** Đồng bộ phiên Supabase vào giao diện: người dùng, vai trò (từ bảng profiles) và đăng xuất. */
export function SupabaseSession() {
  const signInAs = useApp((s) => s.signInAs);
  const logout = useApp((s) => s.logout);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    const sync = async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!alive) return;
      if (user) {
        const { data } = await sb.from("profiles").select("id, role, full_name, email").eq("id", user.id).single<ProfileRow>();
        if (!alive) return;
        if (data) signInAs(profileToUser(data));
        else logout();
      } else logout();
      setAuthReady();
    };
    // chờ kho dữ liệu nạp xong để phiên thật không bị dữ liệu cũ ghi đè
    const start = () => void sync();
    if (useApp.persist.hasHydrated()) start();
    const unsubHydrate = useApp.persist.onFinishHydration(start);
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") logout();
      else if (event === "SIGNED_IN" || event === "USER_UPDATED") void sync();
    });
    return () => {
      alive = false;
      unsubHydrate();
      sub.subscription.unsubscribe();
    };
  }, [signInAs, logout]);

  return null;
}

/** Đăng xuất: bản thật gọi Supabase (xóa cookie phiên), bản dùng thử chỉ xóa phiên trên trình duyệt. */
export async function signOutEverywhere(localLogout: () => void) {
  await supabaseBrowser()?.auth.signOut();
  localLogout();
}

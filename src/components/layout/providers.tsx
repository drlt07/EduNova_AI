"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useApp } from "@/lib/store/app-store";
import { AUTH_MODE } from "@/lib/supabase/config";
import { SupabaseSession } from "@/components/auth/supabase-session";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // mock repository: nạp dữ liệu từ localStorage sau khi mount (tránh lệch hydration)
    void useApp.persist.rehydrate();
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        {AUTH_MODE === "supabase" && <SupabaseSession />}
        {children}
        <Toaster richColors position="top-center" closeButton />
      </MotionConfig>
    </ThemeProvider>
  );
}

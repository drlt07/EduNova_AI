"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useApp } from "@/lib/store/app-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // mock repository: nạp dữ liệu từ localStorage sau khi mount (tránh lệch hydration)
    void useApp.persist.rehydrate();
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster richColors position="bottom-right" closeButton />
      </MotionConfig>
    </ThemeProvider>
  );
}

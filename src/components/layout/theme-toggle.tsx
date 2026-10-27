"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = !mounted || resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

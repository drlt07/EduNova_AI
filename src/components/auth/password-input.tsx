"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/form";

/** Ô mật khẩu có nút hiện/ẩn (React 19: ref truyền như prop bình thường, ví dụ từ react-hook-form). */
export function PasswordInput(props: React.ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={show} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-fg">
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

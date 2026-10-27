"use client";
/** Gia sư mở dạng ngăn kéo bên phải từ bất kỳ trang nào của học sinh. */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Bot, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { TutorChat, type TutorContextData } from "./tutor-chat";

const Ctx = createContext<{ open: (c?: TutorContextData) => void; setLocked: (v: boolean) => void }>({ open: () => {}, setLocked: () => {} });
export const useTutor = () => useContext(Ctx);

/** Khóa gia sư khi học sinh đang làm bài kiểm tra chính thức. */
export function useTutorLock(active: boolean) {
  const { setLocked } = useTutor();
  useEffect(() => {
    setLocked(active);
    return () => setLocked(false);
  }, [active, setLocked]);
}

export function TutorProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [ctx, setCtx] = useState<TutorContextData | null>(null);
  const [key, setKey] = useState(0);
  const [locked, setLockedState] = useState(false);
  const setLocked = useCallback((v: boolean) => setLockedState(v), []);
  const open = useCallback((c?: TutorContextData) => {
    setCtx(c ?? {});
    setKey((k) => k + 1);
  }, []);
  return (
    <Ctx.Provider value={{ open, setLocked }}>
      {children}
      {!ctx && (
        <Button className="fixed z-40 shadow-lg" style={{ right: "max(20px, env(safe-area-inset-right, 0px))", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }} variant="violet" onClick={() => open()}>
          <Bot /> Hỏi gia sư
        </Button>
      )}
      <AnimatePresence>
        {ctx && (
          <motion.aside
            key={key}
            role="dialog"
            aria-modal="false"
            aria-label="Gia sư Tin học"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface p-4 shadow-2xl"
            style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold text-fg"><Bot className="size-5 text-violet-fg" /> Gia sư Tin học</p>
              <Button variant="ghost" size="icon" aria-label="Đóng gia sư" onClick={() => setCtx(null)}><X /></Button>
            </div>
            <div className="min-h-0 flex-1"><TutorChat key={String(locked)} context={{ ...ctx, locked: locked || ctx.locked }} userId={userId} compact /></div>
          </motion.aside>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

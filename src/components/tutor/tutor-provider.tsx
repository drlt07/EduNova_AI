"use client";
/**
 * AI Gia sư ngay trong bài: bảng bên phải (máy tính) hoặc ngăn riêng (điện thoại), mở từ mọi trang học sinh.
 * - TutorScope: trang/khối khai báo tên hoạt động, chủ đề, mức hỗ trợ (giáo viên đặt).
 * - useTutorActivity: thành phần bài làm (khu lập trình, mô phỏng, câu hỏi) đăng ký hàm đọc TRẠNG THÁI THẬT;
 *   gia sư gọi hàm này đúng lúc học sinh hỏi. Hoạt động em vừa thao tác gần nhất được ưu tiên.
 */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Topic } from "@/lib/ai/tutor";
import type { TutorCapability, TutorLevel, TutorState } from "@/lib/ai/tutor-core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TutorChat } from "./tutor-chat";

export interface TutorScopeValue {
  title?: string;
  topic?: Topic;
  level?: TutorLevel;
  objectiveId?: string;
}

export interface TutorActivity extends Required<Pick<TutorScopeValue, "title" | "topic" | "level">> {
  objectiveId?: string;
  kind: "code" | "simulation" | "quiz" | "lesson" | "free";
  read?: () => TutorState | undefined;
}

/** Cách gọi cũ (title/topic/error/failing) vẫn dùng được: có lỗi thì mở ở chế độ Phân tích lỗi. */
export interface TutorOpenOptions {
  title?: string;
  topic?: Topic;
  capability?: TutorCapability;
  error?: unknown;
  failing?: unknown[];
  locked?: boolean;
  ref?: string;
}

interface Registry {
  register: (id: string, get: () => TutorActivity) => () => void;
  touch: (id: string) => void;
}

const ScopeCtx = createContext<TutorScopeValue>({});
const RegCtx = createContext<Registry | null>(null);
const Ctx = createContext<{ open: (o?: TutorOpenOptions) => void; setLocked: (v: boolean) => void }>({ open: () => {}, setLocked: () => {} });

export const useTutor = () => useContext(Ctx);

export function TutorScope({ children, ...value }: TutorScopeValue & { children: React.ReactNode }) {
  const parent = useContext(ScopeCtx);
  const { title, topic, level, objectiveId } = value;
  const merged = useMemo(() => ({ ...parent, ...Object.fromEntries(Object.entries({ title, topic, level, objectiveId }).filter(([, v]) => v !== undefined)) }), [parent, title, topic, level, objectiveId]);
  return <ScopeCtx.Provider value={merged}>{children}</ScopeCtx.Provider>;
}

/** Đăng ký trạng thái thật của một bài làm. Trả về `touch()` để báo em vừa thao tác (chạy, kiểm thử, trả lời). */
export function useTutorActivity(kind: TutorActivity["kind"], read?: () => TutorState | undefined, override?: TutorScopeValue) {
  const parent = useContext(ScopeCtx);
  const { title: oTitle, topic: oTopic, level: oLevel, objectiveId: oObj } = override ?? {};
  const scope = useMemo(() => ({ title: oTitle ?? parent.title, topic: oTopic ?? parent.topic, level: oLevel ?? parent.level, objectiveId: oObj ?? parent.objectiveId }), [parent, oTitle, oTopic, oLevel, oObj]);
  const reg = useContext(RegCtx);
  const id = useId();
  const readRef = useRef(read);
  useEffect(() => { readRef.current = read; });
  useEffect(() => {
    if (!reg) return;
    return reg.register(id, () => ({ title: scope.title ?? "Bài đang học", topic: scope.topic ?? "general", level: scope.level ?? "guided", objectiveId: scope.objectiveId, kind, read: () => readRef.current?.() }));
  }, [reg, id, kind, scope]);
  return useCallback(() => reg?.touch(id), [reg, id]);
}

/** Khóa gia sư khi học sinh đang làm bài kiểm tra chính thức. */
export function useTutorLock(active: boolean) {
  const { setLocked } = useTutor();
  useEffect(() => {
    setLocked(active);
    return () => setLocked(false);
  }, [active, setLocked]);
}

export function TutorProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [entries, setEntries] = useState<Record<string, { get: () => TutorActivity; at: number }>>({});
  const [opened, setOpened] = useState<{ key: number; options: TutorOpenOptions } | null>(null);
  const [locked, setLockedState] = useState(false);
  const setLocked = useCallback((v: boolean) => setLockedState(v), []);

  const registry = useMemo<Registry>(() => ({
    register: (id, get) => {
      setEntries((cur) => ({ ...cur, [id]: { get, at: Date.now() } }));
      return () => setEntries((cur) => { const next = { ...cur }; delete next[id]; return next; });
    },
    touch: (id) => setEntries((cur) => (cur[id] ? { ...cur, [id]: { ...cur[id], at: Date.now() } } : cur)),
  }), []);

  const open = useCallback((o?: TutorOpenOptions) => setOpened((cur) => ({ key: (cur?.key ?? 0) + 1, options: o ?? {} })), []);

  /** Hoạt động hiện tại: bài em thao tác gần nhất; không có thì dùng tên/chủ đề trang truyền vào. */
  const current = useMemo<TutorActivity>(() => {
    const latest = Object.values(entries).sort((a, b) => b.at - a.at)[0]?.get();
    const o = opened?.options ?? {};
    const base = latest ?? { title: o.title ?? "Hỏi đáp tự do", topic: o.topic ?? "general", level: "free" as TutorLevel, kind: "free" as const };
    return locked || o.locked ? { ...base, level: "exam" } : base;
  }, [entries, opened, locked]);

  const initialCapability: TutorCapability | undefined = opened?.options.capability ?? (opened?.options.error || opened?.options.failing?.length ? "debug" : undefined);

  return (
    <Ctx.Provider value={{ open, setLocked }}>
      <RegCtx.Provider value={registry}>
        <div className={cn("transition-[margin] duration-200", opened && "lg:mr-[400px]")}>{children}</div>
      </RegCtx.Provider>
      {!opened && (
        <Button className="fixed z-40 shadow-lg" style={{ right: "max(20px, env(safe-area-inset-right, 0px))", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }} variant="violet" onClick={() => open()} data-testid="tutor-open">
          <Bot /> AI Gia sư
        </Button>
      )}
      <AnimatePresence>
        {opened && (
          <motion.aside
            key="tutor"
            role="complementary"
            aria-label="AI Gia sư"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col border-l border-line bg-surface p-4 shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:top-16 lg:z-30 lg:w-[400px] lg:shadow-xl"
            style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold text-fg"><Bot className="size-5 text-violet-fg" aria-hidden /> AI Gia sư EduNova</p>
              <Button variant="ghost" size="icon" aria-label="Đóng AI Gia sư" onClick={() => setOpened(null)}><X /></Button>
            </div>
            <div className="min-h-0 flex-1">
              <TutorChat key={`${opened.key}-${current.title}-${current.level}`} activity={current} userId={userId} compact initialCapability={initialCapability} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

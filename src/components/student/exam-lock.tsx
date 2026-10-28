"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Lock, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Số lần rời bài cho phép; tới lần này bài được nộp tự động. */
export const MAX_LEAVES = 3;

const enterFullscreen = () => {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => undefined);
};

/**
 * Chế độ khóa tab khi làm bộ câu hỏi: toàn màn hình, phát hiện rời tab / chuyển cửa sổ / thoát toàn màn hình,
 * chặn chuột phải, sao chép, dán và hỏi lại khi đóng trang. Mỗi lần rời bài tính một lần; đủ MAX_LEAVES thì gọi onLimit.
 * Trình duyệt không cho trang web khóa cứng người dùng, nên đây là phát hiện và ghi lại, không phải chặn tuyệt đối.
 */
export function useExamLock(active: boolean, onLimit: () => void) {
  const [leaves, setLeaves] = useState(0);
  const [warning, setWarning] = useState(false);
  const last = useRef(0);
  const limitRef = useRef(onLimit);
  useEffect(() => { limitRef.current = onLimit; });

  useEffect(() => {
    if (!active) return;
    const leave = () => {
      const now = Date.now();
      if (now - last.current < 1500) return; // một lần rời có thể bắn nhiều sự kiện
      last.current = now;
      setLeaves((n) => {
        const next = n + 1;
        if (next >= MAX_LEAVES) window.setTimeout(() => limitRef.current(), 0);
        return next;
      });
      setWarning(true);
    };
    const onVisibility = () => { if (document.hidden) leave(); };
    const onBlur = () => leave();
    const onFs = () => { if (!document.fullscreenElement) leave(); };
    const block = (e: Event) => e.preventDefault();
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      window.removeEventListener("beforeunload", onUnload);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    };
  }, [active]);

  return { leaves, warning, resume: () => { setWarning(false); enterFullscreen(); } };
}

/** Màn hình trước khi bắt đầu: giải thích luật khóa tab. */
export function LockStart({ title, count, onStart }: { title: string; count: number; onStart: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-6 text-center shadow-sm sm:p-8">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-blue-fg"><Lock className="size-7" aria-hidden /></span>
      <h2 className="mt-4 text-xl font-bold text-fg">{title}</h2>
      <p className="mt-1 text-sm text-muted">{count} câu · làm trong chế độ khóa tab</p>
      <ul className="mt-5 space-y-2 text-left text-sm text-fg">
        <li className="flex gap-2"><Maximize className="mt-0.5 size-4 shrink-0 text-blue-fg" aria-hidden /> Bài làm mở toàn màn hình.</li>
        <li className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden /> Chuyển sang tab hoặc ứng dụng khác, thoát toàn màn hình đều tính là một lần rời bài và thầy cô sẽ thấy.</li>
        <li className="flex gap-2"><Lock className="mt-0.5 size-4 shrink-0 text-danger-fg" aria-hidden /> Rời bài {MAX_LEAVES} lần thì bài được nộp tự động. Không sao chép, dán trong lúc làm.</li>
      </ul>
      <Button size="lg" className="mt-6 w-full" onClick={() => { enterFullscreen(); onStart(); }} data-testid="lock-start">Bắt đầu làm bài</Button>
    </div>
  );
}

/** Lớp phủ cảnh báo khi vừa rời bài. */
export function LockWarning({ leaves, onResume }: { leaves: number; onResume: () => void }) {
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="lock-w-h" className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 text-center shadow-2xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger/15 text-danger-fg"><AlertTriangle className="size-7" aria-hidden /></span>
        <h2 id="lock-w-h" className="mt-4 text-xl font-bold text-fg">Em vừa rời bài làm</h2>
        <p className="mt-2 text-sm text-muted">Lần {leaves}/{MAX_LEAVES}. {leaves >= MAX_LEAVES ? "Bài đã được nộp tự động." : `Rời thêm ${MAX_LEAVES - leaves} lần nữa bài sẽ được nộp tự động. Thầy cô xem được số lần này.`}</p>
        <Button className="mt-5 w-full" onClick={onResume} autoFocus>{leaves >= MAX_LEAVES ? "Xem kết quả" : "Quay lại làm bài"}</Button>
      </div>
    </div>
  );
}

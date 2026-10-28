"use client";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { fmtScore, labScore } from "@/lib/sim/lab-score";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";

interface Scope { slug: string; /** Số giây từ lúc mở (hoặc lần lưu trước) đến giờ, rồi bắt đầu đếm lại. */ lap: () => number }
const Ctx = createContext<Scope | null>(null);

/** Bọc một mô phỏng: khi học sinh đăng nhập làm xong, kết quả được chấm và lưu cho thầy cô xem. */
export function LabResultScope({ slug, children }: { slug: string; children: ReactNode }) {
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, [slug]);
  const value = useMemo<Scope>(() => ({
    slug,
    lap: () => {
      const s = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
      startedAt.current = Date.now();
      return s;
    },
  }), [slug]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Đặt ở màn hình hoàn thành của mô phỏng: hiện điểm và (với học sinh) lưu kết quả một lần mỗi lượt làm.
 * Lượt mới bắt đầu khi bấm "Làm lại" vì màn hình hoàn thành bị gỡ rồi gắn lại.
 */
export function LabScore({ mistakes }: { mistakes: number }) {
  const scope = useContext(Ctx);
  const user = useCurrentUser();
  const record = useApp((s) => s.recordLabResult);
  const score = labScore(mistakes);
  const student = user?.role === "student" ? user.id : undefined;
  const saved = useRef(false);
  useEffect(() => {
    if (!scope || !student || saved.current) return;
    saved.current = true;
    record({ studentId: student, labSlug: scope.slug, score, mistakes, seconds: scope.lap() });
    toast.success(`Đã lưu kết quả: ${fmtScore(score)} điểm`);
  }, [scope, student, record, score, mistakes]);
  return (
    <p className="mt-1 text-sm text-fg">
      Điểm: <b className="text-lg">{fmtScore(score)}</b>/10
      <span className="block text-xs text-muted">Hoàn thành được 10 điểm, mỗi lần chọn sai trừ 0,5.{student ? "" : " Đăng nhập tài khoản học sinh để lưu kết quả."}</span>
    </p>
  );
}

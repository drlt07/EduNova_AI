/**
 * Lớp chấm của màn Thử thách (dùng chung cho mọi mô phỏng khung PhET): đếm lần sai, ghi chi tiết từng thử thách, gợi ý theo bậc.
 * Hàm thuần, không phụ thuộc giao diện hay hoạt ảnh.
 */
import type { LabStep } from "@/lib/sim/lab-score";

/** Thông tin kèm một lần kiểm tra: đáp án dạng chữ (để không trừ điểm khi thử lại đúng đáp án sai cũ) và tên lỗi. */
export interface CheckInfo { answer?: string; error?: string }

export interface ChallengeState {
  idx: number;
  mistakes: number;
  feedback: { ok: boolean; text: string } | null;
  run: number;
  steps: LabStep[];
  lastWrong: string | null;
  hintLevel: number;
}

export type ChallengeAction =
  | { type: "check"; ok: boolean; text: string; info?: CheckInfo; label: string }
  | { type: "hint"; label: string }
  | { type: "next" }
  | { type: "restart" };

export const MAX_HINTS = 3;

export const initialChallenge = (): ChallengeState => ({ idx: 0, mistakes: 0, feedback: null, run: 0, steps: [], lastWrong: null, hintLevel: 0 });

function patchStep(s: ChallengeState, label: string, f: (st: LabStep) => LabStep): LabStep[] {
  const out = [...s.steps];
  out[s.idx] = f(out[s.idx] ?? { id: `c${s.idx + 1}`, label, tries: 0, ok: false, errors: [], hints: 0 });
  return out;
}

export function challengeReducer(s: ChallengeState, a: ChallengeAction): ChallengeState {
  switch (a.type) {
    case "check": {
      const { ok, text, info } = a;
      // Bấm lại đúng đáp án sai vừa thử: nhắc, không trừ điểm, không tính thêm lần thử
      if (!ok && info?.answer !== undefined && info.answer === s.lastWrong) return { ...s, feedback: { ok, text: `Em vừa thử đáp án này rồi. ${text}` } };
      return {
        ...s,
        feedback: { ok, text },
        mistakes: ok ? s.mistakes : s.mistakes + 1,
        lastWrong: ok ? s.lastWrong : info?.answer ?? null,
        steps: patchStep(s, a.label, (st) => ({ ...st, tries: st.tries + 1, ok, errors: ok ? st.errors : [...st.errors, info?.error ?? "Chưa đúng"], answer: info?.answer ?? st.answer })),
      };
    }
    case "hint":
      if (s.hintLevel >= MAX_HINTS) return s;
      return { ...s, hintLevel: s.hintLevel + 1, steps: patchStep(s, a.label, (st) => ({ ...st, hints: st.hints + 1 })) };
    case "next":
      return { ...s, feedback: null, lastWrong: null, hintLevel: 0, idx: s.idx + 1 };
    case "restart":
      return { ...initialChallenge(), run: s.run + 1 };
  }
}

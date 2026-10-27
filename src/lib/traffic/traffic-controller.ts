/**
 * TrafficController — điều khiển pha đèn của giao lộ bốn hướng.
 * Hai trục xung đột: Bắc–Nam (NS) và Đông–Tây (EW). Không bao giờ có hai trục cùng xanh:
 * mọi lần chuyển đều đi qua VÀNG rồi ĐỎ TOÀN PHẦN (thời gian giải phóng giao lộ).
 */
export type Axis = "NS" | "EW";
export type LightColor = "red" | "yellow" | "green";
export type PhaseName = "NS_GREEN" | "NS_YELLOW" | "ALL_RED_TO_EW" | "EW_GREEN" | "EW_YELLOW" | "ALL_RED_TO_NS";
export type ControlMode = "auto" | "manual";

export interface PhaseTiming {
  green: number;
  yellow: number;
  allRed: number;
}

export const DEFAULT_TIMING: PhaseTiming = { green: 9, yellow: 2.5, allRed: 1.5 };

export const NEXT_PHASE: Record<PhaseName, PhaseName> = {
  NS_GREEN: "NS_YELLOW",
  NS_YELLOW: "ALL_RED_TO_EW",
  ALL_RED_TO_EW: "EW_GREEN",
  EW_GREEN: "EW_YELLOW",
  EW_YELLOW: "ALL_RED_TO_NS",
  ALL_RED_TO_NS: "NS_GREEN",
};

export const PHASE_LABEL: Record<PhaseName, string> = {
  NS_GREEN: "Bắc–Nam xanh, Đông–Tây đỏ",
  NS_YELLOW: "Bắc–Nam vàng, Đông–Tây đỏ",
  ALL_RED_TO_EW: "Đỏ toàn phần (giải phóng giao lộ)",
  EW_GREEN: "Đông–Tây xanh, Bắc–Nam đỏ",
  EW_YELLOW: "Đông–Tây vàng, Bắc–Nam đỏ",
  ALL_RED_TO_NS: "Đỏ toàn phần (giải phóng giao lộ)",
};

export interface ControllerState {
  phase: PhaseName;
  /** thời gian đã ở trong pha hiện tại (giây mô phỏng) */
  elapsed: number;
  mode: ControlMode;
  timing: PhaseTiming;
  /** chế độ thủ công: học sinh đã yêu cầu đổi trục xanh */
  switchRequested: boolean;
}

export function createController(mode: ControlMode = "auto", timing: PhaseTiming = DEFAULT_TIMING): ControllerState {
  return { phase: "NS_GREEN", elapsed: 0, mode, timing, switchRequested: false };
}

export function phaseDuration(c: ControllerState, phase: PhaseName = c.phase): number {
  if (phase.endsWith("GREEN")) return c.mode === "manual" ? Infinity : c.timing.green;
  if (phase.endsWith("YELLOW")) return c.timing.yellow;
  return c.timing.allRed;
}

/** Màu đèn mà một trục đang thấy. */
export function lightFor(phase: PhaseName, axis: Axis): LightColor {
  if (phase === `${axis}_GREEN`) return "green";
  if (phase === `${axis}_YELLOW`) return "yellow";
  return "red";
}

/** Thời gian còn lại của pha hiện tại (Infinity khi chờ lệnh ở chế độ thủ công). */
export function remaining(c: ControllerState): number {
  return Math.max(0, phaseDuration(c) - c.elapsed);
}

/** Tiến thời gian; trả về danh sách pha đã đi qua (để ghi nhật ký). */
export function tickController(c: ControllerState, dt: number): PhaseName[] {
  const entered: PhaseName[] = [];
  c.elapsed += dt;
  // thủ công: pha xanh giữ nguyên cho tới khi có yêu cầu
  if (c.mode === "manual" && c.phase.endsWith("GREEN") && c.switchRequested) {
    c.switchRequested = false;
    c.phase = NEXT_PHASE[c.phase];
    c.elapsed = 0;
    entered.push(c.phase);
  }
  let guard = 0;
  while (c.elapsed >= phaseDuration(c) && guard++ < 6) {
    c.elapsed -= phaseDuration(c);
    c.phase = NEXT_PHASE[c.phase];
    entered.push(c.phase);
  }
  return entered;
}

/**
 * Học sinh bấm "Chuyển đèn": chỉ có tác dụng khi một trục đang xanh.
 * Đèn không nhảy thẳng sang trục kia mà đi qua vàng → đỏ toàn phần (an toàn).
 */
export function requestSwitch(c: ControllerState): boolean {
  if (!c.phase.endsWith("GREEN")) return false;
  if (c.mode === "manual") c.switchRequested = true;
  else c.elapsed = Math.max(c.elapsed, phaseDuration(c));
  return true;
}

export function setMode(c: ControllerState, mode: ControlMode) {
  c.mode = mode;
  c.switchRequested = false;
  if (mode === "auto" && c.phase.endsWith("GREEN")) c.elapsed = Math.min(c.elapsed, c.timing.green);
}

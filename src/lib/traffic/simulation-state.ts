/**
 * SimulationState — trạng thái và luật chuyển động của xe trong giao lộ bốn hướng (thuần TypeScript, xác định).
 *
 * Hệ trục thế giới: x hướng Đông, z hướng Nam, giao lộ ở gốc tọa độ. Xe đi bên phải (như ở Việt Nam).
 * Mỗi xe chạy trên một làn thẳng; `s` là quãng đường đã đi tính từ điểm xuất phát.
 */
import { createController, lightFor, tickController, type Axis, type ControllerState, type LightColor, type PhaseName } from "./traffic-controller";

export type Approach = "N" | "S" | "E" | "W";
export const APPROACH_LABEL: Record<Approach, string> = { N: "từ phía Bắc", S: "từ phía Nam", E: "từ phía Đông", W: "từ phía Tây" };
export const AXIS_OF: Record<Approach, Axis> = { N: "NS", S: "NS", E: "EW", W: "EW" };

export const ROAD_HALF = 4; // nửa bề rộng đường (2 làn × 4)
export const LANE_OFFSET = 2; // tâm làn cách tim đường
export const STOP_LINE = 7; // vạch dừng cách tâm giao lộ (trước vạch qua đường)
export const ROUTE_HALF = 42; // xe xuất hiện/biến mất ở ±42
export const CAR_LENGTH = 3.2;
export const MIN_GAP = 1.6; // khoảng cách tối thiểu khi dừng sau xe khác
export const MAX_SPEED = 7; // đơn vị/giây
export const ACCEL = 3.2;
export const COMFORT_DECEL = 4.5;
export const MAX_DECEL = 9;

export type VehicleStatus = "cruising" | "braking" | "waiting" | "crossing" | "following";
export const STATUS_LABEL: Record<VehicleStatus, string> = {
  cruising: "Đang chạy",
  braking: "Giảm tốc trước vạch",
  waiting: "Dừng chờ đèn",
  crossing: "Đang qua giao lộ",
  following: "Giữ khoảng cách xe trước",
};

export interface Vehicle {
  id: string;
  name: string;
  color: string;
  approach: Approach;
  /** quãng đường đã đi trên làn (0 … 2·ROUTE_HALF) */
  s: number;
  speed: number;
  /** gia tốc của bước gần nhất (âm = đang phanh → đèn phanh sáng) */
  accel: number;
  status: VehicleStatus;
  /** đã cam kết đi qua khi đèn vàng (quá gần vạch để dừng an toàn) */
  committed: boolean;
  waitTime: number;
  trips: number;
}

export interface SimEvent {
  t: number;
  kind: "phase" | "stop" | "pass" | "violation" | "conflict";
  text: string;
}

export interface SimulationState {
  time: number;
  running: boolean;
  speedFactor: number;
  controller: ControllerState;
  vehicles: Vehicle[];
  stats: { passed: number; stopsAtRed: number; violations: number; conflicts: number; maxWait: number; yellowSeen: number; manualSwitches: number };
  log: SimEvent[];
}

const START_S: Record<Approach, number> = { N: 0, S: 6, E: 14, W: 22 };
export const CARS: { id: string; name: string; color: string; approach: Approach }[] = [
  { id: "car-n", name: "Xe đỏ", color: "#ef4444", approach: "N" },
  { id: "car-s", name: "Xe xanh dương", color: "#3b82f6", approach: "S" },
  { id: "car-e", name: "Xe vàng", color: "#f59e0b", approach: "E" },
  { id: "car-w", name: "Xe tím", color: "#8b5cf6", approach: "W" },
];

export function createSimulation(): SimulationState {
  return {
    time: 0,
    running: false,
    speedFactor: 1,
    controller: createController(),
    vehicles: CARS.map((c) => ({ ...c, s: START_S[c.approach], speed: MAX_SPEED * 0.8, accel: 0, status: "cruising", committed: false, waitTime: 0, trips: 0 })),
    stats: { passed: 0, stopsAtRed: 0, violations: 0, conflicts: 0, maxWait: 0, yellowSeen: 0, manualSwitches: 0 },
    log: [],
  };
}

/** Vị trí tâm vạch dừng tính theo s. */
export const STOP_S = ROUTE_HALF - STOP_LINE;
/** Mép xa của giao lộ (xe đã ra khỏi vùng xung đột). */
export const EXIT_BOX_S = ROUTE_HALF + ROAD_HALF;

/** Tọa độ thế giới (x, z) và góc quay (rad, quanh trục y) của xe. */
export function vehiclePose(v: Pick<Vehicle, "approach" | "s">): { x: number; z: number; rotY: number } {
  const d = v.s - ROUTE_HALF;
  switch (v.approach) {
    case "N": return { x: -LANE_OFFSET, z: d, rotY: 0 }; // đi về phía Nam (+z)
    case "S": return { x: LANE_OFFSET, z: -d, rotY: Math.PI };
    case "E": return { x: -d, z: -LANE_OFFSET, rotY: -Math.PI / 2 }; // đi về phía Tây (−x)
    case "W": return { x: d, z: LANE_OFFSET, rotY: Math.PI / 2 };
  }
}

/** Mũi xe tính theo s. */
const front = (v: Vehicle) => v.s + CAR_LENGTH / 2;
const rear = (v: Vehicle) => v.s - CAR_LENGTH / 2;
/** Xe đang chiếm vùng giao nhau. */
export const inBox = (v: Vehicle) => front(v) > ROUTE_HALF - ROAD_HALF && rear(v) < EXIT_BOX_S;

export function stoppingDistance(speed: number, decel: number) {
  return (speed * speed) / (2 * decel);
}

/**
 * Quyết định xe có được vượt vạch dừng không — đây chính là logic if/else học sinh sẽ tự viết sau này:
 *   if den == "green": đi
 *   elif den == "yellow" and khong_the_dung_an_toan: đi
 *   else: dừng trước vạch
 */
export function mayEnter(light: LightColor, distToStop: number, speed: number, committed: boolean): boolean {
  if (committed) return true;
  if (light === "green") return true;
  if (light === "yellow") return distToStop < stoppingDistance(speed, MAX_DECEL * 0.8);
  return false;
}

function log(st: SimulationState, kind: SimEvent["kind"], text: string) {
  st.log.push({ t: st.time, kind, text });
  if (st.log.length > 60) st.log.splice(0, st.log.length - 60);
}

/** Một bước mô phỏng cố định dt (giây). Hàm thay đổi trực tiếp `st` để chạy nhanh trong vòng lặp khung hình. */
export function stepSimulation(st: SimulationState, dt: number) {
  st.time += dt;
  for (const p of tickController(st.controller, dt)) {
    log(st, "phase", p.replace(/_/g, " "));
    if (p.endsWith("YELLOW")) st.stats.yellowSeen++;
  }
  const phase: PhaseName = st.controller.phase;

  for (const v of st.vehicles) {
    const light = lightFor(phase, AXIS_OF[v.approach]);
    const distToStop = STOP_S - front(v); // > 0: chưa tới vạch
    let limit = MAX_SPEED;
    let status: VehicleStatus = "cruising";

    // 1) Đèn: chỉ xét khi xe chưa vượt vạch dừng
    if (distToStop > -0.05) {
      const go = mayEnter(light, distToStop, v.speed, v.committed);
      if (light === "yellow" && go && !v.committed) v.committed = true;
      // an toàn: không vào giao lộ nếu xe trục kia còn đang trong vùng giao nhau
      const crossBusy = st.vehicles.some((o) => AXIS_OF[o.approach] !== AXIS_OF[v.approach] && inBox(o));
      if (!go || (crossBusy && distToStop > 0 && distToStop < 3)) {
        limit = Math.min(limit, Math.sqrt(2 * COMFORT_DECEL * Math.max(0, distToStop - 0.15)));
        status = v.speed < 0.05 && distToStop < 0.6 ? "waiting" : "braking";
      }
    } else {
      v.committed = false;
      if (inBox(v)) status = "crossing";
    }

    // 2) Giữ khoảng cách với xe phía trước cùng làn (vòng lặp nên xét cả xe ở đầu đường)
    for (const o of st.vehicles) {
      if (o === v || o.approach !== v.approach) continue;
      let gap = rear(o) - front(v);
      if (gap < -CAR_LENGTH) gap += 2 * ROUTE_HALF;
      if (gap >= 0 && gap < 18) {
        const free = Math.max(0, gap - MIN_GAP);
        const lim = Math.sqrt(2 * COMFORT_DECEL * free) + o.speed * 0.5;
        if (lim < limit) {
          limit = lim;
          if (status === "cruising") status = "following";
        }
      }
    }

    // 3) Động học: tăng tốc êm, phanh tối đa MAX_DECEL
    const target = Math.min(MAX_SPEED, limit);
    const before = v.speed;
    v.speed = target > v.speed ? Math.min(target, v.speed + ACCEL * dt) : Math.max(target, v.speed - MAX_DECEL * dt, 0);
    v.accel = (v.speed - before) / dt;
    const prevFront = front(v);
    const prevRear = rear(v);
    v.s += v.speed * dt;

    // 4) Ghi nhận sự kiện
    if (status === "waiting" && v.status !== "waiting") {
      st.stats.stopsAtRed++;
      log(st, "stop", `${v.name} dừng trước vạch (${light === "red" ? "đèn đỏ" : "đèn vàng"})`);
    }
    if (prevFront <= STOP_S && front(v) > STOP_S) {
      if (light === "red") {
        st.stats.violations++;
        log(st, "violation", `${v.name} vượt đèn đỏ!`);
      }
    }
    if (status === "waiting") {
      v.waitTime += dt;
      st.stats.maxWait = Math.max(st.stats.maxWait, v.waitTime);
    } else if (v.speed > 1) v.waitTime = 0;
    v.status = status;

    if (prevRear < EXIT_BOX_S && rear(v) >= EXIT_BOX_S) {
      st.stats.passed++;
      log(st, "pass", `${v.name} đã qua giao lộ`);
    }
    // 5) Ra khỏi bản đồ → xuất hiện lại ở đầu làn
    if (v.s > 2 * ROUTE_HALF) {
      v.s -= 2 * ROUTE_HALF;
      v.trips++;
    }
  }

  // 6) Kiểm tra xung đột: hai xe khác trục cùng ở trong giao lộ và chồng lên nhau
  const boxed = st.vehicles.filter(inBox);
  for (let i = 0; i < boxed.length; i++)
    for (let k = i + 1; k < boxed.length; k++) {
      const a = boxed[i], b = boxed[k];
      if (AXIS_OF[a.approach] === AXIS_OF[b.approach]) continue;
      const pa = vehiclePose(a), pb = vehiclePose(b);
      if (Math.abs(pa.x - pb.x) < 2.2 && Math.abs(pa.z - pb.z) < 2.2) {
        st.stats.conflicts++;
        log(st, "conflict", `Xung đột giữa ${a.name} và ${b.name}`);
      }
    }
}

export function snapshot(st: SimulationState, remainingTime: number): SimSnapshot {
  return {
    time: st.time,
    running: st.running,
    speedFactor: st.speedFactor,
    phase: st.controller.phase,
    remaining: remainingTime,
    mode: st.controller.mode,
    vehicles: st.vehicles.map((v) => ({ id: v.id, name: v.name, color: v.color, approach: v.approach, speed: v.speed, status: v.status, waitTime: v.waitTime })),
    stats: { ...st.stats },
    log: st.log.slice(-6).reverse(),
  };
}

/** Snapshot nhẹ để hiển thị trên bảng điều khiển React (không gửi object đang bị thay đổi). */
export interface SimSnapshot {
  time: number;
  running: boolean;
  speedFactor: number;
  phase: PhaseName;
  remaining: number;
  mode: ControllerState["mode"];
  vehicles: Pick<Vehicle, "id" | "name" | "color" | "approach" | "speed" | "status" | "waitTime">[];
  stats: SimulationState["stats"];
  log: SimEvent[];
}

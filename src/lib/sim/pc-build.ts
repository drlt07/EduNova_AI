/**
 * Bên trong máy tính (Tin 11 – Bài 4, KNTT): logic thuần cho nhiệm vụ lắp máy, đường đi dữ liệu và chẩn đoán sự cố.
 * Không phụ thuộc React/Three để kiểm thử bằng Vitest; cảnh 3D chỉ hiển thị trạng thái này.
 */

export type PartId = "motherboard" | "cpu" | "cooler" | "ram" | "gpu" | "ssd" | "psu";
export type SlotId = "standoffs" | "socket" | "cooler-mount" | "dimm" | "pcie" | "m2" | "psu-bay";

export interface PartInfo {
  id: PartId;
  name: string;
  /** Vai trò trong máy, viết cho học sinh */
  role: string;
  slot: SlotId;
  /** Phải lắp linh kiện này trước */
  requires?: PartId;
}

export const PARTS: PartInfo[] = [
  { id: "psu", name: "Bộ nguồn (PSU)", role: "Đổi điện xoay chiều 220V thành điện một chiều điện áp thấp cấp cho các linh kiện.", slot: "psu-bay" },
  { id: "motherboard", name: "Bo mạch chủ", role: "Tấm mạch nối mọi linh kiện với nhau, truyền dữ liệu và điện giữa chúng.", slot: "standoffs" },
  { id: "cpu", name: "CPU (bộ xử lý trung tâm)", role: "Thực hiện các lệnh của chương trình: tính toán, so sánh, điều khiển.", slot: "socket", requires: "motherboard" },
  { id: "cooler", name: "Tản nhiệt CPU", role: "Hút nhiệt từ CPU và thổi ra ngoài; thiếu nó CPU quá nóng và máy tự tắt.", slot: "cooler-mount", requires: "cpu" },
  { id: "ram", name: "RAM (bộ nhớ trong)", role: "Chứa chương trình và dữ liệu đang dùng để CPU đọc nhanh; mất điện là mất nội dung.", slot: "dimm", requires: "motherboard" },
  { id: "ssd", name: "Ổ SSD (bộ nhớ ngoài)", role: "Lưu hệ điều hành, phần mềm và tệp lâu dài; tắt máy vẫn còn dữ liệu.", slot: "m2", requires: "motherboard" },
  { id: "gpu", name: "Card đồ họa (GPU)", role: "Xử lý hình ảnh và xuất tín hiệu ra màn hình.", slot: "pcie", requires: "motherboard" },
];

export const SLOT_LABEL: Record<SlotId, string> = {
  standoffs: "Chân đế bo mạch trong thùng máy",
  socket: "Đế cắm CPU (socket)",
  "cooler-mount": "Giá bắt tản nhiệt trên CPU",
  dimm: "Khe RAM (DIMM)",
  pcie: "Khe mở rộng PCIe x16",
  m2: "Khe M.2 cho ổ SSD",
  "psu-bay": "Khoang bộ nguồn",
};

/** Lời giải thích khi đặt nhầm: vì sao khe này không dành cho linh kiện đó. */
const WRONG_HINT: Partial<Record<SlotId, string>> = {
  socket: "Đế cắm CPU là ô vuông có nhiều chân tiếp xúc, chỉ vừa con chip CPU.",
  "cooler-mount": "Giá tản nhiệt nằm ngay trên CPU.",
  dimm: "Khe RAM là hai rãnh dài, mảnh, có lẫy gài hai đầu, chỉ vừa thanh RAM.",
  pcie: "Khe PCIe x16 dài, nằm ngang dưới CPU, dành cho card đồ họa.",
  m2: "Khe M.2 nhỏ, nằm ngang, có ốc giữ ở đầu, dành cho ổ SSD dạng thẻ.",
  "psu-bay": "Khoang dưới đáy thùng máy dành cho bộ nguồn.",
  standoffs: "Chân đế ở mặt sau thùng máy giữ bo mạch chủ.",
};

export const getPart = (id: PartId) => PARTS.find((p) => p.id === id)!;

export interface BuildState {
  placed: PartId[];
  mistakes: number;
}

export const newBuild = (): BuildState => ({ placed: [], mistakes: 0 });

export interface PlaceResult {
  ok: boolean;
  state: BuildState;
  message: string;
}

/** Lắp một linh kiện vào một khe; sai khe hoặc sai thứ tự thì không lắp và giải thích lý do. */
export function placePart(state: BuildState, part: PartId, slot: SlotId): PlaceResult {
  const info = getPart(part);
  if (state.placed.includes(part)) return { ok: false, state, message: `${info.name} đã được lắp rồi.` };
  if (info.slot !== slot) {
    return { ok: false, state: { ...state, mistakes: state.mistakes + 1 }, message: `${info.name} không lắp vào ${SLOT_LABEL[slot].toLowerCase()}. ${WRONG_HINT[slot] ?? ""}`.trim() };
  }
  if (info.requires && !state.placed.includes(info.requires)) {
    return { ok: false, state: { ...state, mistakes: state.mistakes + 1 }, message: `Cần lắp ${getPart(info.requires).name.toLowerCase()} trước ${info.name.toLowerCase()}.` };
  }
  return { ok: true, state: { ...state, placed: [...state.placed, part] }, message: `Đã lắp ${info.name}. ${info.role}` };
}

export interface PostStep {
  label: string;
  ok: boolean;
  detail: string;
}

/** Bật nguồn: kiểm tra khởi động (POST) theo đúng thứ tự máy thật, dừng ở bước hỏng đầu tiên. */
export function powerOn(state: BuildState): { booted: boolean; steps: PostStep[]; screen: string } {
  const has = (p: PartId) => state.placed.includes(p);
  const checks: [PartId, string, string, string][] = [
    ["psu", "Cấp điện", "Bộ nguồn cấp điện cho bo mạch.", "Không có bộ nguồn: máy không có điện, quạt không quay, không có đèn."],
    ["motherboard", "Bo mạch chủ", "Bo mạch nhận điện và bắt đầu kiểm tra.", "Không có bo mạch chủ thì không có gì nối các linh kiện lại với nhau."],
    ["cpu", "CPU", "CPU chạy chương trình khởi động trong ROM của bo mạch.", "Không có CPU: không ai thực hiện lệnh, màn hình đen."],
    ["cooler", "Tản nhiệt", "Nhiệt độ CPU ổn định.", "CPU nóng lên rất nhanh, máy tự tắt sau vài giây để bảo vệ."],
    ["ram", "RAM", "Kiểm tra bộ nhớ trong: đạt.", "Thiếu RAM: máy kêu bíp liên tục và không lên hình, vì CPU không có chỗ chứa chương trình đang chạy."],
    ["gpu", "Hình ảnh", "Có tín hiệu ra màn hình.", "Không có card đồ họa: máy chạy nhưng màn hình báo 'No signal'."],
    ["ssd", "Bộ nhớ ngoài", "Tìm thấy hệ điều hành trên SSD, nạp vào RAM.", "Màn hình báo 'Không tìm thấy thiết bị khởi động': chưa có nơi lưu hệ điều hành."],
  ];
  const steps: PostStep[] = [];
  for (const [p, label, okText, failText] of checks) {
    if (has(p)) steps.push({ label, ok: true, detail: okText });
    else {
      steps.push({ label, ok: false, detail: failText });
      return { booted: false, steps, screen: p === "ssd" ? "No bootable device" : p === "gpu" ? "No signal" : "" };
    }
  }
  return { booted: true, steps, screen: "Đang khởi động hệ điều hành…" };
}

/** Nhiệm vụ 2: thứ tự dữ liệu đi qua khi mở một tệp ảnh và xem trên màn hình. */
export const DATA_PATH = ["ssd", "ram", "cpu", "gpu", "monitor"] as const;
export type DataNode = (typeof DATA_PATH)[number];
export const DATA_NODE_LABEL: Record<DataNode, string> = { ssd: "Ổ SSD", ram: "RAM", cpu: "CPU", gpu: "Card đồ họa", monitor: "Màn hình" };
export const DATA_STEP_WHY: Record<DataNode, string> = {
  ssd: "Tệp ảnh nằm trên SSD (bộ nhớ ngoài).",
  ram: "Hệ điều hành nạp tệp từ SSD vào RAM, vì CPU chỉ làm việc trực tiếp với dữ liệu trong RAM.",
  cpu: "CPU đọc dữ liệu trong RAM và giải mã ảnh.",
  gpu: "Card đồ họa dựng khung hình.",
  monitor: "Màn hình hiển thị khung hình.",
};

/** Kiểm tra bước tiếp theo học sinh chọn trên đường đi dữ liệu. */
export function nextDataStep(chosen: DataNode[], pick: DataNode): { ok: boolean; done: boolean; message: string } {
  const expected = DATA_PATH[chosen.length];
  if (pick !== expected) {
    const hint = chosen.length === 0 ? "Dữ liệu bắt đầu ở nơi tệp được lưu lâu dài." : chosen[chosen.length - 1] === "ssd" ? "CPU không đọc trực tiếp từ SSD; dữ liệu phải được nạp vào đâu trước?" : "Nghĩ xem linh kiện nào xử lý tiếp theo.";
    return { ok: false, done: false, message: `Chưa đúng. ${hint}` };
  }
  return { ok: true, done: chosen.length + 1 === DATA_PATH.length, message: DATA_STEP_WHY[pick] };
}

export interface FaultCase {
  id: string;
  symptom: string;
  answer: PartId;
  explain: string;
}

/** Nhiệm vụ 3: chẩn đoán sự cố — chọn linh kiện gây ra triệu chứng. */
export const FAULTS: FaultCase[] = [
  { id: "slow", symptom: "Mở nhiều tab trình duyệt thì máy chậm hẳn, đèn ổ đĩa nháy liên tục.", answer: "ram", explain: "RAM đầy nên hệ điều hành phải tạm chuyển dữ liệu sang ổ đĩa (chậm hơn RAM rất nhiều). Nâng cấp thêm RAM." },
  { id: "shutdown", symptom: "Chơi game được vài phút thì máy tự tắt; sờ thùng máy thấy rất nóng, quạt CPU không quay.", answer: "cooler", explain: "Tản nhiệt hỏng nên CPU quá nhiệt, máy tự tắt để bảo vệ. Thay quạt / tản nhiệt CPU." },
  { id: "lost", symptom: "Mất điện đột ngột: bài đang gõ chưa lưu thì mất, nhưng các tệp đã lưu hôm trước vẫn còn.", answer: "ram", explain: "Bài chưa lưu chỉ nằm trong RAM (mất khi mất điện); tệp đã lưu nằm trên SSD (giữ được khi tắt máy)." },
  { id: "nosignal", symptom: "Máy bật, quạt quay, nhưng màn hình báo 'No signal'.", answer: "gpu", explain: "Không có tín hiệu hình: kiểm tra card đồ họa và dây nối màn hình." },
  { id: "noboot", symptom: "Màn hình hiện 'No bootable device' ngay khi bật máy.", answer: "ssd", explain: "Máy không tìm thấy ổ chứa hệ điều hành: ổ SSD lỏng hoặc hỏng." },
];

/** Điểm sao theo số lần sai của cả ba nhiệm vụ. */
export function stars(mistakes: number): 1 | 2 | 3 {
  return mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
}

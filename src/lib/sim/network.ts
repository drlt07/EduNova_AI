/**
 * Hành trình gói tin (Tin 12 – Bài 3, 4 KNTT: thiết bị mạng, giao thức): logic thuần cho ba nhiệm vụ
 * — đấu nối mạng, dự đoán đường đi gói tin qua switch/router, chẩn đoán sự cố bằng ping.
 * Mức khái niệm: một mạng LAN /24, một router có cổng mặc định ra Internet, một máy chủ web.
 */

export type DeviceId = "pc1" | "pc2" | "printer" | "switch" | "router" | "internet" | "server";
export type DeviceKind = "pc" | "printer" | "switch" | "router" | "internet" | "server";

export interface Device {
  id: DeviceId;
  name: string;
  kind: DeviceKind;
  ip?: string;
  mac?: string;
  /** Vị trí trên sơ đồ (đơn vị SVG) */
  x: number;
  y: number;
  role: string;
}

export const DEVICES: Device[] = [
  { id: "pc1", name: "Máy An", kind: "pc", ip: "192.168.1.11", mac: "AA:11", x: 110, y: 120, role: "Máy tính trong phòng Tin." },
  { id: "pc2", name: "Máy Bình", kind: "pc", ip: "192.168.1.12", mac: "BB:22", x: 110, y: 300, role: "Máy tính trong phòng Tin." },
  { id: "printer", name: "Máy in", kind: "printer", ip: "192.168.1.50", mac: "CC:33", x: 110, y: 470, role: "Máy in dùng chung trong mạng LAN." },
  { id: "switch", name: "Switch", kind: "switch", x: 330, y: 300, role: "Nối các thiết bị trong cùng mạng LAN; chuyển khung tin đúng cổng nhờ bảng địa chỉ MAC." },
  { id: "router", name: "Router", kind: "router", ip: "192.168.1.1", mac: "RR:01", x: 540, y: 300, role: "Nối mạng LAN với mạng khác (Internet); chọn đường đi cho gói tin theo địa chỉ IP." },
  { id: "internet", name: "Internet", kind: "internet", x: 740, y: 300, role: "Mạng của các nhà cung cấp dịch vụ, nối tới máy chủ ở xa." },
  { id: "server", name: "Máy chủ edunova.vn", kind: "server", ip: "203.0.113.10", x: 900, y: 300, role: "Máy chủ web ở ngoài mạng của trường." },
];

export const getDevice = (id: DeviceId) => DEVICES.find((d) => d.id === id)!;
export const LAN_PREFIX = "192.168.1.";
export const GATEWAY = "192.168.1.1";

export type Link = readonly [DeviceId, DeviceId];
const key = (a: DeviceId, b: DeviceId) => [a, b].sort().join("-");

/** Các dây cần nối để cả phòng dùng được máy in và vào Internet. Internet–máy chủ có sẵn (ngoài trường). */
export const REQUIRED_LINKS: Link[] = [["pc1", "switch"], ["pc2", "switch"], ["printer", "switch"], ["switch", "router"], ["router", "internet"]];
export const PRESET_LINKS: Link[] = [["internet", "server"]];

/** Kiểm tra một dây học sinh định nối. */
export function checkLink(links: Link[], a: DeviceId, b: DeviceId): { ok: boolean; message: string } {
  if (a === b) return { ok: false, message: "Hãy chọn hai thiết bị khác nhau." };
  const k = key(a, b);
  if ([...links, ...PRESET_LINKS].some(([x, y]) => key(x, y) === k)) return { ok: false, message: "Hai thiết bị này đã được nối." };
  if (REQUIRED_LINKS.some(([x, y]) => key(x, y) === k)) {
    const da = getDevice(a), db = getDevice(b);
    const sw = [da, db].find((d) => d.kind === "switch");
    const end = [da, db].find((d) => d.kind !== "switch");
    if (sw && end) return { ok: true, message: `Đã nối ${end.name} vào switch. ${end.kind === "router" ? "Router là cửa ngõ để các máy trong LAN đi ra mạng khác." : "Switch cho các thiết bị trong phòng nói chuyện với nhau."}` };
    return { ok: true, message: "Đã nối router ra Internet (qua modem của nhà mạng). Đây là cổng WAN của router." };
  }
  const kinds = [getDevice(a).kind, getDevice(b).kind].sort().join("+");
  const why: Record<string, string> = {
    "pc+pc": "Nối thẳng hai máy chỉ dùng được cho hai máy đó. Để nhiều thiết bị cùng dùng mạng, hãy nối từng máy vào switch.",
    "pc+printer": "Máy in cần dùng chung cho cả phòng, hãy nối máy in vào switch.",
    "pc+router": "Router chỉ có vài cổng LAN; trong phòng nhiều máy, các máy nối vào switch, switch nối lên router.",
    "printer+router": "Máy in là thiết bị trong LAN, hãy nối vào switch.",
    "internet+switch": "Switch chỉ nối các thiết bị trong cùng mạng LAN; muốn ra Internet phải đi qua router.",
    "internet+pc": "Máy tính không nối thẳng Internet trong mạng trường; mọi máy đi ra ngoài qua router.",
    "internet+printer": "Máy in không cần và không nên nối thẳng ra Internet.",
  };
  return { ok: false, message: why[kinds] ?? "Cách nối này không dùng trong mạng của trường. Máy trong phòng → switch → router → Internet." };
}

export function missingLinks(links: Link[]): Link[] {
  const have = new Set(links.map(([a, b]) => key(a, b)));
  return REQUIRED_LINKS.filter(([a, b]) => !have.has(key(a, b)));
}

// ---------- Nhiệm vụ 2: đường đi gói tin ----------

export interface PathTask {
  id: string;
  from: DeviceId;
  to: DeviceId;
  title: string;
  hops: DeviceId[];
  /** Giải thích tại mỗi chặng (theo thứ tự hops, bỏ chặng đầu) */
  why: Partial<Record<DeviceId, string>>;
}

export const PATH_TASKS: PathTask[] = [
  {
    id: "print",
    from: "pc1",
    to: "printer",
    title: "Máy An in bài tập ra máy in",
    hops: ["pc1", "switch", "printer"],
    why: {
      switch: "IP đích 192.168.1.50 cùng mạng 192.168.1.x với máy An, nên gói tin chỉ đi trong LAN: gửi tới switch.",
      printer: "Switch tra bảng MAC, thấy máy in ở cổng nào thì chuyển đúng cổng đó. Không cần router.",
    },
  },
  {
    id: "web",
    from: "pc2",
    to: "server",
    title: "Máy Bình mở trang edunova.vn (203.0.113.10)",
    hops: ["pc2", "switch", "router", "internet", "server"],
    why: {
      switch: "IP đích 203.0.113.10 KHÁC mạng 192.168.1.x, nên máy Bình gửi gói tin cho cổng mặc định (router 192.168.1.1) — trước hết qua switch.",
      router: "Switch chuyển khung tin tới cổng nối router.",
      internet: "Router tra bảng định tuyến: đích không thuộc LAN → đi theo tuyến mặc định ra cổng WAN. TTL giảm 1.",
      server: "Các router của nhà mạng tiếp tục chuyển gói tin tới máy chủ. Máy chủ trả lời theo đường ngược lại.",
    },
  },
];

export function checkHop(task: PathTask, chosen: DeviceId[], pick: DeviceId): { ok: boolean; done: boolean; message: string } {
  const expected = task.hops[chosen.length];
  if (pick === expected) return { ok: true, done: chosen.length + 1 === task.hops.length, message: chosen.length === 0 ? `Gói tin xuất phát từ ${getDevice(pick).name}.` : (task.why[pick] ?? "") };
  if (chosen.length === 0) return { ok: false, done: false, message: `Gói tin xuất phát từ máy gửi: ${getDevice(task.from).name}.` };
  const last = chosen[chosen.length - 1];
  if (pick === "router" && task.id === "print") return { ok: false, done: false, message: "Máy in cùng mạng 192.168.1.x nên không cần đi qua router." };
  if (last !== "switch" && getDevice(last).kind === "pc") return { ok: false, done: false, message: "Mọi máy trong phòng đều nối vào switch; gói tin rời máy tính sẽ tới switch trước." };
  if (pick === "internet" && last === "switch") return { ok: false, done: false, message: "Switch không nối ra Internet; muốn ra ngoài phải qua router." };
  return { ok: false, done: false, message: "Chưa đúng chặng tiếp theo. Xem lại IP đích có cùng mạng 192.168.1.x không." };
}

/** Bảng MAC của switch sau khi chuyển các gói tin: học MAC nguồn theo cổng (mức khái niệm). */
export function macTable(sentFrom: DeviceId[]): { mac: string; device: string; port: number }[] {
  const ports: Partial<Record<DeviceId, number>> = { pc1: 1, pc2: 2, printer: 3, router: 8 };
  const seen = new Set<DeviceId>();
  const out: { mac: string; device: string; port: number }[] = [];
  for (const d of sentFrom) {
    if (seen.has(d) || !ports[d]) continue;
    seen.add(d);
    out.push({ mac: getDevice(d).mac!, device: getDevice(d).name, port: ports[d]! });
  }
  return out;
}

export const ROUTING_TABLE = [
  { dest: "192.168.1.0/24", via: "Gửi thẳng trong LAN (cổng LAN)" },
  { dest: "0.0.0.0/0 (mặc định)", via: "Ra cổng WAN → nhà mạng" },
];

// ---------- Nhiệm vụ 3: chẩn đoán bằng ping ----------

export type FaultKind = "none" | "pc1-cable" | "pc2-gateway" | "wan-down" | "ip-conflict";

export interface Network {
  fault: FaultKind;
}

/** Cấu hình IP của máy (hiện trong công cụ ipconfig). */
export function ipConfig(net: Network, id: "pc1" | "pc2"): { ip: string; gateway: string } {
  const d = getDevice(id);
  if (id === "pc2" && net.fault === "pc2-gateway") return { ip: d.ip!, gateway: "192.168.1.254" };
  if (id === "pc2" && net.fault === "ip-conflict") return { ip: "192.168.1.11", gateway: GATEWAY };
  return { ip: d.ip!, gateway: GATEWAY };
}

/** Kết quả lệnh ping từ một máy tới một đích, tính theo sự cố đang có. */
export function ping(net: Network, from: "pc1" | "pc2", to: DeviceId): { ok: boolean; output: string } {
  const target = getDevice(to);
  const ip = target.ip ?? target.name;
  const fail = (msg: string) => ({ ok: false, output: `Ping ${ip}: ${msg}` });
  const reply = (ms: number) => ({ ok: true, output: `Ping ${ip}: Trả lời từ ${ip}, thời gian ${ms}ms, TTL=${to === "server" ? 52 : 64}` });
  if (from === to) return reply(1);
  if (net.fault === "pc1-cable" && (from === "pc1" || to === "pc1")) return fail(from === "pc1" ? "Lỗi chung — card mạng không có kết nối (Media disconnected)." : "Hết thời gian chờ (Request timed out).");
  if (net.fault === "ip-conflict" && (to === "pc1" || from === "pc2" || from === "pc1")) {
    if (from === "pc1" || from === "pc2") return { ok: false, output: `Ping ${ip}: Cảnh báo: địa chỉ IP 192.168.1.11 đang bị trùng với một thiết bị khác trong mạng. Kết nối chập chờn.` };
  }
  const outside = to === "server" || to === "internet";
  if (outside) {
    if (from === "pc2" && net.fault === "pc2-gateway") return fail("Không tới được máy đích (Destination host unreachable).");
    if (net.fault === "wan-down") return fail("Hết thời gian chờ (Request timed out).");
    return reply(to === "server" ? 24 : 12);
  }
  return reply(2);
}

export interface FaultCase {
  id: string;
  fault: Exclude<FaultKind, "none">;
  from: "pc1" | "pc2";
  symptom: string;
  options: string[];
  answer: number;
  explain: string;
}

export const NET_FAULTS: FaultCase[] = [
  {
    id: "gateway",
    fault: "pc2-gateway",
    from: "pc2",
    symptom: "Bình in được ra máy in nhưng không mở được trang web nào.",
    options: ["Dây mạng của máy Bình bị hỏng", "Máy Bình khai sai cổng mặc định (default gateway)", "Máy chủ web bị tắt", "Switch bị hỏng"],
    answer: 1,
    explain: "Ping máy in được → dây và switch vẫn tốt. Ping ra ngoài báo không tới được, ipconfig cho thấy cổng mặc định là 192.168.1.254 trong khi router là 192.168.1.1. Sửa lại default gateway.",
  },
  {
    id: "wan",
    fault: "wan-down",
    from: "pc1",
    symptom: "Cả phòng Tin không vào được Internet, nhưng vẫn in và chia sẻ tệp với nhau bình thường.",
    options: ["Một máy tính bị nhiễm virus", "Kết nối từ router ra nhà mạng (WAN) bị đứt", "Máy in làm nghẽn mạng", "Các máy khai sai địa chỉ IP"],
    answer: 1,
    explain: "Trong LAN vẫn ping được nhau, mọi máy cùng mất Internet → lỗi nằm ở điểm chung đi ra ngoài: router hoặc đường WAN của nhà mạng.",
  },
  {
    id: "cable",
    fault: "pc1-cable",
    from: "pc1",
    symptom: "Máy An không ping được bất kỳ thiết bị nào, đèn ở cổng 1 của switch tắt.",
    options: ["Dây mạng từ máy An tới switch bị lỏng/hỏng", "Router bị hỏng", "Máy chủ web quá tải", "Máy in hết giấy"],
    answer: 0,
    explain: "Ping báo card mạng không có kết nối và đèn cổng switch tắt → hỏng ở tầng vật lý: dây hoặc đầu cắm của máy An.",
  },
  {
    id: "conflict",
    fault: "ip-conflict",
    from: "pc2",
    symptom: "Máy An và máy Bình lúc vào mạng được lúc không, Windows báo xung đột địa chỉ IP.",
    options: ["Hai máy đang dùng cùng một địa chỉ IP", "Router hết cổng", "Switch không học được MAC", "Thiếu dây Internet"],
    answer: 0,
    explain: "ipconfig cho thấy máy Bình đặt IP 192.168.1.11 trùng máy An. Mỗi thiết bị trong một mạng phải có IP riêng (hoặc để router cấp tự động qua DHCP).",
  },
];

export function stars(mistakes: number): 1 | 2 | 3 {
  return mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
}

/**
 * Thang câu hỏi gợi mở cho AI Gia sư khi học sinh làm mô phỏng: đọc TRẠNG THÁI THẬT (em đã chạy lệnh gì, kết quả ra sao,
 * đang chọn gì) và trả về các câu hỏi từ rộng tới hẹp. Không câu nào nói đáp án hay cách sửa — em tự rút ra.
 * Gia sư hỏi câu thứ n khi em đã nhận n gợi ý (dừng ở câu cuối).
 */
import { GATEWAY, LAN_PREFIX, getDevice, ipConfig, type DeviceId, type FaultCase, type PathTask } from "@/lib/sim/network";

export interface PingRun { target: DeviceId | "ipconfig"; ok: boolean }

const inLan = (id: DeviceId) => !!getDevice(id).ip?.startsWith(LAN_PREFIX);

/** Chẩn đoán sự cố mạng bằng ping: câu hỏi dựa trên các lệnh em đã chạy và lựa chọn hiện tại. */
export function faultLadder(fc: FaultCase, runs: PingRun[], chosen?: number): string[] {
  const me = getDevice(fc.from).name;
  const lan = runs.filter((r) => r.target !== "ipconfig" && r.target !== "server" && r.target !== "internet");
  const out = runs.filter((r) => r.target === "server" || r.target === "internet");
  const ipc = runs.some((r) => r.target === "ipconfig");
  const cfg = ipConfig({ fault: fc.fault }, fc.from);
  const ladder: string[] = [];

  if (chosen !== undefined && chosen !== fc.answer)
    ladder.push(`Em đang nghiêng về “${fc.options[chosen]}”. Nếu đúng là vậy thì ping tới máy in (cùng mạng LAN) sẽ ra sao? Kết quả em chạy có khớp không?`);

  if (!lan.length) {
    ladder.push(`Trước khi đoán, em thử ping từ ${me} tới một thiết bị trong cùng mạng LAN, ví dụ máy in, xem có trả lời không?`);
    ladder.push("Ping trong LAN mà thông thì dây mạng, card mạng và switch của máy này đang thế nào?");
    return ladder;
  }
  if (lan.every((r) => !r.ok)) {
    ladder.push(`${me} không ping được cả máy trong cùng phòng. Gói tin có rời được khỏi máy không? Lời báo “Media disconnected” nói gì về card mạng?`);
    ladder.push("Nếu card mạng không có kết nối thì em sẽ kiểm tra thứ gì nằm giữa máy tính và switch?");
    return ladder;
  }
  if (!out.length) {
    ladder.push("Trong LAN đã thông rồi. Em thử ping ra máy chủ ở ngoài Internet chưa?");
    ladder.push("Nếu trong LAN thông mà ra ngoài không được thì chặng hỏng nằm trong hay ngoài phòng máy?");
    return ladder;
  }
  if (out.every((r) => !r.ok)) {
    if (fc.fault === "pc2-gateway") {
      ladder.push(`Trong LAN thông mà ra ngoài thì không. Gói tin muốn ra Internet phải gửi tới thiết bị nào trước?`);
      ladder.push(ipc
        ? `ipconfig cho thấy cổng mặc định (gateway) của ${me} là ${cfg.gateway}. Router của mạng này có địa chỉ IP bao nhiêu? Hai địa chỉ đó đã trùng nhau chưa?`
        : `Em chạy ipconfig trên ${me} chưa? Xem máy đang khai cổng mặc định (gateway) là gì.`);
      ladder.push(`Router ở đây là ${getDevice("router").ip}. Máy gửi gói tin ra ngoài tới đúng địa chỉ đó chưa?`);
    } else {
      ladder.push("Các máy trong phòng vẫn ping được nhau nhưng không ra được Internet. Mọi máy cùng phải đi qua điểm nào để ra ngoài?");
      ladder.push(`Gateway ${GATEWAY} vẫn đúng. Vậy đoạn từ router đi ra nhà mạng có còn thông không?`);
    }
    return ladder;
  }
  if (fc.fault === "ip-conflict")
    ladder.push(ipc ? `IP của ${me} là ${cfg.ip}. So với IP của máy An thì sao? Một mạng có cho hai máy dùng chung địa chỉ không?` : `Em xem IP của ${me} bằng ipconfig chưa? So với IP của máy An xem.`);
  else ladder.push("Các lệnh em chạy đều trả lời được. Em đọc lại hiện tượng trong đề: lúc nào thì lỗi xảy ra?");
  return ladder;
}

/** Chỉ đường đi gói tin: câu hỏi theo chặng hiện tại và chặng em vừa chọn sai. */
export function pathLadder(task: PathTask, hops: DeviceId[], wrong?: DeviceId): string[] {
  const from = getDevice(task.from), to = getDevice(task.to);
  if (!hops.length) return [`Gói tin bắt đầu từ đâu? Ai là người gửi trong tình huống “${task.title}”?`];
  const at = getDevice(hops[hops.length - 1]);
  const ladder: string[] = [];
  if (wrong) ladder.push(`Em vừa chọn ${getDevice(wrong).name}. Trên sơ đồ, ${at.name} có nối trực tiếp với ${getDevice(wrong).name} không?`);
  ladder.push(`Gói tin đang ở ${at.name}. Địa chỉ đích ${to.ip ?? to.name} có cùng mạng ${LAN_PREFIX}x với ${from.name} (${from.ip}) không?`);
  ladder.push(inLan(task.to)
    ? "Cùng một mạng LAN thì gói tin có cần đi qua router không, hay chỉ qua thiết bị nối các máy trong phòng?"
    : "Muốn ra khỏi mạng LAN, gói tin phải gửi tới cổng mặc định nào trước?");
  ladder.push(`Từ ${at.name}, những thiết bị nào nối trực tiếp với nó? Chặng tiếp theo phải là một trong số đó.`);
  return ladder;
}

/** Xây mạng trường học: hỏi về nhu cầu của từng khu vực thay vì nói thiết bị cần đặt. */
const GEAR_NAME: Record<string, string> = { switch: "switch", router: "router", ap: "access point", modem: "modem" };
export function buildLadder(n: Partial<Record<"lab" | "lib" | "office" | "core" | "edge", string>>): string[] {
  const out: string[] = [];
  if (n.lab !== "switch") out.push(n.lab ? `Phòng máy có 6 máy bàn nối dây. Thiết bị em đặt (${GEAR_NAME[n.lab] ?? n.lab}) có đủ cổng cắm dây cho cả 6 máy không?` : "Phòng máy có 6 máy bàn dùng dây mạng. Chúng cần cắm chung vào thiết bị nào để thành một mạng?");
  if (n.lib !== "ap") out.push("Laptop ở thư viện kết nối bằng dây hay không dây? Thiết bị nào phát sóng cho chúng?");
  if (n.office !== "switch") out.push("Văn phòng có máy tính và máy in dùng dây. Chúng cắm vào đâu để nói chuyện được với nhau?");
  if (n.core !== "router") out.push("Ba phòng đang là ba mạng riêng. Thiết bị nào nối các mạng với nhau và chọn đường cho gói tin?");
  if (n.core === "router" && n.edge !== "modem") out.push("Mạng của trường đã nối với nhau. Để ra được Internet, tín hiệu phải đi qua đường truyền của nhà mạng bằng thiết bị nào?");
  if (!out.length) out.push("Mạng đã thông. Nếu thư viện thêm 30 laptop thì em cần lo thêm điều gì?");
  return out;
}

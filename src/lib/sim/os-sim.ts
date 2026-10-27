/**
 * Khám phá hệ điều hành (Tin 11 – Bài 1, 2 KNTT): logic thuần cho ba nhiệm vụ
 * — quản lí tệp và thư mục, quản lí tiến trình và bộ nhớ, nhận diện chức năng của hệ điều hành.
 */

// ---------- Nhiệm vụ 1: tệp và thư mục ----------

export interface FsNode {
  id: string;
  name: string;
  kind: "folder" | "file";
  parent: string | null;
  /** Thư mục gốc trước khi bị xóa (để khôi phục từ Thùng rác) */
  trashedFrom?: string;
  /** Đã từng được khôi phục từ Thùng rác */
  restored?: boolean;
}

export const ROOT = "c";
export const TRASH = "trash";

export const INITIAL_FS: FsNode[] = [
  { id: ROOT, name: "Ổ C:", kind: "folder", parent: null },
  { id: "users", name: "Users", kind: "folder", parent: ROOT },
  { id: "an", name: "An", kind: "folder", parent: "users" },
  { id: "docs", name: "Documents", kind: "folder", parent: "an" },
  { id: "down", name: "Downloads", kind: "folder", parent: "an" },
  { id: "windows", name: "Windows", kind: "folder", parent: ROOT },
  { id: "f-bai", name: "baitap.py", kind: "file", parent: "down" },
  { id: "f-anh", name: "anh-lop.jpg", kind: "file", parent: "down" },
  { id: "f-cu", name: "nhap-cu.txt", kind: "file", parent: "docs" },
  { id: "f-van", name: "van-ban.docx", kind: "file", parent: "docs" },
  { id: "f-sys", name: "kernel32.dll", kind: "file", parent: "windows" },
  { id: TRASH, name: "Thùng rác", kind: "folder", parent: null },
];

export const nodeById = (fs: FsNode[], id: string) => fs.find((n) => n.id === id);
export const children = (fs: FsNode[], id: string) =>
  fs.filter((n) => n.parent === id).sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));

/** Đường dẫn kiểu Windows, vd C:\Users\An\Documents\Tin11\baitap.py */
export function pathOf(fs: FsNode[], id: string): string {
  const parts: string[] = [];
  let cur = nodeById(fs, id);
  while (cur) {
    if (cur.id === TRASH) return `Thùng rác\\${parts.reverse().join("\\")}`;
    parts.push(cur.id === ROOT ? "C:" : cur.name);
    cur = cur.parent ? nodeById(fs, cur.parent) : undefined;
  }
  return parts.reverse().join("\\");
}

function isInside(fs: FsNode[], id: string, ancestor: string): boolean {
  let cur = nodeById(fs, id);
  while (cur?.parent) {
    if (cur.parent === ancestor) return true;
    cur = nodeById(fs, cur.parent);
  }
  return false;
}

export type FsResult = { ok: true; fs: FsNode[]; message: string } | { ok: false; message: string };
const NAME_RE = /^[^\\/:*?"<>|]+$/;

export function createFolder(fs: FsNode[], parent: string, name: string): FsResult {
  const n = name.trim();
  if (!n) return { ok: false, message: "Tên thư mục không được để trống." };
  if (!NAME_RE.test(n)) return { ok: false, message: 'Tên không được chứa các kí tự \\ / : * ? " < > |' };
  if (parent === TRASH) return { ok: false, message: "Không tạo thư mục trong Thùng rác." };
  if (children(fs, parent).some((c) => c.name.toLowerCase() === n.toLowerCase())) return { ok: false, message: `Trong thư mục này đã có "${n}". Hai mục cùng thư mục không được trùng tên.` };
  const id = `u-${n.toLowerCase().replace(/\W+/g, "-")}-${fs.length}`;
  return { ok: true, fs: [...fs, { id, name: n, kind: "folder", parent }], message: `Đã tạo thư mục ${pathOf([...fs, { id, name: n, kind: "folder", parent }], id)}.` };
}

export function moveNode(fs: FsNode[], id: string, target: string): FsResult {
  const n = nodeById(fs, id);
  if (!n || n.id === ROOT || n.id === TRASH) return { ok: false, message: "Không di chuyển được mục này." };
  if (isInside(fs, id, "windows") || id === "windows") return { ok: false, message: "Đây là tệp của hệ điều hành; di chuyển có thể làm máy không khởi động được. Hệ điều hành chặn thao tác này." };
  if (target === id || isInside(fs, target, id)) return { ok: false, message: "Không thể chuyển một thư mục vào chính nó." };
  if (nodeById(fs, target)?.kind !== "folder") return { ok: false, message: "Chỉ chuyển được vào một thư mục." };
  if (children(fs, target).some((c) => c.name.toLowerCase() === n.name.toLowerCase())) return { ok: false, message: `Thư mục đích đã có "${n.name}".` };
  const next = fs.map((x) => (x.id === id ? { ...x, parent: target } : x));
  return { ok: true, fs: next, message: `Đã chuyển tới ${pathOf(next, id)}.` };
}

export function renameNode(fs: FsNode[], id: string, name: string): FsResult {
  const n = nodeById(fs, id);
  const v = name.trim();
  if (!n || n.parent === null) return { ok: false, message: "Không đổi tên được mục này." };
  if (!v || !NAME_RE.test(v)) return { ok: false, message: 'Tên không hợp lệ (không để trống, không chứa \\ / : * ? " < > |).' };
  if (isInside(fs, id, "windows")) return { ok: false, message: "Không đổi tên tệp hệ thống." };
  if (children(fs, n.parent).some((c) => c.id !== id && c.name.toLowerCase() === v.toLowerCase())) return { ok: false, message: `Đã có "${v}" trong thư mục này.` };
  const ext = (s: string) => (s.includes(".") ? s.slice(s.lastIndexOf(".")) : "");
  const warn = n.kind === "file" && ext(n.name) !== ext(v) ? " Lưu ý: em vừa đổi phần mở rộng, hệ điều hành có thể không biết mở tệp bằng phần mềm nào." : "";
  return { ok: true, fs: fs.map((x) => (x.id === id ? { ...x, name: v } : x)), message: `Đã đổi tên thành ${v}.${warn}` };
}

export function deleteNode(fs: FsNode[], id: string): FsResult {
  const n = nodeById(fs, id);
  if (!n || n.parent === null) return { ok: false, message: "Không xóa được mục này." };
  if (isInside(fs, id, "windows")) return { ok: false, message: "Đây là tệp của hệ điều hành; xóa sẽ làm hỏng Windows. Hệ điều hành yêu cầu quyền quản trị và chặn thao tác này." };
  if (n.parent === TRASH) return { ok: true, fs: fs.filter((x) => x.id !== id && !isInside(fs, x.id, id)), message: `Đã xóa vĩnh viễn ${n.name}.` };
  return { ok: true, fs: fs.map((x) => (x.id === id ? { ...x, parent: TRASH, trashedFrom: n.parent! } : x)), message: `${n.name} đã vào Thùng rác — vẫn khôi phục được.` };
}

export function restoreNode(fs: FsNode[], id: string): FsResult {
  const n = nodeById(fs, id);
  if (!n || n.parent !== TRASH || !n.trashedFrom) return { ok: false, message: "Mục này không nằm trong Thùng rác." };
  const next = fs.map((x) => (x.id === id ? { ...x, parent: n.trashedFrom!, trashedFrom: undefined, restored: true } : x));
  return { ok: true, fs: next, message: `Đã khôi phục về ${pathOf(next, id)}.` };
}

export interface FsGoal {
  id: string;
  text: string;
  done: (fs: FsNode[]) => boolean;
}

const folderNamed = (fs: FsNode[], parent: string, name: string) => fs.find((n) => n.kind === "folder" && n.parent === parent && n.name.toLowerCase() === name.toLowerCase());

/** Các việc cần làm, kiểm tra theo trạng thái cây thư mục (làm theo thứ tự nào cũng được). */
export const FS_GOALS: FsGoal[] = [
  { id: "mk", text: "Tạo thư mục Tin11 trong Documents", done: (fs) => !!folderNamed(fs, "docs", "Tin11") },
  { id: "mv", text: "Chuyển baitap.py từ Downloads vào Documents\\Tin11", done: (fs) => { const f = folderNamed(fs, "docs", "Tin11"); return !!f && nodeById(fs, "f-bai")?.parent === f.id; } },
  { id: "rn", text: "Đổi tên baitap.py thành bai1-hello.py", done: (fs) => nodeById(fs, "f-bai")?.name === "bai1-hello.py" },
  { id: "rm", text: "Xóa nhap-cu.txt vào Thùng rác", done: (fs) => nodeById(fs, "f-cu")?.parent === TRASH },
  { id: "rs", text: "Lỡ tay xóa van-ban.docx? Hãy xóa rồi khôi phục lại nó", done: (fs) => nodeById(fs, "f-van")?.parent === "docs" && nodeById(fs, "f-van")?.restored === true },
];

// ---------- Nhiệm vụ 2: tiến trình và bộ nhớ ----------

export interface Proc {
  id: string;
  name: string;
  ramMb: number;
  cpu: number;
  system?: boolean;
  /** Phần mềm học sinh cần chạy */
  needed?: boolean;
}

export const RAM_MB = 8192;

export const INITIAL_PROCS: Proc[] = [
  { id: "kernel", name: "Hệ thống (nhân Windows)", ramMb: 1400, cpu: 3, system: true },
  { id: "explorer", name: "Explorer (màn hình nền, thư mục)", ramMb: 300, cpu: 1, system: true },
  { id: "av", name: "Phần mềm diệt virus", ramMb: 450, cpu: 2, system: true },
  { id: "chrome", name: "Chrome — 24 tab", ramMb: 3600, cpu: 18 },
  { id: "game", name: "Game đua xe (đang tạm dừng)", ramMb: 2600, cpu: 22 },
  { id: "music", name: "Nghe nhạc", ramMb: 250, cpu: 2 },
  { id: "word", name: "Word — bài văn chưa lưu", ramMb: 500, cpu: 1 },
];

export const EXAM_APP: Proc = { id: "exam", name: "Phần mềm thi Tin học", ramMb: 1800, cpu: 15, needed: true };

export function memoryUse(procs: Proc[]) {
  const used = procs.reduce((s, p) => s + p.ramMb, 0);
  const cpu = Math.min(100, procs.reduce((s, p) => s + p.cpu, 0));
  const swap = Math.max(0, used - RAM_MB);
  return { used, cpu, swap, slow: swap > 0, pct: Math.min(100, Math.round((used / RAM_MB) * 100)) };
}

export type ProcResult = { ok: boolean; procs: Proc[]; message: string; mistake: boolean };

export function endProcess(procs: Proc[], id: string): ProcResult {
  const p = procs.find((x) => x.id === id);
  if (!p) return { ok: false, procs, message: "Tiến trình không còn chạy.", mistake: false };
  if (p.system) return { ok: false, procs, mistake: true, message: `${p.name} là tiến trình của hệ điều hành / bảo vệ máy. Kết thúc nó có thể làm máy treo hoặc mất an toàn — không nên tắt.` };
  if (p.id === "word") return { ok: true, procs: procs.filter((x) => x.id !== id), mistake: true, message: "Đã tắt Word — nhưng bài văn CHƯA LƯU nằm trong RAM nên bị mất! Lẽ ra nên lưu rồi mới đóng." };
  return { ok: true, procs: procs.filter((x) => x.id !== id), mistake: false, message: `Đã kết thúc ${p.name}, hệ điều hành thu hồi ${(p.ramMb / 1024).toFixed(1)} GB RAM.` };
}

export function launch(procs: Proc[], app: Proc): ProcResult {
  if (procs.some((p) => p.id === app.id)) return { ok: false, procs, mistake: false, message: `${app.name} đang chạy.` };
  const next = [...procs, app];
  const m = memoryUse(next);
  if (m.slow) return { ok: false, procs, mistake: false, message: `Không đủ RAM: cần thêm ${(m.swap / 1024).toFixed(1)} GB. Hệ điều hành sẽ phải đẩy dữ liệu ra ổ đĩa (bộ nhớ ảo) nên máy rất chậm. Hãy giải phóng RAM trước.` };
  return { ok: true, procs: next, mistake: false, message: `${app.name} đã chạy mượt: hệ điều hành cấp ${(app.ramMb / 1024).toFixed(1)} GB RAM và chia thời gian CPU cho nó.` };
}

// ---------- Nhiệm vụ 3: chức năng của hệ điều hành ----------

export type OsFunction = "files" | "process" | "memory" | "devices" | "users" | "ui";
export const OS_FUNCTION_LABEL: Record<OsFunction, string> = {
  files: "Quản lí tệp và thư mục",
  process: "Quản lí tiến trình (chia CPU)",
  memory: "Quản lí bộ nhớ",
  devices: "Quản lí thiết bị",
  users: "Quản lí người dùng, bảo mật",
  ui: "Giao diện với người dùng",
};

export const OS_SCENARIOS: { text: string; answer: OsFunction; why: string }[] = [
  { text: "Cắm USB vào, vài giây sau máy hiện ổ E: để mở.", answer: "devices", why: "Hệ điều hành nhận thiết bị, nạp trình điều khiển (driver) để dùng được." },
  { text: "Vừa nghe nhạc vừa gõ văn bản, cả hai đều chạy mượt.", answer: "process", why: "Hệ điều hành chia thời gian CPU luân phiên cho các tiến trình." },
  { text: "Mỗi bạn đăng nhập máy phòng Tin bằng tài khoản riêng, không xem được tệp của nhau.", answer: "users", why: "Hệ điều hành quản lí tài khoản và quyền truy cập." },
  { text: "Mở thêm phần mềm, hệ điều hành cấp cho nó một vùng RAM riêng.", answer: "memory", why: "Hệ điều hành cấp phát và thu hồi bộ nhớ cho từng chương trình." },
  { text: "Kéo thả tệp vào thư mục, đổi tên, xóa vào Thùng rác.", answer: "files", why: "Hệ điều hành tổ chức dữ liệu thành tệp và thư mục trên ổ đĩa." },
  { text: "Bấm biểu tượng trên màn hình nền để mở phần mềm.", answer: "ui", why: "Hệ điều hành cung cấp giao diện đồ họa (cửa sổ, biểu tượng, chuột) để người dùng ra lệnh." },
];

export function stars(mistakes: number): 1 | 2 | 3 {
  return mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
}

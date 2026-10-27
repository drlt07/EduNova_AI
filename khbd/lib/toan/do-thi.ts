/**
 * Nhãn số kiểu sách giáo khoa và vẽ đồ thị hàm số thành SVG (app tự tính từng điểm, không dùng AI).
 * Đồ thị: hệ trục có mũi tên, gốc O, vạch chia số nguyên, đường cong, tiệm cận (nét đứt), điểm đặc biệt có nét đứt chiếu xuống trục.
 */
import { hamSo } from "./bieu-thuc";
import { lamTron, type Bbt } from "./bang-bien-thien";

/** Nhãn LaTeX cho một số: ±∞, số nguyên, phân số mẫu ≤ 12, còn lại số thập phân dấu phẩy. */
export function nhanSo(v: number): string {
  if (v === Infinity) return "+\\infty";
  if (v === -Infinity) return "-\\infty";
  if (Number.isNaN(v)) return "";
  const r = lamTron(v);
  if (Number.isInteger(r)) return String(r);
  for (let q = 2; q <= 12; q++) {
    const p = Math.round(r * q);
    if (Math.abs(r - p / q) < 1e-9) return `${p < 0 ? "-" : ""}\\frac{${Math.abs(p)}}{${q}}`;
  }
  return String(Math.round(r * 100) / 100).replace(".", ",");
}

/** Nhãn LaTeX → chữ thường để ghi trên hình (SVG không vẽ LaTeX). */
export function nhanChu(latex: string): string {
  return latex
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√$1").replace(/\\sqrt/g, "√")
    .replace(/\\infty/g, "∞").replace(/\\pi/g, "π").replace(/\\cdot/g, "·")
    .replace(/[{}$\\]/g, "").replace(/-/g, "−");
}

export type DiemDacBiet = { x: number; y: number; nhanX?: string; nhanY?: string };
export type TuyChonDoThi = { rong?: number; cao?: number; diem?: DiemDacBiet[]; tiemCanDung?: number[]; tiemCanNgang?: number[]; khungX?: [number, number]; khungY?: [number, number] };

const thoat = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Khung nhìn tự chọn từ điểm đặc biệt (luôn chứa gốc O), rồi vẽ SVG. */
export function veDoThi(bieuThuc: string, tc: TuyChonDoThi = {}): { svg: string; rong: number; cao: number } {
  const f = hamSo(bieuThuc);
  const W = tc.rong ?? 480, H = tc.cao ?? 400, le = 28;
  const diem = tc.diem ?? [];
  const tcd = tc.tiemCanDung ?? [], tcn = tc.tiemCanNgang ?? [];

  // Khung x: chứa điểm đặc biệt, tiệm cận và O, thêm lề 2 đơn vị.
  const xsDB = [0, ...diem.map((d) => d.x), ...tcd].filter(Number.isFinite);
  let [x0, x1] = tc.khungX ?? [Math.min(...xsDB) - 2, Math.max(...xsDB) + 2];
  if (x1 - x0 < 6) { const g = (x0 + x1) / 2; x0 = g - 3; x1 = g + 3; }
  // Khung y: giá trị trong khung x (bỏ phần vọt lên gần tiệm cận), điểm đặc biệt, O.
  const mau = Array.from({ length: 600 }, (_, i) => f(x0 + ((x1 - x0) * i) / 599)).filter((v) => Number.isFinite(v));
  const sx = [...mau].sort((a, b) => a - b);
  const pv = (p: number) => sx[Math.min(sx.length - 1, Math.max(0, Math.round(p * (sx.length - 1))))] ?? 0;
  const ysDB = [0, ...diem.map((d) => d.y), ...tcn].filter(Number.isFinite);
  // Có điểm đặc biệt thì khung y bám quanh chúng (đường cong được phép đi ra ngoài khung như sách giáo khoa);
  // không có thì lấy theo giá trị của hàm (bỏ phần vọt lên gần tiệm cận).
  const coDiem = diem.length > 0 || tcn.length > 0;
  let [y0, y1] = tc.khungY ?? (coDiem
    ? [Math.min(...ysDB) - 2, Math.max(...ysDB) + 2]
    : [Math.min(...ysDB, tcd.length ? pv(0.1) : pv(0)) - 1, Math.max(...ysDB, tcd.length ? pv(0.9) : pv(1)) + 1]);
  if (y1 - y0 < 4) { const g = (y0 + y1) / 2; y0 = g - 2; y1 = g + 2; }
  // Cùng đơn vị hai trục khi tỉ lệ không quá chênh (như sách giáo khoa).
  const dx = x1 - x0, dy = y1 - y0;
  let kx = (W - 2 * le) / dx, ky = (H - 2 * le) / dy;
  if (Math.max(kx, ky) / Math.min(kx, ky) < 4) {
    const k = Math.min(kx, ky);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    x0 = cx - (W - 2 * le) / k / 2; x1 = cx + (W - 2 * le) / k / 2;
    y0 = cy - (H - 2 * le) / k / 2; y1 = cy + (H - 2 * le) / k / 2;
    kx = ky = k;
  }
  const X = (x: number) => le + (x - x0) * kx;
  const Y = (y: number) => H - le - (y - y0) * ky;
  const ox = X(0), oy = Y(0);

  const phan: string[] = [];
  // Vạch chia số nguyên (bước 1, 2, 5… để không quá dày).
  const buocChia = (khoang: number) => [1, 2, 5, 10, 20, 50].find((b) => khoang / b <= 14) ?? 100;
  const bx = buocChia(x1 - x0), by = buocChia(y1 - y0);
  for (let x = Math.ceil(x0 / bx) * bx; x <= x1; x += bx) if (x !== 0) {
    phan.push(`<line x1="${X(x)}" y1="${oy - 3}" x2="${X(x)}" y2="${oy + 3}" stroke="#111" stroke-width="1"/>`);
    phan.push(`<text x="${X(x)}" y="${oy + 16}" font-size="13" text-anchor="middle">${String(x).replace("-", "−")}</text>`);
  }
  for (let y = Math.ceil(y0 / by) * by; y <= y1; y += by) if (y !== 0) {
    phan.push(`<line x1="${ox - 3}" y1="${Y(y)}" x2="${ox + 3}" y2="${Y(y)}" stroke="#111" stroke-width="1"/>`);
    phan.push(`<text x="${ox - 7}" y="${Y(y) + 4}" font-size="13" text-anchor="end">${String(y).replace("-", "−")}</text>`);
  }
  // Trục có mũi tên, nhãn x, y, O.
  phan.push(`<line x1="${le / 2}" y1="${oy}" x2="${W - 6}" y2="${oy}" stroke="#111" stroke-width="1.2"/>`,
    `<path d="M${W - 6} ${oy} l-9 -4 v8 z" fill="#111"/>`,
    `<line x1="${ox}" y1="${H - le / 2}" x2="${ox}" y2="6" stroke="#111" stroke-width="1.2"/>`,
    `<path d="M${ox} 6 l-4 9 h8 z" fill="#111"/>`,
    `<text x="${W - 10}" y="${oy + 18}" font-size="15" font-style="italic">x</text>`,
    `<text x="${ox + 8}" y="16" font-size="15" font-style="italic">y</text>`,
    `<text x="${ox - 6}" y="${oy + 16}" font-size="14" font-style="italic" text-anchor="end">O</text>`);
  // Tiệm cận (nét đứt).
  for (const a of tcd) if (a >= x0 && a <= x1) phan.push(`<line x1="${X(a)}" y1="6" x2="${X(a)}" y2="${H - 6}" stroke="#555" stroke-width="1" stroke-dasharray="5 4"/>`);
  for (const b of tcn) if (b >= y0 && b <= y1) phan.push(`<line x1="6" y1="${Y(b)}" x2="${W - 6}" y2="${Y(b)}" stroke="#555" stroke-width="1" stroke-dasharray="5 4"/>`);
  // Đường cong: ngắt nét tại chỗ không xác định, tiệm cận đứng hoặc ra khỏi khung quá xa.
  const n = 1600;
  let d = "", dangVe = false, xTruoc = NaN;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, y = f(x);
    const quaTiemCan = Number.isFinite(xTruoc) && tcd.some((a) => (xTruoc - a) * (x - a) <= 0);
    if (!Number.isFinite(y) || y < y0 - 3 * (y1 - y0) || y > y1 + 3 * (y1 - y0) || quaTiemCan) { dangVe = false; xTruoc = x; continue; }
    d += `${dangVe ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
    dangVe = true; xTruoc = x;
  }
  phan.push(`<clipPath id="khung"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>`,
    `<path d="${d}" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round" clip-path="url(#khung)"/>`);
  // Điểm đặc biệt: chấm, nét đứt chiếu xuống hai trục, nhãn chính xác (nếu có).
  for (const p of diem) {
    if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
    if (p.x !== 0 && p.y !== 0) phan.push(`<path d="M${X(p.x)} ${oy} V${Y(p.y)} H${ox}" fill="none" stroke="#555" stroke-width="0.9" stroke-dasharray="4 3"/>`);
    phan.push(`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3" fill="#111"/>`);
    if (p.nhanX && p.x !== 0 && !Number.isInteger(p.x)) phan.push(`<text x="${X(p.x)}" y="${oy + (p.y > 0 ? 30 : -8)}" font-size="13" text-anchor="middle">${thoat(nhanChu(p.nhanX))}</text>`);
    if (p.nhanY && p.y !== 0 && !Number.isInteger(p.y)) phan.push(`<text x="${ox + (p.x > 0 ? -8 : 8)}" y="${Y(p.y) + 4}" font-size="13" text-anchor="${p.x > 0 ? "end" : "start"}">${thoat(nhanChu(p.nhanY))}</text>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Times New Roman', Times, serif" fill="#111"><rect width="${W}" height="${H}" fill="#fff"/>${phan.join("")}</svg>`;
  return { svg, rong: W, cao: H };
}

/** Điểm đặc biệt và tiệm cận lấy từ bảng biến thiên (dùng khi vẽ đồ thị). */
export function diemTuBbt(bbt: Bbt, bieuThuc?: string): Pick<TuyChonDoThi, "diem" | "tiemCanDung" | "tiemCanNgang"> {
  const diem: DiemDacBiet[] = [], tcd: number[] = [], tcn: number[] = [];
  for (const m of bbt.moc) {
    if (m.loai === "diem") diem.push({ x: m.x, y: m.y, nhanX: nhanSo(m.x), nhanY: nhanSo(m.y) });
    if (m.loai === "tiem_can") tcd.push(m.x);
    if (m.loai === "vo_cuc" && Number.isFinite(m.y)) tcn.push(m.y);
  }
  // Giao điểm với trục tung (nếu xác định và chưa có).
  if (bieuThuc) {
    const y0 = lamTron(hamSo(bieuThuc)(0));
    if (Number.isFinite(y0) && !diem.some((d) => d.x === 0)) diem.push({ x: 0, y: y0, nhanY: nhanSo(y0) });
  }
  return { diem, tiemCanDung: tcd, tiemCanNgang: [...new Set(tcn)] };
}

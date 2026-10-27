/**
 * Lập bảng biến thiên bằng tính số (không dùng AI): tìm điểm làm đạo hàm bằng 0, tiệm cận đứng, đầu mút tập xác định,
 * giới hạn ở vô cực; dấu đạo hàm trên từng khoảng. Dùng để đối chiếu bảng biến thiên AI đọc từ ảnh và để vẽ lại.
 */
import { giaTriNhan, hamSo, hamSoTho } from "./bieu-thuc";

export type MocBbt =
  | { loai: "vo_cuc"; x: -1 | 1; y: number } // −∞ / +∞ và giới hạn tương ứng (có thể là ±Infinity)
  | { loai: "diem"; x: number; y: number; daoHam0: boolean } // điểm y' = 0 hoặc đầu mút đoạn
  | { loai: "tiem_can"; x: number; yTrai: number; yPhai: number }; // tiệm cận đứng (giới hạn hai bên)

export type Bbt = { moc: MocBbt[]; dau: ("+" | "-")[] /* dấu y' trên khoảng giữa hai mốc liên tiếp */ };

const LON = 1e6;

/** Đạo hàm số (sai phân trung tâm). */
const daoHam = (f: (x: number) => number, x: number) => {
  const h = 1e-6 * Math.max(1, Math.abs(x));
  return (f(x + h) - f(x - h)) / (2 * h);
};

/** Dãy giá trị tiến ra vô cực: cùng dấu, trị tuyệt đối tăng, bước tăng không giảm nhanh (kể cả kiểu logarit). */
function raVoCuc(ds: number[]): number {
  if (ds.some((v) => Math.abs(v) === Infinity)) return Math.sign(ds.find((v) => Math.abs(v) === Infinity)!) * Infinity;
  const [a, b, c, d] = ds.slice(-4);
  if ([a, b, c, d].some(Number.isNaN) || ![a, b, c, d].every((v) => Math.sign(v) === Math.sign(d))) return NaN;
  const tang = Math.abs(b) < Math.abs(c) && Math.abs(c) < Math.abs(d);
  if (tang && Math.abs(d) > 1e4) return Math.sign(d) * Infinity;
  // Kiểu logarit: mỗi lần x nhân 100 thì giá trị tăng một lượng gần như không đổi.
  if (tang && Math.abs(d - c) > 0.5 && Math.abs(d - c) >= 0.8 * Math.abs(c - b) && Math.abs(c - b) >= 0.8 * Math.abs(b - a)) return Math.sign(d) * Infinity;
  return NaN;
}

/** Giới hạn khi x → ±∞: ±Infinity hoặc số hữu hạn (làm tròn). NaN nếu không xác định (vd dao động). */
export function gioiHanVoCuc(f: (x: number) => number, huong: -1 | 1): number {
  const ds = [1e2, 1e4, 1e6, 1e8].map((X) => f(huong * X));
  const vc = raVoCuc(ds);
  if (!Number.isNaN(vc)) return vc;
  const [, , c, d] = ds;
  if (Number.isFinite(c) && Number.isFinite(d) && Math.abs(d - c) < 1e-3 * Math.max(1, Math.abs(d))) return lamTron(d);
  return NaN;
}

/** Làm tròn sai số tính số (1.9999999 → 2, 0.3333333 → 1/3 dạng số). */
export function lamTron(v: number): number {
  if (!Number.isFinite(v)) return v;
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(v * q);
    if (Math.abs(v - p / q) < 1e-6 * Math.max(1, Math.abs(v))) return p / q;
  }
  return v;
}

/** Giới hạn một phía tại a (huong -1: bên trái, 1: bên phải): ±Infinity hoặc số. */
function gioiHanMotPhia(f: (x: number) => number, a: number, huong: -1 | 1): number {
  const ds = [1e-3, 1e-5, 1e-7, 1e-9].map((e) => f(a + huong * e * Math.max(1, Math.abs(a))));
  const vc = raVoCuc(ds);
  if (!Number.isNaN(vc)) return vc;
  return Number.isFinite(ds[3]) ? lamTron(ds[3]) : NaN;
}

/** Tìm nghiệm của g trên [a, b] khi g(a), g(b) trái dấu (chia đôi). */
function chiaDoi(g: (x: number) => number, a: number, b: number): number {
  let ga = g(a);
  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2, gm = g(m);
    if (Number.isNaN(gm)) break;
    if (Math.sign(gm) === Math.sign(ga)) { a = m; ga = gm; } else b = m;
  }
  return lamTron((a + b) / 2);
}

/**
 * Phân tích f trên (lo, hi) (mặc định cả trục số). goiY: các mốc hữu hạn đã biết (vd AI đọc) để chọn phạm vi tìm.
 */
export function phanTichHam(bieuThuc: string, khoang?: { lo: number; hi: number }, goiY: number[] = []): Bbt {
  const f = hamSo(bieuThuc);
  const fTho = hamSoTho(bieuThuc);
  const huuHan = goiY.filter(Number.isFinite);
  const A = Math.max(10, 3 * Math.max(0, ...huuHan.map(Math.abs)) + 5);
  const lo = khoang && Number.isFinite(khoang.lo) ? khoang.lo : -A;
  const hi = khoang && Number.isFinite(khoang.hi) ? khoang.hi : A;
  const voCucTrai = !khoang || !Number.isFinite(khoang.lo);
  const voCucPhai = !khoang || !Number.isFinite(khoang.hi);

  // Lấy mẫu dày; lệch nhẹ để không rơi đúng vào điểm đặc biệt.
  const N = 40000;
  const buoc = (hi - lo) / N;
  const xs = Array.from({ length: N + 1 }, (_, i) => lo + i * buoc + (i > 0 && i < N ? buoc * 0.0137 : 0));
  const ys = xs.map(f);

  // Đoạn liên tục: dãy mẫu xác định liền nhau, cắt tại chỗ |f| nhảy qua vô cực (tiệm cận đứng).
  type Doan = { a: number; b: number; moA: boolean; moB: boolean; tcA?: number; tcB?: number };
  const doan: Doan[] = [];
  let batDau = -1;
  const dongDoan = (i: number, moPhai: boolean) => {
    if (batDau < 0) return;
    doan.push({ a: xs[batDau], b: xs[i], moA: false, moB: moPhai });
    batDau = -1;
  };
  for (let i = 0; i <= N; i++) {
    const coGiaTri = !Number.isNaN(ys[i]);
    if (coGiaTri && batDau < 0) batDau = i;
    if (!coGiaTri && batDau >= 0) dongDoan(i - 1, true);
    if (coGiaTri && i < N && !Number.isNaN(ys[i + 1])) {
      // Nhảy dấu với trị tuyệt đối rất lớn hai bên: có tiệm cận đứng giữa hai mẫu.
      const t = Math.abs(ys[i]), p = Math.abs(ys[i + 1]);
      if (Math.sign(ys[i]) !== Math.sign(ys[i + 1]) && Math.min(t, p) > 50 && Math.abs(ys[i + 1] - ys[i]) > 100) {
        dongDoan(i, true);
        batDau = i + 1;
      }
    }
  }
  dongDoan(N, false);
  if (!doan.length) throw new Error("Hàm số không xác định trên khoảng xét.");

  // Chính xác hóa ranh giới giữa hai đoạn: tiệm cận đứng (|f| → ∞) hoặc đầu mút tập xác định.
  const ranhGioi = (x0: number) => {
    const xr = lamTron(x0);
    const trai = gioiHanMotPhia(fTho, xr, -1), phai = gioiHanMotPhia(fTho, xr, 1);
    return { xr, trai, phai };
  };

  const moc: MocBbt[] = [];
  const dau: ("+" | "-")[] = [];
  doan.forEach((d, k) => {
    // Mốc đầu đoạn.
    if (k === 0) {
      if (voCucTrai && d.a <= lo + buoc) moc.push({ loai: "vo_cuc", x: -1, y: gioiHanVoCuc(fTho, -1) });
      else {
        // Đầu mút tập xác định (vd √(4−x²) tại −2) hoặc đầu đoạn khảo sát.
        const xa = khoang && !voCucTrai && d.a <= lo + buoc ? lo : chiaDoi((x) => (Number.isNaN(f(x)) ? -1 : 1), d.a - buoc, d.a);
        const ya = f(xa);
        moc.push(Number.isNaN(ya) ? { loai: "tiem_can", x: lamTron(xa), yTrai: NaN, yPhai: gioiHanMotPhia(fTho, lamTron(xa), 1) } : { loai: "diem", x: lamTron(xa), y: lamTron(ya), daoHam0: false });
      }
    }
    // Điểm y' = 0 bên trong đoạn: đổi dấu (cực trị) hoặc chạm 0 không đổi dấu.
    const g = (x: number) => daoHam(f, x);
    const iA = Math.round((d.a - lo) / buoc), iB = Math.round((d.b - lo) / buoc);
    let truoc = g(xs[Math.min(iA + 1, iB)]);
    const diem: number[] = [];
    for (let i = iA + 2; i < iB; i++) {
      const gi = g(xs[i]);
      if (Number.isNaN(gi) || Number.isNaN(truoc)) { truoc = gi; continue; }
      if (Math.sign(gi) !== Math.sign(truoc) && gi !== 0) diem.push(chiaDoi(g, xs[i - 1], xs[i]));
      else if (i + 1 < iB) {
        // Chạm 0 không đổi dấu (vd x³ tại 0): |g| cực tiểu địa phương rất nhỏ.
        const sau = g(xs[i + 1]);
        if (Math.abs(gi) < Math.abs(truoc) && Math.abs(gi) <= Math.abs(sau) && Math.abs(gi) < 1e-4) {
          let a = xs[i - 1], b = xs[i + 1];
          for (let j = 0; j < 60; j++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (Math.abs(g(m1)) < Math.abs(g(m2))) b = m2; else a = m1; }
          const x0 = (a + b) / 2;
          if (Math.abs(g(x0)) < 1e-6 * Math.max(1, Math.abs(f(x0)))) diem.push(lamTron(x0));
        }
      }
      truoc = gi;
    }
    const daDung = [...new Set(diem.map((x) => lamTron(x)))].sort((a, b) => a - b);
    const dauKhoang = (a: number, b: number): "+" | "-" => (g((a + b) / 2) >= 0 ? "+" : "-");
    let xTruoc = moc.length ? (moc[moc.length - 1].loai === "vo_cuc" ? d.a : (moc[moc.length - 1] as { x: number }).x) : d.a;
    for (const x0 of daDung) {
      dau.push(dauKhoang(xTruoc, x0));
      const y0 = f(x0);
      // Đạo hàm đổi dấu tại chỗ hàm không xác định / ra vô cực (vd 1/x² tại 0): tiệm cận đứng, không phải cực trị.
      if (Number.isNaN(y0) || Math.abs(y0) > 1e6) moc.push({ loai: "tiem_can", x: x0, yTrai: gioiHanMotPhia(fTho, x0, -1), yPhai: gioiHanMotPhia(fTho, x0, 1) });
      else moc.push({ loai: "diem", x: x0, y: lamTron(y0), daoHam0: true });
      xTruoc = x0;
    }
    // Mốc cuối đoạn.
    const cuoi = k === doan.length - 1;
    if (cuoi && voCucPhai && d.b >= hi - buoc) {
      dau.push(dauKhoang(xTruoc, Math.min(xTruoc + 10, d.b)));
      moc.push({ loai: "vo_cuc", x: 1, y: gioiHanVoCuc(fTho, 1) });
    } else if (cuoi && khoang && !voCucPhai && d.b >= hi - buoc) {
      dau.push(dauKhoang(xTruoc, hi));
      moc.push({ loai: "diem", x: hi, y: lamTron(f(hi)), daoHam0: false });
    } else {
      const sau = doan[k + 1];
      const x0 = sau ? (d.b + sau.a) / 2 : chiaDoi((x) => (Number.isNaN(f(x)) ? -1 : 1), d.b + buoc, d.b);
      // Tìm chính xác chỗ |f| lớn nhất giữa hai đoạn (tiệm cận) hoặc ranh giới xác định.
      let a = d.b - buoc, b = sau ? sau.a + buoc : d.b + buoc;
      for (let j = 0; j < 80; j++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; const v1 = Math.abs(f(m1)), v2 = Math.abs(f(m2)); if ((Number.isNaN(v1) ? Infinity : v1) > (Number.isNaN(v2) ? Infinity : v2)) b = m2; else a = m1; }
      const { xr, trai, phai } = ranhGioi(sau ? (a + b) / 2 : x0);
      dau.push(dauKhoang(xTruoc, xr - 1e-4 * Math.max(1, Math.abs(xr))));
      if (Number.isFinite(trai) && !Number.isNaN(f(xr)) && !sau) moc.push({ loai: "diem", x: xr, y: lamTron(f(xr)), daoHam0: false });
      else moc.push({ loai: "tiem_can", x: xr, yTrai: trai, yPhai: phai });
    }
  });
  // "Tiệm cận" mà giới hạn các phía xác định đều hữu hạn chỉ là đầu mút tập xác định (vd x·ln x tại 0).
  const mocChuan = moc.map((m): MocBbt => {
    if (m.loai !== "tiem_can") return m;
    const ben = [m.yTrai, m.yPhai].filter((v) => !Number.isNaN(v));
    return ben.length && ben.every(Number.isFinite) ? { loai: "diem", x: m.x, y: ben[0], daoHam0: false } : m;
  });
  return { moc: mocChuan, dau };
}

// ───────────── Đối chiếu với bảng biến thiên AI đọc từ ảnh ─────────────

/** Bảng biến thiên đọc từ ảnh: nhãn các mốc (gồm −∞, +∞), dấu y' từng khoảng, giá trị y từng mốc ("trái||phải" ở tiệm cận). */
export type BbtDoc = { x: string[]; daoHam: string[]; y: string[] };

const gan = (a: number, b: number) =>
  (Number.isNaN(a) && Number.isNaN(b)) || a === b || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(a), Math.abs(b)));
const xCuaMoc = (m: MocBbt) => (m.loai === "vo_cuc" ? m.x * Infinity : m.x);

/** Bỏ các mốc y' = 0 không đổi dấu mà ảnh không ghi (sách có thể ghi hoặc không), để so từng mốc với ảnh. */
export function locTheoDoc(tinh: Bbt, doc: BbtDoc): Bbt {
  const xDoc = doc.x.map(giaTriNhan);
  const tuyChon = (m: MocBbt, i: number) => m.loai === "diem" && m.daoHam0 && tinh.dau[i - 1] === tinh.dau[i];
  const chiSo = tinh.moc.flatMap((m, i) => (tuyChon(m, i) && !xDoc.some((x) => gan(x, (m as { x: number }).x)) ? [] : [i]));
  // Dấu giữa hai mốc giữ lại liên tiếp: dấu của khoảng ngay sau mốc trước (mốc bỏ đi không đổi dấu).
  return { moc: chiSo.map((i) => tinh.moc[i]), dau: chiSo.slice(1).map((_, k) => tinh.dau[chiSo[k]]) };
}

/** Đối chiếu: khớp thì trả null; lệch thì trả lí do (tiếng Việt). */
export function doiChieuBbt(tinh: Bbt, doc: BbtDoc): string | null {
  const xDoc = doc.x.map(giaTriNhan);
  if (xDoc.some(Number.isNaN)) return `Không đọc được mốc x “${doc.x[xDoc.findIndex(Number.isNaN)]}”.`;
  const { moc, dau } = locTheoDoc(tinh, doc);
  if (moc.length !== xDoc.length) return `Số mốc x khác nhau: ảnh có ${xDoc.length}, tính được ${moc.length} (${moc.map((m) => fmt(xCuaMoc(m))).join("; ")}).`;
  for (let i = 0; i < moc.length; i++) if (!gan(xCuaMoc(moc[i]), xDoc[i])) return `Mốc x thứ ${i + 1} khác: ảnh ghi “${doc.x[i]}”, tính được ${fmt(xCuaMoc(moc[i]))}.`;
  const dauDoc = doc.daoHam.map((d) => (/[-−–]/.test(d) ? "-" : /\+/.test(d) ? "+" : "?"));
  if (dauDoc.length !== dau.length || dauDoc.some((d, i) => d !== dau[i])) return `Dấu y' khác: ảnh “${doc.daoHam.join(" ")}”, tính được “${dau.join(" ")}”.`;
  for (let i = 0; i < moc.length; i++) {
    const m = moc[i], nhan = doc.y[i] ?? "";
    if (m.loai === "tiem_can") {
      // Tiệm cận ở đầu tập xác định (chỉ một phía có giới hạn) có thể ghi một giá trị, không cần “||”.
      const phan = nhan.split(/\|\||‖/);
      const [t, p] = phan.length > 1 ? phan.map(giaTriNhan) : Number.isNaN(m.yTrai) ? [NaN, giaTriNhan(phan[0])] : [giaTriNhan(phan[0]), NaN];
      if ((Number.isFinite(m.yTrai) || Math.abs(m.yTrai) === Infinity) && !gan(m.yTrai, t)) return `Giới hạn bên trái tại x = ${fmt(m.x)} khác: ảnh “${nhan}”, tính được ${fmt(m.yTrai)}.`;
      if ((Number.isFinite(m.yPhai) || Math.abs(m.yPhai) === Infinity) && !gan(m.yPhai, p)) return `Giới hạn bên phải tại x = ${fmt(m.x)} khác: ảnh “${nhan}”, tính được ${fmt(m.yPhai)}.`;
    } else if (!Number.isNaN(m.y) && !gan(m.y, giaTriNhan(nhan))) return `Giá trị y tại mốc thứ ${i + 1} khác: ảnh ghi “${nhan}”, tính được ${fmt(m.y)}.`;
  }
  return null;
}

export const fmt = (v: number) => (v === Infinity ? "+∞" : v === -Infinity ? "−∞" : Number.isNaN(v) ? "?" : String(Math.round(v * 1000) / 1000).replace("-", "−"));

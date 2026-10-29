/**
 * Logic các mô phỏng "Máy tính làm việc thế nào" và đời sống: tải xuống, hàng đợi máy in, hoàn tác, dung lượng thẻ nhớ,
 * bộ nhớ đệm trình duyệt, thang máy. Hàm thuần, có chẩn đoán lỗi thường gặp và gợi ý 3 bậc (không đưa nguyên đáp án).
 */

export type Hints = [string, string, string];
export interface Diagnosis { ok: boolean; error?: string; hints: Hints }

const near = (a: number, b: number, tol = 0.05) => (b === 0 ? Math.abs(a) < 1e-9 : Math.abs(a - b) / Math.abs(b) <= tol);
const ok = (hints: Hints): Diagnosis => ({ ok: true, hints });
const bad = (error: string, hints: Hints): Diagnosis => ({ ok: false, error, hints });
export const parseNum = (s: string) => Number(s.trim().replace(/\s/g, "").replace(",", "."));

// ───────────── Tải xuống mất bao lâu ─────────────

export const MB_PER_GB = 1024;

/** Giây để tải tệp sizeMB qua mạng mbps (megabit/giây): 1 byte = 8 bit. */
export const downloadSeconds = (sizeMB: number, mbps: number) => (sizeMB * 8) / mbps;

export function diagnoseDownload(answer: number, sizeMB: number, mbps: number, givenInGB: boolean): Diagnosis {
  const right = downloadSeconds(sizeMB, mbps);
  const rule: Hints = ["Tốc độ mạng đo bằng bit/giây (Mbps), dung lượng tệp đo bằng byte (MB).", `Đổi dung lượng ra megabit trước: ${givenInGB ? "GB → MB (×1024) → Mb (×8)" : "MB → Mb (×8)"}.`, "Thời gian = dung lượng (Mb) ÷ tốc độ (Mb/giây)."];
  if (!Number.isFinite(answer)) return bad("chưa nhập số", rule);
  // Kiểm tra lỗi đổi 1000/1024 trước, vì hai kết quả chỉ chênh nhau khoảng 2,4%
  if (givenInGB && near(answer, (right / MB_PER_GB) * 1000, 0.01)) return bad("dùng 1 GB = 1000 MB", ["Trong Tin học, 1 GB = 1024 MB.", rule[1], rule[2]]);
  if (near(answer, right, 0.02)) return ok(rule);
  if (near(answer, right / 8)) return bad("quên đổi byte sang bit (×8)", rule);
  if (near(answer, right / 64)) return bad("chia 8 thay vì nhân 8", rule);
  if (givenInGB && near(answer, right / MB_PER_GB)) return bad("quên đổi GB sang MB", rule);
  return bad("tính sai", rule);
}

// ───────────── Hàng đợi máy in ─────────────

export interface PrintJob { id: string; name: string; pages: number }
/** Máy in 10 trang/phút: mỗi trang 6 giây. */
export const SEC_PER_PAGE = 6;

export function printOrder(jobs: PrintJob[], policy: "fifo" | "sjf"): PrintJob[] {
  return policy === "fifo" ? [...jobs] : [...jobs].sort((a, b) => a.pages - b.pages || jobs.indexOf(a) - jobs.indexOf(b));
}

/** Thời gian chờ (giây) của từng tài liệu trước khi bắt đầu in, theo thứ tự in. */
export function printWaits(order: PrintJob[]) {
  let t = 0;
  return order.map((j) => { const start = t; t += j.pages * SEC_PER_PAGE; return { job: j, start, end: t }; });
}
export const avgWait = (order: PrintJob[]) => (order.length ? printWaits(order).reduce((s, w) => s + w.start, 0) / order.length : 0);

export function diagnosePrintOrder(picked: string[], jobs: PrintJob[], want: "fifo" | "sjf"): Diagnosis {
  const right = printOrder(jobs, want).map((j) => j.id);
  const fifo = jobs.map((j) => j.id);
  const hints: Hints = want === "fifo"
    ? ["Hàng đợi (queue): ai gửi trước được in trước, như xếp hàng mua vé.", "Nhìn thứ tự các tài liệu được gửi lên máy in, từ trái sang phải.", `Tài liệu in đầu tiên là của ${jobs[0].name}.`]
    : ["Muốn thời gian chờ trung bình nhỏ nhất: tài liệu ngắn in trước.", "Tài liệu dài in sớm sẽ bắt mọi người phía sau chờ lâu.", "Xếp theo số trang tăng dần."];
  if (picked.length < jobs.length) return bad("chưa xếp hết", hints);
  if (picked.every((id, i) => id === right[i])) return ok(hints);
  // SJF: chấp nhận mọi thứ tự có cùng thời gian chờ trung bình nhỏ nhất (tài liệu bằng trang đổi chỗ được)
  if (want === "sjf") {
    const byId = (id: string) => jobs.find((j) => j.id === id)!;
    if (near(avgWait(picked.map(byId)), avgWait(printOrder(jobs, "sjf")), 1e-9)) return ok(hints);
    if (picked.every((id, i) => id === fifo[i])) return bad("vẫn xếp theo thứ tự gửi", hints);
    return bad("chưa xếp tài liệu ngắn trước", hints);
  }
  if (picked.every((id, i) => id === printOrder(jobs, "sjf")[i].id)) return bad("xếp theo số trang thay vì thứ tự gửi", hints);
  return bad("sai thứ tự hàng đợi", hints);
}

export function diagnosePrintWait(answer: number, jobs: PrintJob[], policy: "fifo" | "sjf", targetId: string): Diagnosis {
  const ws = printWaits(printOrder(jobs, policy));
  const w = ws.find((x) => x.job.id === targetId)!;
  const hints: Hints = ["Thời gian chờ = tổng thời gian in các tài liệu đứng TRƯỚC trong hàng đợi.", `Mỗi trang in mất ${SEC_PER_PAGE} giây.`, `Cộng số trang của các tài liệu trước ${w.job.name} rồi nhân ${SEC_PER_PAGE}.`];
  if (!Number.isFinite(answer)) return bad("chưa nhập số", hints);
  if (answer === w.start) return ok(hints);
  if (answer === w.end) return bad("cộng cả thời gian in tài liệu của chính mình", hints);
  if (answer === w.start / SEC_PER_PAGE) return bad("quên nhân số giây mỗi trang", hints);
  return bad("tính sai thời gian chờ", hints);
}

// ───────────── Hoàn tác (ngăn xếp) ─────────────

export type EditAct = { kind: "type"; word: string } | { kind: "del" } | { kind: "undo" } | { kind: "redo" };
export const actLabel = (a: EditAct) => (a.kind === "type" ? `Gõ “${a.word.trim()}”` : a.kind === "del" ? "Xóa từ cuối" : a.kind === "undo" ? "Ctrl+Z" : "Ctrl+Y");

const applyEdit = (words: string[], a: EditAct) => (a.kind === "type" ? [...words, a.word] : a.kind === "del" ? words.slice(0, -1) : words);

export interface EditState { words: string[]; undo: EditAct[]; redo: EditAct[] }

/**
 * Trình soạn thảo với hai ngăn xếp: mỗi thao tác đẩy vào ngăn Hoàn tác và XÓA ngăn Làm lại;
 * Ctrl+Z lấy thao tác MỚI NHẤT ra (LIFO) chuyển sang ngăn Làm lại.
 * variant dùng để mô phỏng các hiểu nhầm: "keep-redo" (thao tác mới không xóa ngăn Làm lại), "queue" (Ctrl+Z bỏ thao tác cũ nhất).
 */
export function runEdits(acts: EditAct[], variant: "stack" | "keep-redo" | "queue" = "stack"): EditState {
  let applied: EditAct[] = [], redo: EditAct[] = [];
  const replay = (xs: EditAct[]) => xs.reduce(applyEdit, [] as string[]);
  for (const a of acts) {
    if (a.kind === "undo") {
      if (!applied.length) continue;
      const out = variant === "queue" ? applied[0] : applied[applied.length - 1];
      applied = variant === "queue" ? applied.slice(1) : applied.slice(0, -1);
      redo = [...redo, out];
    } else if (a.kind === "redo") {
      if (!redo.length) continue;
      applied = [...applied, redo[redo.length - 1]];
      redo = redo.slice(0, -1);
    } else {
      applied = [...applied, a];
      if (variant !== "keep-redo") redo = [];
    }
  }
  return { words: replay(applied), undo: applied, redo };
}
export const editText = (acts: EditAct[], variant?: "stack" | "keep-redo" | "queue") => runEdits(acts, variant).words.join("").trim();
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export function diagnoseEdits(answer: string, acts: EditAct[]): Diagnosis {
  const hints: Hints = ["Ctrl+Z luôn hoàn tác thao tác MỚI NHẤT — như lấy cái đĩa trên cùng của chồng đĩa (ngăn xếp).", "Thao tác bị hoàn tác chuyển sang ngăn Làm lại; Ctrl+Y lấy lại nó.", "Khi em làm một thao tác mới, ngăn Làm lại bị xóa sạch."];
  if (norm(answer) === norm(editText(acts))) return ok(hints);
  if (norm(answer) === norm(editText(acts, "queue"))) return bad("hoàn tác thao tác cũ nhất thay vì mới nhất", hints);
  if (norm(answer) === norm(editText(acts, "keep-redo"))) return bad("quên: thao tác mới xóa ngăn Làm lại", hints);
  return bad("dò sai các thao tác", hints);
}

// ───────────── Dung lượng thẻ nhớ ─────────────

export const ITEM_MB = { anh: 4, bai_hat: 5, phut_video: 100, ung_dung: 250 } as const;
export type Item = keyof typeof ITEM_MB;
export const usedMB = (n: Partial<Record<Item, number>>) => (Object.keys(n) as Item[]).reduce((s, k) => s + (n[k] ?? 0) * ITEM_MB[k], 0);

/** Số đơn vị tối đa còn chứa được (làm tròn xuống: không đủ chỗ thì không lưu được). */
export const maxFit = (freeMB: number, unitMB: number) => Math.floor(freeMB / unitMB);

export function diagnoseFit(answer: number, freeGB: number, unitMB: number): Diagnosis {
  const right = maxFit(freeGB * MB_PER_GB, unitMB);
  const hints: Hints = ["Đổi về cùng đơn vị trước: 1 GB = 1024 MB.", `Chỗ trống tính ra MB rồi chia cho ${unitMB} MB mỗi tệp.`, "Kết quả lẻ thì làm tròn XUỐNG: tệp cuối không đủ chỗ sẽ không lưu được."];
  if (!Number.isFinite(answer)) return bad("chưa nhập số", hints);
  if (answer === right) return ok(hints);
  if (answer === Math.ceil((freeGB * MB_PER_GB) / unitMB)) return bad("làm tròn lên", hints);
  if (answer === Math.floor((freeGB * 1000) / unitMB) || answer === Math.round((freeGB * 1000) / unitMB)) return bad("dùng 1 GB = 1000 MB", hints);
  if (near(answer, freeGB / unitMB, 0.02)) return bad("quên đổi GB sang MB", hints);
  if (answer === freeGB * MB_PER_GB * unitMB) return bad("nhân thay vì chia", hints);
  return bad("tính sai", hints);
}

// ───────────── Bộ nhớ đệm trình duyệt (LRU) ─────────────

export interface CacheStep { site: string; hit: boolean; evicted?: string; cache: string[] }

/** Bộ nhớ đệm giữ size trang; đầy thì bỏ trang lâu nhất chưa mở lại (LRU). policy "fifo" là hiểu nhầm: bỏ trang vào sớm nhất. */
export function runCache(seq: string[], size: number, policy: "lru" | "fifo" = "lru"): CacheStep[] {
  let cache: string[] = []; // đầu mảng = lâu chưa dùng nhất (LRU) / vào sớm nhất (FIFO)
  return seq.map((site) => {
    const hit = cache.includes(site);
    let evicted: string | undefined;
    if (hit) { if (policy === "lru") cache = [...cache.filter((x) => x !== site), site]; }
    else {
      if (cache.length >= size) { evicted = cache[0]; cache = cache.slice(1); }
      cache = [...cache, site];
    }
    return { site, hit, evicted, cache: [...cache] };
  });
}
export const cacheMisses = (seq: string[], size: number, policy: "lru" | "fifo" = "lru") => runCache(seq, size, policy).filter((s) => !s.hit).length;

export function diagnoseMisses(answer: number, seq: string[], size: number): Diagnosis {
  const right = cacheMisses(seq, size);
  const hints: Hints = ["Trang đã có trong bộ nhớ đệm mở nhanh; chưa có thì phải tải chậm từ máy chủ.", `Bộ nhớ đệm chỉ giữ ${size} trang. Đầy rồi thì bỏ trang LÂU NHẤT chưa được mở lại.`, "Dò từng lượt, ghi các trang đang giữ sau mỗi lượt, đếm số lần tải chậm."];
  if (!Number.isFinite(answer)) return bad("chưa nhập số", hints);
  if (answer === right) return ok(hints);
  if (answer === cacheMisses(seq, size, "fifo")) return bad("bỏ trang vào sớm nhất thay vì trang lâu chưa dùng nhất", hints);
  if (answer === new Set(seq).size) return bad("quên bộ nhớ đệm chỉ có giới hạn chỗ", hints);
  if (answer === seq.length) return bad("quên trang đã lưu thì mở nhanh", hints);
  return bad("dò sai", hints);
}

// ───────────── Thang máy ─────────────

export const travel = (start: number, order: number[]) => order.reduce((acc, f) => ({ at: f, d: acc.d + Math.abs(f - acc.at) }), { at: start, d: 0 }).d;

/** Đi một chiều (thuật toán thang máy): phục vụ hết các tầng theo chiều đang đi, rồi mới quay lại. */
export function scanOrder(start: number, requests: number[], dir: "up" | "down" = "up"): number[] {
  const up = [...new Set(requests)].filter((f) => f >= start).sort((a, b) => a - b);
  const down = [...new Set(requests)].filter((f) => f < start).sort((a, b) => b - a);
  return dir === "up" ? [...up, ...down] : [...down, ...up];
}

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}
/** Quãng đường ngắn nhất (số tầng) để phục vụ hết yêu cầu — dò mọi thứ tự (tối đa 7 yêu cầu). */
export const bestTravel = (start: number, requests: number[]) => Math.min(...permutations([...new Set(requests)]).map((o) => travel(start, o)));

export function diagnoseRoute(order: number[], start: number, requests: number[]): Diagnosis {
  const best = bestTravel(start, requests);
  const d = travel(start, order);
  const hints: Hints = ["Thang máy đi qua lại nhiều lần thì tốn quãng đường.", "Đi hết một chiều, đón mọi tầng trên đường, rồi mới quay đầu.", "So hai cách: đi lên trước rồi xuống, hoặc xuống trước rồi lên. Chiều nào gần đầu mút hơn thì đi trước."];
  if (order.length < new Set(requests).size) return bad("chưa phục vụ hết", hints);
  if (d === best) return ok(hints);
  const turns = order.slice(1).reduce((n, f, i) => { const prev = i === 0 ? start : order[i - 1]; const cur = order[i]; return n + (Math.sign(cur - prev) !== Math.sign(f - cur) ? 1 : 0); }, 0);
  return bad(turns > 1 ? "đổi chiều nhiều lần" : "chọn chiều đi trước chưa hợp lí", hints);
}

export function diagnoseTravel(answer: number, start: number, order: number[]): Diagnosis {
  const right = travel(start, order);
  const hints: Hints = ["Quãng đường = tổng số tầng đi qua giữa hai điểm dừng liên tiếp.", "Từ tầng a đến tầng b đi |a − b| tầng, dù đi lên hay xuống.", `Bắt đầu từ tầng ${start}, cộng từng đoạn theo đúng thứ tự.`];
  if (!Number.isFinite(answer)) return bad("chưa nhập số", hints);
  if (answer === right) return ok(hints);
  const signed = order.reduce((acc, f) => ({ at: f, d: acc.d + (f - acc.at) }), { at: start, d: 0 }).d;
  if (answer === Math.abs(signed)) return bad("trừ đoạn đi xuống thay vì cộng", hints);
  if (answer === travel(order[0], order.slice(1))) return bad("quên đoạn từ tầng xuất phát", hints);
  return bad("cộng sai", hints);
}

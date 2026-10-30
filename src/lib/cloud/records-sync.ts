"use client";
/**
 * Phần mạng của đồng bộ app_records: tải về khi đăng nhập / quay lại tab, tự đẩy lên sau mỗi thay đổi (gom 0,8 giây).
 * Trước khi tải về luôn đẩy nốt thay đổi đang chờ, để không mất bài vừa làm.
 */
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useApp } from "@/lib/store/app-store";
import { cloudErrorVi } from "./mapping";
import { collectRows, diffRows, rowsToPatch, snapshotOf, studentsOf, type RecordRow, type Snapshot } from "./records";

let snapshot: Snapshot = new Map();
let timer: ReturnType<typeof setTimeout> | null = null;
let pushing: Promise<void> | null = null;
let started = false;
let warned = 0;

const CHUNK = 200;

async function pushNow(): Promise<void> {
  const sb = supabaseBrowser();
  const s = useApp.getState();
  if (!sb || !s.userId) return;
  const next = collectRows(s);
  const { upserts, deletes } = diffRows(snapshot, next, s.userId, studentsOf(s, s.userId));
  if (!upserts.length && !deletes.length) return;
  let failed: { message?: string; code?: string } | null = null;
  for (let i = 0; i < upserts.length && !failed; i += CHUNK) {
    const { error } = await sb.from("app_records").upsert(upserts.slice(i, i + CHUNK), { onConflict: "kind,id" });
    if (error) failed = error;
  }
  for (const d of deletes) {
    if (failed) break;
    const { error } = await sb.from("app_records").delete().match(d);
    if (error) failed = error;
  }
  if (failed) {
    // Báo tối đa mỗi phút một lần; lần đẩy sau sẽ thử lại vì ảnh chụp chưa cập nhật.
    if (Date.now() - warned > 60_000) { warned = Date.now(); toast.error(`Chưa lưu được lên máy chủ: ${cloudErrorVi(failed)}`); }
    return;
  }
  snapshot = snapshotOf(next.values());
}

/** Đẩy ngay các thay đổi đang chờ (gọi trước khi tải về hoặc khi rời trang). */
export function flushRecords(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null; }
  pushing ??= pushNow().finally(() => { pushing = null; });
  return pushing;
}

/** Tải mọi bản ghi tài khoản này được xem (RLS lọc) và thay phần tương ứng trong kho. */
export async function pullRecords(): Promise<void> {
  const sb = supabaseBrowser();
  if (!sb || !useApp.getState().userId) return;
  await flushRecords();
  const rows: RecordRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("app_records").select("kind, id, owner_id, shared, class_ids, data").range(from, from + 999);
    if (error) { toast.error(`Không tải được bài tập và kết quả: ${cloudErrorVi(error)}`); return; }
    rows.push(...(data as RecordRow[]));
    if (data.length < 1000) break;
  }
  const patch = rowsToPatch(rows);
  snapshot = snapshotOf(collectRows({ ...useApp.getState(), ...patch }).values());
  useApp.setState(patch);
}

/** Bật tự đẩy lên sau mỗi thay đổi của kho (một lần cho cả phiên). */
export function startRecordSync() {
  if (started) return;
  started = true;
  useApp.subscribe(() => {
    if (!useApp.getState().userId) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flushRecords(), 800);
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void flushRecords(); });
}

/** Đăng xuất: quên ảnh chụp để tài khoản sau không bị so với dữ liệu của người trước. */
export function resetRecordSync() {
  if (timer) { clearTimeout(timer); timer = null; }
  snapshot = new Map();
}

"use client";
/**
 * Đồng bộ với Supabase khi chạy bản thật (giai đoạn 1: người dùng, lớp học, ghi danh).
 * Cách làm: giao diện đổi kho dữ liệu ngay (phản hồi tức thì) rồi ghi lên Supabase; ghi lỗi thì báo và tải lại từ máy chủ.
 * RLS trên Supabase quyết định mỗi người đọc/ghi được gì — app không tự lọc thay.
 */
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { profileToUser, type ProfileRow } from "@/lib/auth/profile";
import { useApp } from "@/lib/store/app-store";
import type { ClassRoom } from "@/lib/domain/types";
import { CLASS_COLUMNS, classToRow, cloudErrorVi, parseEnrollmentId, rowToClass, rowToEnrollment, type ClassRow, type EnrollmentRow } from "./mapping";

let pulling: Promise<void> | null = null;

/** Tải người dùng, lớp và ghi danh mà tài khoản hiện tại được xem; thay phần tương ứng trong kho. */
export function pullCore(): Promise<void> {
  pulling ??= (async () => {
    const sb = supabaseBrowser();
    if (!sb || !useApp.getState().userId) return;
    const [p, c, e] = await Promise.all([
      sb.from("profiles").select("id, role, full_name, email"),
      sb.from("classes").select(CLASS_COLUMNS),
      sb.from("enrollments").select("class_id, student_id"),
    ]);
    const err = p.error ?? c.error ?? e.error;
    if (err) { toast.error(`Không tải được dữ liệu lớp: ${cloudErrorVi(err)}`); return; }
    const me = useApp.getState().users.find((u) => u.id === useApp.getState().userId);
    const users = (p.data as ProfileRow[]).map(profileToUser);
    if (me && !users.some((u) => u.id === me.id)) users.push(me);
    useApp.setState({
      users,
      classes: (c.data as ClassRow[]).map(rowToClass),
      enrollments: (e.data as EnrollmentRow[]).map(rowToEnrollment),
    });
  })().finally(() => { pulling = null; });
  return pulling;
}

/** Ghi lên máy chủ; lỗi thì báo bằng tiếng Việt và tải lại để giao diện khớp dữ liệu thật. */
async function write(label: string, run: () => PromiseLike<{ error: { message?: string; code?: string } | null }>) {
  const { error } = await run();
  if (error) {
    toast.error(`${label}: ${cloudErrorVi(error)}`);
    await pullCore();
    return false;
  }
  return true;
}

const sb = () => supabaseBrowser()!;

export const cloud = {
  createClass: (c: ClassRoom) => write("Chưa tạo được lớp", () => sb().from("classes").insert(classToRow(c))),
  updateClass: (id: string, patch: Partial<ClassRoom>) => {
    const row = classToRow(patch);
    delete row.id;
    delete row.teacher_id; // không đổi chủ lớp từ giao diện
    return Object.keys(row).length ? write("Chưa lưu được lớp", () => sb().from("classes").update(row).eq("id", id)) : Promise.resolve(true);
  },
  deleteClass: (id: string) => write("Chưa xóa được lớp", () => sb().from("classes").delete().eq("id", id)),
  removeEnrollment: (enrollmentId: string) => {
    const k = parseEnrollmentId(enrollmentId);
    return k ? write("Chưa xóa được học sinh khỏi lớp", () => sb().from("enrollments").delete().match(k)) : Promise.resolve(false);
  },
};

/** Học sinh vào lớp bằng mã mời (hàm join_class trên máy chủ kiểm tra mã và vai trò). Trả về tên lớp, hoặc câu lỗi. */
export async function joinClassCloud(code: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const client = supabaseBrowser();
  if (!client) return { ok: false, error: "Chưa kết nối máy chủ." };
  const { data, error } = await client.rpc("join_class", { p_code: code.trim() });
  if (error) return { ok: false, error: cloudErrorVi(error) };
  await pullCore();
  return { ok: true, name: useApp.getState().classes.find((c) => c.id === data)?.name ?? "" };
}

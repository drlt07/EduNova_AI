import { describe, expect, it } from "vitest";
import { isGatedPath, roleArea, safeInternal, safeNext } from "@/lib/auth/paths";
import { authErrorVi } from "@/lib/auth/errors";
import { profileToUser } from "@/lib/auth/profile";

describe("chuyển hướng sau đăng nhập", () => {
  it("chỉ quay lại trang chức năng hoặc đúng khu vực vai trò", () => {
    expect(safeNext("/labs/smart-garden?x=1", "student")).toBe("/labs/smart-garden?x=1");
    expect(safeNext("/teacher/courses", "teacher")).toBe("/teacher/courses");
    expect(safeNext("/teacher/courses", "student")).toBeNull();
    expect(safeNext("/about", "student")).toBeNull();
  });

  it("chặn chuyển hướng ra ngoài trang", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", "", null]) expect(safeNext(bad, "teacher")).toBeNull();
    expect(safeInternal("//evil.com", "/")).toBe("/");
    expect(safeInternal("/reset-password")).toBe("/reset-password");
  });

  it("nhận diện khu vực vai trò và trang cần đăng nhập", () => {
    expect(roleArea("/admin")).toBe("admin");
    expect(roleArea("/teachers")).toBeNull();
    expect(isGatedPath("/curriculum")).toBe(true);
    expect(isGatedPath("/labsx")).toBe(false);
  });
});

describe("thông báo lỗi", () => {
  it("dịch lỗi Supabase sang tiếng Việt, không lộ chi tiết", () => {
    expect(authErrorVi("Invalid login credentials")).toBe("Email hoặc mật khẩu không đúng.");
    expect(authErrorVi("Email not confirmed")).toMatch(/xác nhận email/);
    expect(authErrorVi("User already registered")).toMatch(/đã có tài khoản/);
    expect(authErrorVi("pg: relation profiles does not exist")).toBe("Có lỗi xảy ra. Vui lòng thử lại.");
  });
});

it("hồ sơ thành người dùng giao diện, màu avatar ổn định", () => {
  const p = { id: "8f2c0f0e-1111-2222-3333-444455556666", role: "teacher" as const, full_name: "Cô Hà", email: "ha@thpt-a.edu.vn" };
  const u = profileToUser(p);
  expect(u).toMatchObject({ id: p.id, role: "teacher", name: "Cô Hà", email: p.email });
  expect(profileToUser(p).hue).toBe(u.hue);
  expect(u.hue).toBeGreaterThanOrEqual(0);
  expect(u.hue).toBeLessThan(360);
});

import { describe, expect, it } from "vitest";
import { DEMO_PASSWORD, hashPassword, verifyLogin, WRONG } from "@/lib/auth/local-auth";
import type { User } from "@/lib/domain/types";

const seed: User = { id: "s1", role: "student", name: "Lê Minh Khang", email: "s1@demo.edunova.vn", hue: 1 };
const own: User = { id: "s-x", role: "student", name: "An", email: "an@gmail.com", hue: 2 };

describe("đăng nhập email + mật khẩu (bản dùng thử)", () => {
  it("băm mật khẩu có muối, không lưu chữ gốc", async () => {
    const a = await hashPassword("matkhau123");
    const b = await hashPassword("matkhau123");
    expect(a.hash).not.toContain("matkhau");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect((await hashPassword("matkhau123", a.salt)).hash).toBe(a.hash);
  });

  it("tài khoản mẫu dùng mật khẩu chung; email không phân biệt hoa thường", async () => {
    expect((await verifyLogin("S1@Demo.EduNova.vn ", DEMO_PASSWORD, [seed], {})).ok).toBe(true);
    expect(await verifyLogin("s1@demo.edunova.vn", "sai", [seed], {})).toEqual({ ok: false, error: WRONG });
  });

  it("tài khoản tự đăng ký kiểm tra theo băm; sai email và sai mật khẩu cùng một thông báo", async () => {
    const cred = await hashPassword("hocTin2026");
    expect((await verifyLogin("an@gmail.com", "hocTin2026", [own], { "s-x": cred })).ok).toBe(true);
    expect(await verifyLogin("an@gmail.com", "hoctin2026", [own], { "s-x": cred })).toEqual({ ok: false, error: WRONG });
    expect(await verifyLogin("khongco@gmail.com", "x", [own], { "s-x": cred })).toEqual({ ok: false, error: WRONG });
  });

  it("tài khoản mẫu đã có mật khẩu riêng thì mật khẩu chung không dùng được nữa", async () => {
    const cred = await hashPassword("rieng-123");
    expect((await verifyLogin("s1@demo.edunova.vn", DEMO_PASSWORD, [seed], { s1: cred })).ok).toBe(false);
  });
});

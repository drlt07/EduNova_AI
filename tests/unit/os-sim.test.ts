import { describe, expect, it } from "vitest";
import {
  EXAM_APP, FS_GOALS, INITIAL_FS, INITIAL_PROCS, OS_SCENARIOS, TRASH, createFolder, deleteNode, endProcess, launch, memoryUse, moveNode, nodeById, pathOf, renameNode, restoreNode,
  type FsNode, type FsResult,
} from "@/lib/sim/os-sim";

const ok = (r: FsResult): FsNode[] => {
  if (!r.ok) throw new Error(r.message);
  return r.fs;
};

describe("quản lí tệp", () => {
  it("làm đủ 5 việc thì mọi mục tiêu đạt, đường dẫn đúng kiểu Windows", () => {
    let fs = ok(createFolder(INITIAL_FS, "docs", "Tin11"));
    const tin11 = fs.find((n) => n.name === "Tin11")!.id;
    fs = ok(moveNode(fs, "f-bai", tin11));
    fs = ok(renameNode(fs, "f-bai", "bai1-hello.py"));
    fs = ok(deleteNode(fs, "f-cu"));
    fs = ok(deleteNode(fs, "f-van"));
    fs = ok(restoreNode(fs, "f-van"));
    expect(FS_GOALS.every((g) => g.done(fs))).toBe(true);
    expect(pathOf(fs, "f-bai")).toBe("C:\\Users\\An\\Documents\\Tin11\\bai1-hello.py");
  });

  it("chặn tên trùng, tên sai kí tự và thao tác trên tệp hệ thống", () => {
    expect(createFolder(INITIAL_FS, "an", "documents").ok).toBe(false);
    expect(createFolder(INITIAL_FS, "docs", "a:b").ok).toBe(false);
    expect(deleteNode(INITIAL_FS, "f-sys").message).toMatch(/hệ điều hành/);
    expect(moveNode(INITIAL_FS, "users", "an").ok).toBe(false);
  });

  it("xóa vào Thùng rác rồi mới xóa vĩnh viễn; đổi phần mở rộng thì cảnh báo", () => {
    const fs = ok(deleteNode(INITIAL_FS, "f-anh"));
    expect(nodeById(fs, "f-anh")?.parent).toBe(TRASH);
    expect(nodeById(ok(deleteNode(fs, "f-anh")), "f-anh")).toBeUndefined();
    expect(renameNode(INITIAL_FS, "f-anh", "anh-lop.txt").message).toMatch(/phần mở rộng/);
  });
});

describe("tiến trình và bộ nhớ", () => {
  it("ban đầu RAM quá tải; phần mềm thi không chạy được cho tới khi giải phóng RAM", () => {
    expect(memoryUse(INITIAL_PROCS).slow).toBe(true);
    expect(launch(INITIAL_PROCS, EXAM_APP).ok).toBe(false);
    const a = endProcess(INITIAL_PROCS, "chrome");
    const b = endProcess(a.procs, "game");
    expect(launch(b.procs, EXAM_APP).ok).toBe(true);
  });

  it("không cho tắt tiến trình hệ thống; tắt Word chưa lưu thì mất bài (tính lỗi)", () => {
    const k = endProcess(INITIAL_PROCS, "kernel");
    expect(k.ok).toBe(false);
    expect(k.mistake).toBe(true);
    const w = endProcess(INITIAL_PROCS, "word");
    expect(w.ok && w.mistake).toBe(true);
    expect(w.message).toMatch(/CHƯA LƯU/);
  });
});

it("mỗi tình huống có một chức năng đáp án", () => {
  expect(new Set(OS_SCENARIOS.map((s) => s.answer)).size).toBe(OS_SCENARIOS.length);
});

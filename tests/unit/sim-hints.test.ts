import { describe, expect, it } from "vitest";
import { buildLadder, faultLadder, pathLadder } from "@/lib/ai/sim-hints";
import { NET_FAULTS, PATH_TASKS } from "@/lib/sim/network";
import { ruleTutor, type TutorRequest } from "@/lib/ai/tutor-core";

const gw = NET_FAULTS.find((f) => f.fault === "pc2-gateway")!;
const all = (xs: string[]) => xs.join(" ");

describe("AI Gia sư hỏi gợi mở theo trạng thái mô phỏng", () => {
  it("chưa chạy lệnh nào: gợi ý ping trong LAN trước", () => {
    expect(faultLadder(gw, [])[0]).toMatch(/ping .*máy in/);
  });

  it("LAN thông, ra ngoài không được, đã ipconfig: hỏi gateway có trùng router chưa — không nói đáp án", () => {
    const l = faultLadder(gw, [{ target: "printer", ok: true }, { target: "server", ok: false }, { target: "ipconfig", ok: true }]);
    expect(all(l)).toMatch(/192\.168\.1\.254/);
    expect(all(l)).toMatch(/Router .* địa chỉ IP bao nhiêu/);
    expect(all(l)).not.toMatch(/khai sai|sửa lại|đáp án/i);
    expect(all(l)).not.toContain(gw.options[gw.answer]);
  });

  it("em chọn sai: hỏi lại bằng chứng, không nói lựa chọn đúng", () => {
    const l = faultLadder(gw, [{ target: "printer", ok: true }], 0);
    expect(l[0]).toContain(gw.options[0]);
    expect(all(l)).not.toContain(gw.options[gw.answer]);
  });

  it("chọn sai chặng: hỏi về nối trực tiếp và cùng dải mạng", () => {
    const print = PATH_TASKS.find((t) => t.id === "print")!;
    const l = pathLadder(print, ["pc1", "switch"], "router");
    expect(l[0]).toMatch(/nối trực tiếp/);
    expect(all(l)).toMatch(/cùng mạng 192\.168\.1\.x/);
  });

  it("xây mạng: hỏi về nhu cầu từng khu vực, không nêu thiết bị cần đặt", () => {
    const l = buildLadder({ lab: "router" });
    expect(l[0]).toMatch(/đủ cổng/);
    expect(all(l)).not.toMatch(/đặt switch|cần switch/i);
  });

  it("bộ luật dùng đúng bậc câu hỏi theo số gợi ý đã nhận", () => {
    const base: TutorRequest = { capability: "debug", message: "", level: "guided", topic: "general", hintCount: 0, state: { kind: "simulation", sim: "x", summary: "", problems: [], facts: {}, ladder: ["Câu 1?", "Câu 2?"] } };
    expect(ruleTutor(base).reply).toContain("Câu 1?");
    expect(ruleTutor({ ...base, hintCount: 1 }).reply).toContain("Câu 2?");
    expect(ruleTutor({ ...base, hintCount: 5 }).reply).toContain("Câu 2?");
    expect(ruleTutor({ ...base, level: "exam" }).reply).toMatch(/tạm tắt/);
  });
});

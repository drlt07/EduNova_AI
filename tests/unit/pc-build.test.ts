import { describe, expect, it } from "vitest";
import { DATA_PATH, FAULTS, PARTS, newBuild, nextDataStep, placePart, powerOn, stars, type DataNode, type PartId } from "@/lib/sim/pc-build";

const build = (ids: PartId[]) => ids.reduce((s, id) => placePart(s, id, PARTS.find((p) => p.id === id)!.slot).state, newBuild());

describe("lắp máy", () => {
  it("đặt sai khe thì không lắp, tính một lỗi và giải thích", () => {
    const r = placePart(build(["motherboard"]), "ram", "pcie");
    expect(r.ok).toBe(false);
    expect(r.state.placed).not.toContain("ram");
    expect(r.state.mistakes).toBe(1);
    expect(r.message).toMatch(/PCIe/);
  });

  it("phải lắp theo thứ tự: bo mạch trước CPU, CPU trước tản nhiệt", () => {
    expect(placePart(newBuild(), "cpu", "socket").message).toMatch(/bo mạch chủ trước/);
    expect(placePart(build(["motherboard"]), "cooler", "cooler-mount").message).toMatch(/cpu .*trước/i);
    expect(placePart(build(["motherboard", "cpu"]), "cooler", "cooler-mount").ok).toBe(true);
  });

  it("lắp đủ theo đúng thứ tự thì không có lỗi", () => {
    const s = build(["psu", "motherboard", "cpu", "cooler", "ram", "ssd", "gpu"]);
    expect(s.placed).toHaveLength(PARTS.length);
    expect(s.mistakes).toBe(0);
  });
});

describe("bật nguồn (POST)", () => {
  it("dừng ở linh kiện thiếu đầu tiên với triệu chứng đúng như máy thật", () => {
    const noRam = powerOn(build(["psu", "motherboard", "cpu", "cooler", "gpu", "ssd"]));
    expect(noRam.booted).toBe(false);
    expect(noRam.steps.at(-1)).toMatchObject({ label: "RAM", ok: false });
    expect(noRam.steps.at(-1)!.detail).toMatch(/bíp/);
    expect(powerOn(build(["psu", "motherboard", "cpu", "cooler", "ram", "gpu"])).screen).toBe("No bootable device");
    expect(powerOn(build(["psu", "motherboard", "cpu", "cooler", "ram", "ssd"])).screen).toBe("No signal");
    expect(powerOn(newBuild()).steps).toHaveLength(1);
  });

  it("đủ linh kiện thì khởi động được", () => {
    expect(powerOn(build(["psu", "motherboard", "cpu", "cooler", "ram", "ssd", "gpu"])).booted).toBe(true);
  });
});

describe("đường đi dữ liệu", () => {
  it("SSD → RAM → CPU → GPU → màn hình; bỏ qua RAM thì bị nhắc", () => {
    expect(nextDataStep(["ssd"], "cpu")).toMatchObject({ ok: false });
    expect(nextDataStep(["ssd"], "cpu").message).toMatch(/không đọc trực tiếp từ SSD/);
    const chosen: DataNode[] = [];
    let last = { ok: false, done: false };
    for (const n of DATA_PATH) {
      last = nextDataStep(chosen, n);
      expect(last.ok).toBe(true);
      chosen.push(n);
    }
    expect(last.done).toBe(true);
  });
});

it("mỗi sự cố có đáp án là một linh kiện có thật; sao theo số lỗi", () => {
  for (const f of FAULTS) expect(PARTS.some((p) => p.id === f.answer)).toBe(true);
  expect([stars(0), stars(3), stars(9)]).toEqual([3, 2, 1]);
});

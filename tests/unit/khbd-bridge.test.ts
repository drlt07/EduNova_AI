import { describe, expect, it } from "vitest";
import { docVaPhanTichDocx } from "@khbd/lib/pipeline/1-tai-len/kiem-tra";
import { LUA_CHON_BAT_DAU, chuanHoaLuaChon, doiViec } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { hoatDongDeGanHocLieu, tomTatHoatDong } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { getLesson } from "@/lib/data/curriculum";
import { buildStarterDraft, starterDocx } from "@/lib/khbd/starter";
import { applyActivity, simToResource, suggestSimulations, toPlanActivities } from "@/lib/khbd/bridge";

const IF = getLesson("L-10-if-kntt")!;

async function parseStarter(periods = 2) {
  const draft = buildStarterDraft(IF, periods);
  const kq = await docVaPhanTichDocx("khoi_dau.docx", await starterDocx(draft));
  return { draft, kq, pt: kq.phanTich };
}

describe("Soạn mới: bản khởi đầu từ chương trình", () => {
  it("dùng dữ liệu bài học (yêu cầu cần đạt, câu hỏi, bài tập) và có đủ 4 hoạt động", () => {
    const d = buildStarterDraft(IF, 2);
    expect(d.knowledge).toContain("Viết được câu lệnh rẽ nhánh if/else");
    expect(d.activities.map((a) => a.title)).toEqual(["Hoạt động 1: Khởi động", "Hoạt động 2: Hình thành kiến thức mới", "Hoạt động 3: Luyện tập", "Hoạt động 4: Vận dụng"]);
    expect(d.activities[2].body).toMatch(/^Câu 1\./);
    expect(d.activities[3].body).toContain("mô phỏng");
  });

  it("trợ lý đọc bản khởi đầu như KHBD tải lên: nhận đúng môn, lớp, số tiết, mục tiêu và 4 hoạt động", async () => {
    const { pt, draft } = await parseStarter(3);
    expect(pt.thongTin.mon).toBe("TIN_HOC");
    expect(pt.thongTin.lop).toBe(10);
    expect(pt.thongTin.soTiet).toBe(3);
    expect(pt.thongTin.tenBai).toBe(`BÀI ${IF.order}. ${IF.title.toUpperCase()}`);
    expect(pt.hoatDong.map((h) => h.loai)).toEqual(["khoi_dong", "hinh_thanh", "luyen_tap", "van_dung"]);
    const mucTieu = pt.doan.filter((x) => x.loai === "MT").map((x) => x.vanBan);
    for (const dong of draft.knowledge.split("\n")) expect(mucTieu.some((m) => m.includes(dong.slice(0, 30)))).toBe(true);
  });
});

describe("Gợi ý mô phỏng và lưu vào KHBD EduNova", () => {
  it("bài if: gợi ý mô phỏng dùng được trước, gắn vào hoạt động vận dụng", async () => {
    const { pt } = await parseStarter();
    const lc = chuanHoaLuaChon(LUA_CHON_BAT_DAU);
    const kh = lapKeHoach(pt, pt.thongTin, lc);
    const acts = hoatDongDeGanHocLieu(pt, pt.thongTin, lc, kh, {}).map((a) => ({ ...a, loai: pt.hoatDong.find((h) => h.ma === a.hd)?.loai }));
    const s = suggestSimulations(IF, acts);
    expect(s.map((x) => x.lab.slug)).toEqual(expect.arrayContaining(["smart-garden", "smart-coding-city"]));
    const firstPlanned = s.findIndex((x) => x.lab.status === "planned");
    expect(firstPlanned === -1 || s.slice(firstPlanned).every((x) => x.lab.status === "planned")).toBe(true);
    const vanDung = acts.find((a) => a.loai === "van_dung")!.hd;
    expect(s[0].hd).toBe(vanDung);
    expect(applyActivity([{ hd: "HD1", ten: "HĐ I" }, { hd: "HD3", ten: "HĐ III" }, { hd: "HD4", ten: "HĐ IV" }])).toBe("HD3");
  });

  it("bản soạn → hoạt động EduNova đúng giai đoạn, mô phỏng đã gắn thành labTemplateId", async () => {
    const { pt } = await parseStarter();
    const lc = chuanHoaLuaChon(doiViec(LUA_CHON_BAT_DAU, "nls", false));
    const kh = lapKeHoach(pt, pt.thongTin, lc);
    const acts = hoatDongDeGanHocLieu(pt, pt.thongTin, lc, kh, {});
    const city = suggestSimulations(IF, acts.map((a) => ({ ...a, loai: pt.hoatDong.find((h) => h.ma === a.hd)?.loai }))).find((x) => x.lab.slug === "smart-coding-city")!;
    const res = [simToResource(city, acts[3].hd)];
    const plan = toPlanActivities(tomTatHoatDong(pt, pt.thongTin, lc, kh, { hoc_lieu: res }), res, IF.objectiveIds);
    expect(plan.map((p) => p.phase)).toEqual(["mo-dau", "hinh-thanh", "luyen-tap", "van-dung"]);
    expect(plan[3].labTemplateId).toBe(city.lab.id);
    expect(plan[3].organization + plan[3].content).toContain("Giao lộ thông minh");
    expect(plan[0].labTemplateId).toBeUndefined();
  });
});

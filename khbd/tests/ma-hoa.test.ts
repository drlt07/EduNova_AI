import { describe, expect, it } from "vitest";
import { doanMaHoa, maHoaTheoPhong, tcvn3SangUnicode, unicodeSangTcvn3, vniSangUnicode } from "@khbd/lib/pipeline/1-tai-len/ma-hoa";

describe("TCVN3 → Unicode", () => {
  it("đổi chữ thường có dấu", () => {
    expect(tcvn3SangUnicode("Hµ Néi")).toBe("Hà Nội");
    expect(tcvn3SangUnicode("Ta th­êng tíi b÷a quªn ¨n, nöa ®ªm vç gèi")).toBe("Ta thường tới bữa quên ăn, nửa đêm vỗ gối");
  });
  it("phông .VnTimeH hiển thị chữ hoa", () => {
    expect(maHoaTheoPhong(".VnTimeH")).toEqual({ maHoa: "tcvn3", chuHoa: true });
    expect(tcvn3SangUnicode("môc tiªu", true)).toBe("MỤC TIÊU");
  });
  it("đổi đi đổi lại không mất chữ", () => {
    const s = "nước mắt đầm đìa, ruột đau như cắt";
    expect(tcvn3SangUnicode(unicodeSangTcvn3(s))).toBe(s);
  });
});

describe("VNI → Unicode", () => {
  it("đổi chữ có dấu ghép", () => {
    expect(vniSangUnicode("Vieät Nam")).toBe("Việt Nam");
    expect(vniSangUnicode("Ñaát nöôùc")).toBe("Đất nước");
    expect(vniSangUnicode("hoïc sinh")).toBe("học sinh");
  });
  it("nhận phông VNI", () => {
    expect(maHoaTheoPhong("VNI-Times").maHoa).toBe("vni");
    expect(maHoaTheoPhong("Times New Roman").maHoa).toBe("unicode");
  });
});

describe("đoán mã văn bản không có phông", () => {
  it("phân biệt Unicode, TCVN3, VNI", () => {
    expect(doanMaHoa("Kế hoạch bài dạy môn Toán lớp 10")).toBe("unicode");
    expect(doanMaHoa("KÕ ho¹ch bµi d¹y m«n To¸n líp 10 ®Çy ®ñ")).toBe("tcvn3");
    expect(doanMaHoa("Keá hoaïch baøi daïy moân Toaùn lôùp 10")).toBe("vni");
  });
});

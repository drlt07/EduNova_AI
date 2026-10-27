/**
 * Dữ liệu giả lập đúng khuôn cho từng lượt – chỉ để chạy thử và test, mọi câu đều ghi rõ "giả lập"
 * để không bao giờ bị nhầm là nội dung soạn thật.
 */
import type { NguCanhSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import type { DocHinh } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import type { YeuCauLlm } from "./index";
import { phanTichHam } from "@khbd/lib/toan/bang-bien-thien";
import { hamSo } from "@khbd/lib/toan/bieu-thuc";
import { diemTuBbt, nhanSo } from "@khbd/lib/toan/do-thi";
import { doanCuaHoatDong } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { maTranCauHoi } from "@khbd/lib/pipeline/4-sinh-noi-dung/ma-tran-cau-hoi";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { HANH_VI_SO } from "@khbd/lib/pipeline/2-lua-chon/goi-y-trien-khai";
import { phutHoatDong, phutTrongTen, thietBiCoSan } from "@khbd/lib/pipeline/5-kiem-tra/kha-thi";

/** Chia số phút cho các bước mẫu (bỏ bớt bước khi thời lượng ngắn); tổng đúng bằng thời lượng. */
function chiaBuoc(phut: number, mau: { ten: string; gv: string; hs: string }[]) {
  const p = phut || 10;
  const ds = mau.slice(0, p < 6 ? 2 : 3);
  const moi = Math.floor(p / ds.length);
  return ds.map((b, i) => ({ ...b, phut: i === ds.length - 1 ? p - moi * (ds.length - 1) : moi }));
}

const G = "(giả lập)";

/**
 * Đọc hình giả lập: không nhìn ảnh, chỉ dựa vào đoạn văn ngay trước ảnh (vd "Bảng biến thiên của hàm số y = …")
 * và tự tính bằng app, để chạy thử luồng đọc – đối chiếu – tạo lại với giáo án mẫu.
 */
export function docHinhGiaLap(noiDung: string): DocHinh {
  const truoc = /Đoạn văn quanh hình:\n([^\n]*)/.exec(noiDung)?.[1] ?? "";
  const ham = /y\s*=\s*(.+?)(?:\s+có(?!\p{L})|:|\.\s|$)/u.exec(truoc)?.[1]?.replace(/−/g, "-").trim() ?? "";
  const rong: DocHinh = {
    loai: "khac", moTa: `Hình minh họa trong giáo án ${G}.`, ham: "", chacChan: "cao", congThuc: "", bang: [],
    bangBienThien: { x: [], daoHamMoc: [], daoHam: [], y: [] }, doThi: { diem: [], tiemCanDung: [], tiemCanNgang: [] },
  };
  try {
    if (/bảng biến thiên/i.test(truoc) && ham) {
      const b = phanTichHam(ham);
      const x = b.moc.map((m) => (m.loai === "vo_cuc" ? (m.x < 0 ? "-\\infty" : "+\\infty") : nhanSo(m.x)));
      const y = b.moc.map((m) => (m.loai === "tiem_can" ? `${nhanSo(m.yTrai)}||${nhanSo(m.yPhai)}` : nhanSo(m.y)));
      const daoHamMoc = b.moc.map((m) => (m.loai === "tiem_can" ? "||" : m.loai === "diem" && m.daoHam0 ? "0" : ""));
      return { ...rong, loai: "bang_bien_thien", ham, moTa: `Bảng biến thiên của hàm số $y=${ham}$ ${G}.`, bangBienThien: { x, daoHamMoc, daoHam: b.dau, y } };
    }
    if (/đồ thị/i.test(truoc) && ham) {
      const d = diemTuBbt(phanTichHam(ham), ham);
      return { ...rong, loai: "do_thi", ham, moTa: `Đồ thị hàm số $y=${ham}$ ${G}.`, doThi: { diem: (d.diem ?? []).map((p) => ({ x: p.x, y: p.y })), tiemCanDung: d.tiemCanDung ?? [], tiemCanNgang: d.tiemCanNgang ?? [] } };
    }
    if (/đạo hàm/i.test(truoc) && ham) return { ...rong, loai: "cong_thuc", moTa: `Đạo hàm của hàm số ${G}.`, congThuc: "y' = 3x^{2} - 6x = 3x(x - 2)" };
    if (/bảng giá trị/i.test(truoc) && ham) {
      const xs = [-1, 0, 1, 2, 3];
      const f = hamSo(ham);
      return { ...rong, loai: "bang", moTa: `Bảng giá trị của hàm số ${G}.`, bang: [["$x$", ...xs.map((v) => `$${v}$`)], ["$y$", ...xs.map((v) => `$${nhanSo(f(v))}$`)]] };
    }
  } catch { /* hàm không đọc được: coi là hình minh họa */ }
  return rong;
}

/**
 * Soạn lại một hoạt động (giả lập): câu hỏi, bảng, công thức đặt vào bước luyện; đoạn có việc GV/HS (cách tổ chức cũ)
 * được thay; đoạn còn lại (kiến thức, ví dụ) đặt vào bước đầu.
 */
function hdMoiGiaLap(ctx: NguCanhSoan, maHd: string) {
  const h = ctx.hoatDong.find((x) => x.ma === maHd);
  const ho = doanCuaHoatDong(ctx, maHd);
  const toChucCu = ho.filter((d) => d.loai !== "CH" && !d.vanBan.includes("$") && /(^|[^\p{L}])(GV|HS|giáo viên|học sinh)([^\p{L}]|$)/u.test(d.vanBan));
  const luyen = ho.filter((d) => d.loai === "CH" || d.vanBan.includes("$"));
  const conLai = ho.filter((d) => !toChucCu.includes(d) && !luyen.includes(d));
  const buoc = chiaBuoc(phutTrongTen(h?.ten ?? "") || 10, [
    { ten: "Giao nhiệm vụ theo cách đã chọn", gv: `GV nêu nhiệm vụ cụ thể của hoạt động ${G}, chia nhóm 4 HS`, hs: `HS nhận vai, đọc tư liệu của bài ${G}` },
    { ten: "Thực hiện và trình bày", gv: `GV theo dõi, gợi ý nhóm gặp khó ${G}`, hs: `HS giải các câu hỏi của giáo viên, ghi kết quả lên bảng nhóm ${G}` },
    { ten: "Chốt kiến thức", gv: `GV chốt lời giải, sửa lỗi hay gặp ${G}`, hs: `HS tự sửa bài, ghi kết luận ${G}` },
  ]).map((b, i) => ({ ...b, maDoan: (i === 0 ? conLai : i === 1 ? luyen : []).map((d) => d.ma) }));
  return {
    mucTieu: `Mục tiêu của hoạt động ${G}.`, cachToChuc: `${ctx.luaChon.trienKhai[maHd] ?? "Cách đã chọn"} ${G}.`,
    buoc, thietBi: [], sanPham: `Bảng nhóm ghi lời giải ${G}.`, tieuChi: [`Lời giải đúng, trình bày rõ ${G}.`],
    doanThay: toChucCu.map((d) => d.ma),
  };
}

export function taoMauGiaLap(ctx: NguCanhSoan): (luot: string, yc?: YeuCauLlm) => unknown {
  const viTri = ctx.keHoach.oViTri.map((o) => o.ma);
  const viTriHd3 = viTri.find((v) => v.startsWith("HD3")) ?? viTri[viTri.length - 1] ?? "HD3_T1";
  const phut = (ctx.keHoach.thoiLuong ?? []).map((t) => t.muc.filter((m) => m.hd === "HD2").reduce((s, m) => s + m.phut, 0)).find((p) => p > 0) ?? 15;
  const mt = maTranCauHoi(ctx.thongTin.mon, phut);
  const mon = nangLucDacThu.mon.find((m) => m.ma_mon === ctx.thongTin.mon);
  // Công cụ số lấy trong thiết bị của giáo án; không có thì giao làm ở nhà.
  const tbSo = thietBiCoSan(ctx).flatMap((t) => t.split(/[,;]/)).map((t) => t.trim()).find((t) => /máy tính|phần mềm|geogebra|python|điện thoại/i.test(t));
  const congCuSo = tbSo ? `${tbSo.replace(/\.$/, "")} ${G}` : `thiết bị số của HS ở nhà ${G}`;
  const yeuCau = ctx.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.1").map((d) => d.ma);
  if (!yeuCau.length) yeuCau.push("KHONG");
  const thanhPhan = (mon?.nang_luc ?? []).flatMap((nl) => (nl.thanh_phan.length ? nl.thanh_phan.map((t) => t.ma) : [nl.ma]));
  const tinhHuongGv = ctx.doan.find((d) => d.hoatDongCu && ctx.hoatDong.find((h) => h.ma === d.hoatDongCu)?.loai === "khoi_dong" && d.loai !== "TD");

  return (luot, yc) => {
    if (luot.startsWith("tk_")) return hdMoiGiaLap(ctx, luot.slice(3));
    switch (luot) {
      case "doc_hinh":
        return docHinhGiaLap(yc?.noiDung ?? "");
      case "gd1":
        return { noiDungTuHoc: `Kiến thức nền của bài ${G}.`, cauHoi: ["Lý thuyết", "Cơ bản", "Nâng cao"].map((muc, i) => ({ muc, cauHoi: `Câu tự học mức ${muc} ${G}?`, dapAn: `Đáp án ${i + 1} ${G}.` })) };
      case "hd1":
        return { maDoanTinhHuong: tinhHuongGv?.ma ?? "", tinhHuong: tinhHuongGv ? "" : `Tình huống mở đầu ${G}.`, cauHoi: `Câu hỏi mở đầu ${G}?`, nhanDinh: [1, 2].map((i) => ({ nhanDinh: `Nhận định dễ nhầm số ${i} ${G}`, ketLuan: `Kết luận đúng số ${i} ${G}.` })),
          cachToChuc: `Đóng vai tình huống mở đầu: 3 HS nhận 3 vai có quan điểm khác nhau ${G}`,
          buoc: chiaBuoc(phutHoatDong(ctx.keHoach, "HD1"), [
            { ten: "Diễn tình huống", gv: `phát thẻ vai và dữ kiện của tình huống mở đầu cho 3 HS ${G}`, hs: `3 HS diễn tình huống, cả lớp ghi các số liệu cần dùng ${G}` },
            { ten: "Tính nhanh theo cặp", gv: `nêu câu hỏi cần giải quyết, nhắc chọn phương án có căn cứ ${G}`, hs: `từng cặp tính toán, viết phương án vào giấy nháp ${G}` },
            { ten: "Chỉnh lỗi tự học", gv: `đưa 2 nhận định dễ nhầm lấy từ kết quả tự học ${G}`, hs: `giơ thẻ đúng/sai, giải thích lí do sửa lỗi ${G}` },
          ]),
          thietBi: [] };
      case "hd2":
        return { mucTieu: `HS rèn luyện kĩ năng của bài ${G}.`, giaoNhiemVu: `chia lớp theo 3 nhóm mức đạt từ kết quả tự học, phát phiếu nhiệm vụ riêng cho từng nhóm và nêu tiêu chí chấm ${G}`, thietBi: [],
          thucHien: [`HS làm lượt 1 các câu trên phiếu nhiệm vụ theo nhóm mức đạt ${G}.`, `Từng cặp đổi phiếu, đánh dấu câu sai và ghi lỗi hiểu ${G}.`], phanHoa: { namTot: `Nhiệm vụ mở rộng ${G}.`, canCungCo: `Nhiệm vụ củng cố ${G}.`, canHoTro: `Nhiệm vụ có gợi ý ${G}.` }, baoCao: `Hai nhóm có nhiều câu sai nhất chữa bài trên bảng, cả lớp đối chiếu đáp án ${G}.`, ketLuan: `Kiến thức trọng tâm ${G}.`, sanPham: `Phiếu kết quả của nhóm ${G}.` };
      case "cau_hoi":
        return {
          nhieuLuaChon: mt.nhieuLuaChon.map((mucDo, i) => ({ mucDo, cauHoi: `Câu nhiều lựa chọn ${i + 1} ${G}?`, phuongAn: ["Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4"], dapAn: "ABCD"[i % 4], loiHieu: ["Lỗi hiểu 1", "Lỗi hiểu 2", "Lỗi hiểu 3"], loiGiai: `Lời giải ${G}.`, cauTuongTu: `Câu tương tự ${G}?` })),
          dungSai: mt.dungSai.map((mucDo, i) => ({ mucDo, boiCanh: `Bối cảnh câu đúng sai ${i + 1} ${G}.`, y: [true, false, true, false].map((dung, j) => ({ noiDung: `Ý ${j + 1} ${G}.`, dung })) })),
          traLoiNgan: mt.traLoiNgan.map((mucDo, i) => ({ mucDo, cauHoi: `Câu trả lời ngắn ${i + 1} ${G}?`, dapAn: "2" })),
          tuLuan: Array.from({ length: mt.tuLuan }, (_, i) => ({ cauHoi: `Câu tự luận ${i + 1} ${G}.`, huongDanCham: `Ý chính ${G}.` })),
        };
      case "hd3":
        return { mucTieu: `HS vận dụng kiến thức vào tình huống thực tế ${G}.`, phuongPhap: `Giải quyết tình huống thực tiễn theo nhóm 4 HS ${G}`, thietBi: [],
          buoc: chiaBuoc(phutHoatDong(ctx.keHoach, "HD3"), [
            { ten: "Nhắc lại tình huống", gv: `chiếu lại tình huống mở đầu và yêu cầu sản phẩm của nhóm ${G}`, hs: `nêu lại dữ kiện, xác định đại lượng cần tìm ${G}` },
            { ten: "Giải theo nhóm", gv: `phát phiếu gợi ý cho nhóm còn lúng túng ${G}`, hs: `nhóm 4 HS lập luận, viết lời giải lên giấy A0 ${G}` },
            { ten: "Trình bày, phản biện", gv: `chấm nhanh bằng bảng kiểm 3 tiêu chí, nêu lỗi cần sửa ${G}`, hs: `2 nhóm trình bày, nhóm khác đặt câu hỏi phản biện ${G}` },
          ]), vanDung: [{ tieuDe: "Vận dụng 1", noiDung: `Giải tình huống mở đầu ${G}.`, loiGiai: `Lời giải ${G}.` }], sanPham: `Sản phẩm nhóm ${G}.`, tieuChi: [`Tiêu chí ${G}.`], danhGia: `GV dùng bảng kiểm 3 tiêu chí chấm lời giải của từng nhóm khi các nhóm báo cáo ${G}`, anToan: "" };
      case "hd4":
        return { exitTicket: (["NB", "TH", "VD"] as const).map((mucDo, i) => ({ mucDo, cauHoi: `Câu exit ticket ${i + 1} ${G}?`, dapAn: `Đáp án ${G}.` })), chotKienThuc: `Kiến thức trọng tâm của bài ${G}.` };
      case "dac_thu":
        return { thanhPhan: thanhPhan.slice(0, 2).map((ma, i) => ({ ma, bieuHien: `Học sinh nhận diện được nội dung trọng tâm số ${i + 1} của bài và vận dụng được nội dung đó để giải quyết nhiệm vụ học tập ${G}`, viTri: viTri[Math.min(i + 1, viTri.length - 1)] ?? viTriHd3, sanPham: `Sản phẩm ${G}`, yeuCau: [yeuCau[i % yeuCau.length]], tieuChi: `Đạt khi sản phẩm thể hiện đúng nội dung trọng tâm ${G}` })) };
      case "nls":
        return { nls: ctx.luaChon.maNls.map((ma) => ({ ma, viTri: viTriHd3, bieuHien: ma.startsWith("1.") ? `tìm kiếm và đối chiếu được thông tin của bài trên môi trường số ${G}` : `${HANH_VI_SO[ma.split(".").slice(0, 2).join(".")] ?? "thực hiện nhiệm vụ số của bài"} được trong bài ${G}`, congCu: congCuSo, phut: 5, dieuChinh: `rút bước giải theo nhóm bớt 5 phút ${G}`, minhChung: `tệp kết quả HS lưu ${G}`, tieuChi: `đạt khi có ít nhất 1 nguồn được đối chiếu ${G}` })) , boQua: [] };
      case "clil":
        return { tuKhoa: [{ en: "key word 1", vi: `từ khóa 1 ${G}` }, { en: "key word 2", vi: `từ khóa 2 ${G}` }], nhiemVu: [`HS dùng key words khi ghi phiếu học tập ${G}.`] };
      case "ai":
        return { cauLenhMau: `Hãy gợi ý các điểm cần kiểm tra ${G}, không viết câu trả lời hoàn chỉnh.`, doiChieu: `SGK và tư liệu gốc ${G}.` };
      case "kiem_dinh":
        return { dapAn: mt.nhieuLuaChon.map((_, i) => ({ cau: i + 1, dapAn: "ABCD"[i % 4] })) };
      case "tieng_anh":
        return { tieuDe: "Activity III. Real-world application (simulated)", mucTieu: "Students apply knowledge (simulated).", toChuc: ["Students work in groups (simulated)."], nhiemVu: ["Application 1 (simulated)."], sanPham: "Group product (simulated).", tieuChi: ["Achieved when (simulated)."] };
      case "goi_y_to_chuc": {
        const ds = ctx.luaChon.lhdn ? ["GD1", "HD1", "HD2", "HD3", "HD4"] : ctx.hoatDong.map((h) => h.ma);
        return { hoatDong: ds.map((ma, i) => ({ ma, cachLam: i === 0 ? "Đóng kịch tình huống" : `Cách tổ chức ${i + 1}`, moTa: `HS thực hiện nhiệm vụ gắn với bài ${G}.`, tichHop: ctx.luaChon.nls && i === ds.length - 1 ? [`Mỗi HS dùng công cụ số để hoàn thành sản phẩm ${G}.`] : [], lyDo: `Hợp nội dung bài ${G}.` })) };
      }
      case "goi_y_nls":
        return { goiY: ctx.nlsChiBao.slice(0, 2).map((c) => ({ ma: c.ma, viTri: viTriHd3, lyDo: `Nhiệm vụ số phù hợp ${G}.` })) };
      default:
        return {};
    }
  };
}

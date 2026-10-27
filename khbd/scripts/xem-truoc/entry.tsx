/**
 * Bản xem trước chạy hoàn toàn trong trình duyệt (không cần máy chủ): dùng đúng các thành phần
 * giao diện và luồng xử lý của app; file .docx được đọc ngay trên máy.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { TaoKhbd } from "@khbd/app/tao-khbd/TaoKhbd";
import { TraCuuDacThu } from "@khbd/app/tra-cuu/nang-luc-dac-thu/TraCuuDacThu";
import { NguonDuLieu } from "@khbd/components/NguonDuLieu";
import { KhungTrang, TieuDeTrang, type BanDo, type TenTrang } from "@khbd/components/KhungTrang";
import { TrangChu } from "@khbd/components/TrangChu";
import { TraCuuNangLucSo } from "@khbd/components/TraCuuNangLucSo";
import type { HamDocFile } from "@khbd/components/tao-khbd/Buoc1TaiLen";
import { docVaPhanTichDocx, kiemTraFile } from "@khbd/lib/pipeline/1-tai-len/kiem-tra";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { adapterGiaLap } from "@khbd/lib/llm";
import { layAdapterSample } from "@khbd/lib/llm/sample";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { goiYMaNls, goiYToChuc, soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { docMotHinh } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import type { NguCanhSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import type { MoiTruongSoan } from "@khbd/app/tao-khbd/TaoKhbd";
import type { HamLayMau, HamLuuFile } from "@khbd/components/tao-khbd/Buoc56";

const docTrongTrinhDuyet: HamDocFile = async (file, _sgk, baoTienDo) => {
  if (kiemTraFile(file.name, file.size) === "pdf") throw new Error("Bản xem trước chỉ đọc file .docx. Bản chạy trên máy chủ đọc được cả PDF.");
  return docVaPhanTichDocx(file.name, new Uint8Array(await file.arrayBuffer()), baoTienDo);
};

// MAU_WORD: templates/mau.docx dạng base64, do build.mjs nhúng.
declare const MAU_WORD: string;
const tuBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const layMauNhung: HamLayMau = async () => tuBase64(MAU_WORD);

/** Trang trên Claude không tự tải file được: dùng quyền "downloads", người xem xác nhận lưu. */
const luuQuaClaude: HamLuuFile = async (tenFile, duLieu) => {
  const claude = (window as unknown as { claude?: { use(ten: string): Promise<{ save(r: { filename: string; data: Blob }): Promise<unknown> } | null> } }).claude;
  const tai = claude ? await claude.use("downloads") : null;
  if (!tai) throw { code: "unavailable" };
  await tai.save({ filename: tenFile, data: new Blob([duLieu.slice()]) });
};

// MAU_NHUNG: { tenFile: base64 } do build.mjs nhúng từ samples/input/.
declare const MAU_NHUNG: Record<string, string>;
const TEN_MAU: Record<string, string> = {
  "toan10_bat_phuong_trinh_bac_hai.docx": "Toán 10 – có công thức",
  "lich_su11_chien_tranh_bao_ve_to_quoc.docx": "Lịch sử 11 – có bảng, đoạn mã TCVN3",
  "hoa12_ester.docx": "Hóa học 12 – có phương trình",
  "tin10_bien_va_lenh_gan.docx": "Tin học 10 – lập trình Python",
  "toan12_don_dieu_cuc_tri.docx": "Toán 12 – có bảng biến thiên, đồ thị chụp ảnh",
};
/** Trong Claude: soạn bằng quyền "sample" (tài khoản người xem). Ngoài Claude: giả lập. */
const layAdapter = async (ctx: NguCanhSoan) => (await layAdapterSample()) ?? adapterGiaLap(taoMauGiaLap(ctx), { min: 500, max: 1000 });
const MOI_TRUONG: MoiTruongSoan = {
  soan: async (ma, ctx, truoc, signal) => soanMotLuot(ma, ctx, truoc, await layAdapter(ctx), signal),
  goiY: async (ctx, signal) => goiYMaNls(ctx, await layAdapter(ctx), signal),
  goiYToChuc: async (ctx, signal) => goiYToChuc(ctx, await layAdapter(ctx), signal),
  docHinh: async (hinh, ctx, signal) => docMotHinh(hinh, ctx.thongTin, await layAdapter(ctx), signal),
  giaLap: async () => (await layAdapterSample()) === null,
};

const MAU = Object.entries(TEN_MAU).map(([tenFile, ten]) => ({
  ten,
  layFile: async () => new File([Uint8Array.from(atob(MAU_NHUNG[tenFile]), (c) => c.charCodeAt(0))], tenFile),
}));

const BAN_DO: BanDo = { "trang-chu": "#trang-chu", "tao-khbd": "#tao-khbd", "dac-thu": "#dac-thu", "nang-luc-so": "#nang-luc-so" };

function docHash(): TenTrang {
  const h = location.hash.slice(1) as TenTrang;
  return h in BAN_DO ? h : "trang-chu";
}

function App() {
  const [trang, setTrang] = useState<TenTrang>(docHash);
  useEffect(() => {
    const f = () => { setTrang(docHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return (
    <KhungTrang banDo={BAN_DO} hienTai={trang}>
      {trang === "trang-chu" && <TrangChu banDo={BAN_DO} />}
      {trang === "tao-khbd" && (
        <>
          <TieuDeTrang tieuDe="Tạo KHBD" moTa="Tải giáo án cũ lên, chọn phần cần tích hợp và duyệt kế hoạch trước khi soạn." />
          <TaoKhbd docFile={docTrongTrinhDuyet} giaoAnMau={MAU} moiTruong={MOI_TRUONG} layMau={layMauNhung} luuFile={luuQuaClaude} khoaRieng={false} />
        </>
      )}
      {trang === "dac-thu" && (
        <>
          <TieuDeTrang tieuDe="Tra cứu năng lực đặc thù" moTa="Năng lực và thành phần năng lực theo chương trình các môn THPT. Chọn mục cần dùng để đưa vào bài soạn." />
          <TraCuuDacThu dsMon={nangLucDacThu.mon} />
          <NguonDuLieu />
        </>
      )}
      {trang === "nang-luc-so" && (
        <>
          <TieuDeTrang tieuDe="Tra cứu năng lực số" moTa="Chỉ báo bậc 5 (lớp 10 – 12) theo Thông tư 02/2025/TT-BGDĐT." />
          <TraCuuNangLucSo />
          <NguonDuLieu />
        </>
      )}
    </KhungTrang>
  );
}

createRoot(document.getElementById("app")!).render(<App />);

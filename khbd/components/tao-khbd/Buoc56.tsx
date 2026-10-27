"use client";

import { useEffect, useMemo, useState } from "react";
import type { PhanTichGiaoAn, ThongTinBai } from "@khbd/lib/pipeline/kieu";
import type { LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import type { KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { tenFileXuat, xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { htmlXemTruoc } from "@khbd/lib/pipeline/6-xuat-file/xem-truoc";
import { kiemTraFileXuat, NEN_TANG_HAY_GAP, type KetQuaKiemTra } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { kiemTraNoiDungSoan } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-noi-dung";
import { baoCaoBienTap, doanCanGiu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { TEN_LOAI_BIEN_TAP, type LoaiBienTap, type SuaDoi } from "@khbd/lib/pipeline/5-kiem-tra/bien-tap";
import type { NguCanhSoan, NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import type { HinhGoc } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import { chuanBiThayHinh, doiChieuCacHinh } from "@khbd/lib/pipeline/5-kiem-tra/doi-chieu-hinh";
import { rasterTrinhDuyet } from "@khbd/lib/pipeline/6-xuat-file/anh-trinh-duyet";
import { IconDung, IconFile, IconKhoa, IconXoay, Khung, Nut, ThongBao } from "@khbd/components/ui";
import { HinhTaoLai } from "./HinhTaoLai";

export type HamLayMau = () => Promise<Uint8Array>;
export type HamLuuFile = (tenFile: string, duLieu: Uint8Array) => Promise<void>;

export const layMauQuaMayChu: HamLayMau = async () => new Uint8Array(await (await fetch("/api/khbd/mau")).arrayBuffer());

export const luuQuaTrinhDuyet: HamLuuFile = async (tenFile, duLieu) => {
  const url = URL.createObjectURL(new Blob([duLieu.slice()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  a.style.display = "none";
  document.body.appendChild(a); // một số trình duyệt chỉ giữ tên file khi liên kết nằm trong trang
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
};

type BoFile = { sach: Uint8Array; danhDau: Uint8Array; kiemTra: KetQuaKiemTra; html: string; suaDoi: SuaDoi[] };

/** Tên ngắn từng loại chỗ đã tự sửa (câu tóm tắt ở bước 5). */
const TOM_TAT_SUA: Record<LoaiBienTap, string> = {
  lap_noi_dung: "câu lặp giữa mục tiêu, tiến trình, phụ lục", ma_lap: "mã năng lực ghi lặp", noi_bo: "lời hướng dẫn nội bộ",
  khong_chon: "nội dung của phần không chọn", tham_chieu: "mã hoặc tham chiếu không tồn tại", cau_van: "lỗi dấu câu, từ lặp",
  lap_nhiem_vu: "nhiệm vụ nêu lặp trong hoạt động", lap_cau_truc: "bước tổ chức lặp ở nhiều cấp", phu_luc: "phụ lục không dùng đến",
  cong_don: "nhóm năng lực theo cấu trúc mới (không cộng dồn với bản gốc)", trinh_bay: "chỗ xuống đoạn cho phương án, đáp án, bước",
};

type Props = {
  phanTich: PhanTichGiaoAn; thongTin: ThongTinBai; luaChon: LuaChon; keHoach: KeHoach;
  layMau?: HamLayMau; luuFile?: HamLuuFile; buoc: 5 | 6; onQuayLai: () => void; onTiepTuc: () => void;
  noiDung: NoiDungSoan; nguCanh: NguCanhSoan | null;
  /** Ảnh trong giáo án gốc (đã đọc ở bước soạn nếu có). */
  hinh?: HinhGoc[];
};

const NHAN_LOAI: Record<string, string> = {
  xml: "File Word hợp lệ", cho_trong: "Không còn chỗ trống [ ] hay “......”", ai: "Không nhắc AI khi không chọn",
  dau_dong: "Không có kí hiệu đầu dòng thừa",
  mat_noi_dung: "Nội dung của thầy/cô còn nguyên văn", lien_ket: "Mỗi năng lực có đủ hoạt động, hành vi, sản phẩm, tiêu chí", kha_thi: "Hoạt động khả thi: đủ thời gian, thiết bị có sẵn, việc làm cụ thể", dinh_dang: "Đúng style và phông Times New Roman",
  ma_tran: "Đủ số câu và mức độ theo ma trận", trac_nghiem: "Trắc nghiệm đủ 4 phương án, đáp án rải đều",
  phan_hoa: "Đủ 3 nhóm phân hóa", trung: "Exit ticket không trùng câu luyện tập", kiem_dinh: "Đáp án khớp khi giải lại",
  latex: "Công thức hợp lệ", bieu_hien: "Biểu hiện năng lực đúng cấu trúc", tieng_anh: "Phụ lục tiếng Anh không còn tiếng Việt", van_phong: "Không có lời sáo rỗng, kí hiệu thừa",
};

export function Buoc5KiemTra({ phanTich, thongTin, luaChon, keHoach, layMau = layMauQuaMayChu, luuFile = luuQuaTrinhDuyet, buoc, onQuayLai, onTiepTuc, noiDung, nguCanh, hinh = [] }: Props) {
  const [boFile, setBoFile] = useState<BoFile | null>(null);
  // Hình đã đọc: đối chiếu với kết quả app tính; giáo viên chọn giữ ảnh gốc cho từng hình.
  const doiChieu = useMemo(() => (noiDung.doc_hinh ? doiChieuCacHinh(hinh, noiDung.doc_hinh) : []), [hinh, noiDung.doc_hinh]);
  const [giuGoc, setGiuGoc] = useState<Set<string>>(new Set());
  const hdSoanLai = Object.keys(noiDung).filter((k) => k.startsWith("tk_")).map((k) => phanTich.hoatDong.find((h) => h.ma === k.slice(3))?.ten ?? k);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBaoLuu, setThongBaoLuu] = useState<string | null>(null);
  const [moSuaDoi, setMoSuaDoi] = useState(false);

  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        const mau = await layMau();
        await new Promise((r) => setTimeout(r, 50));
        const thayHinh = await chuanBiThayHinh(doiChieu, giuGoc, hinh, rasterTrinhDuyet);
        const sach = xuatWord(mau, phanTich, thongTin, luaChon, keHoach, false, noiDung, undefined, thayHinh);
        const danhDau = xuatWord(mau, phanTich, thongTin, luaChon, keHoach, true, noiDung, undefined, thayHinh);
        // Dòng năng lực gốc đã được thay bằng mục tiêu mới (không cộng dồn) không tính là mất nội dung.
        const kiemTra = kiemTraFileXuat(sach, doanCanGiu(phanTich, thongTin, luaChon, keHoach, noiDung), {
          coAi: luaChon.ai,
          nenTangChon: [...luaChon.nenTang, luaChon.tuHoc.nenTang].filter(Boolean),
          nenTangGoiY: NEN_TANG_HAY_GAP,
        });
        if (nguCanh) kiemTra.loi.push(...kiemTraNoiDungSoan(noiDung, nguCanh));
        const bienTap = baoCaoBienTap(phanTich, thongTin, luaChon, keHoach, noiDung);
        kiemTra.loi.push(...bienTap.loi);
        const html = await htmlXemTruoc(sach);
        if (!huy) setBoFile({ sach, danhDau, kiemTra, html, suaDoi: bienTap.suaDoi });
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : "Không tạo được file Word.");
      }
    })();
    return () => { huy = true; };
  }, [phanTich, thongTin, luaChon, keHoach, layMau, noiDung, nguCanh, doiChieu, giuGoc, hinh]);

  async function luu(danhDau: boolean) {
    if (!boFile) return;
    setThongBaoLuu(null);
    try {
      await luuFile(tenFileXuat(thongTin, danhDau), danhDau ? boFile.danhDau : boFile.sach);
      setThongBaoLuu(`Đã tải về ${tenFileXuat(thongTin, danhDau)}`);
    } catch (e) {
      const ma = (e as { code?: string })?.code;
      setThongBaoLuu(ma === "declined" ? "Thầy/cô đã hủy lưu file." : "Không tải về được ở đây. Thầy/cô mở bản chạy trên máy chủ để tải.");
    }
  }

  if (loi) return <ThongBao loai="loi" tieuDe="Không tạo được file Word">{loi}</ThongBao>;
  if (!boFile) {
    return (
      <Khung tieuDe="Đang tạo file Word và kiểm tra">
        <div className="flex items-center gap-3 text-sm text-chu-phu"><IconXoay className="h-5 w-5 text-nhan" /> Đang ghép nội dung vào khung, đổi công thức và chạy bộ kiểm tra…</div>
      </Khung>
    );
  }

  const { kiemTra } = boFile;
  const nghiem = kiemTra.loi.filter((l) => l.nghiem);
  const nhe = kiemTra.loi.filter((l) => !l.nghiem);
  const loaiLoi = new Set(kiemTra.loi.map((l) => l.loai));

  return (
    <div className="space-y-6">
      {buoc === 5 ? (
        <>
          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <Khung tieuDe="Giữ nguyên nội dung của thầy/cô">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 animate-bat place-items-center rounded-full border-4 border-nhan text-lg font-semibold tabular-nums text-nhan">{kiemTra.tiLeGiuNguyen}%</span>
                <p className="text-sm text-chu-phu">Giữ nguyên {kiemTra.tiLeGiuNguyen}% nội dung của thầy/cô. Các đoạn này được chép nguyên văn, có biểu tượng <IconKhoa className="inline h-3.5 w-3.5" /> trong bản duyệt.</p>
              </div>
            </Khung>
            <Khung tieuDe="Kiểm tra tự động" moTa={nghiem.length ? `${nghiem.length} lỗi cần sửa` : "Không có lỗi"}>
              <ul className="space-y-1.5 text-sm">
                {Object.entries({ ...NHAN_LOAI, ...TEN_LOAI_BIEN_TAP }).map(([loai, ten]) => (
                  <li key={loai} className="flex items-center gap-2">
                    {loaiLoi.has(loai)
                      ? <span className="grid h-5 w-5 place-items-center rounded-full bg-danger text-xs font-bold text-white">!</span>
                      : <span className="grid h-5 w-5 animate-bat place-items-center rounded-full bg-nhan text-white"><IconDung className="h-3 w-3" /></span>}
                    {ten}
                  </li>
                ))}
              </ul>
            </Khung>
          </div>
          {hdSoanLai.length > 0 && (
            <ThongBao loai="thong-tin" tieuDe={`Đã soạn lại ${hdSoanLai.length} hoạt động theo cách thầy/cô chọn`}>
              {hdSoanLai.join("; ")}. Phần mô tả cách tổ chức cũ được thay bằng các bước mới; câu hỏi, ví dụ, bài tập, bảng của thầy/cô giữ nguyên văn trong các bước.
            </ThongBao>
          )}
          {boFile.suaDoi.length > 0 && (
            <Khung tieuDe="Biên tập trước khi xuất" moTa={`Đã tự sửa ${boFile.suaDoi.length} chỗ. Nội dung của thầy/cô giữ nguyên.`}>
              <p className="text-sm text-chu-phu">
                {[...new Set(boFile.suaDoi.map((s) => s.loai))].map((loai) => `${loai === "cong_don" ? "" : `${boFile.suaDoi.filter((s) => s.loai === loai).length} `}${TOM_TAT_SUA[loai]}`).join("; ")}.
              </p>
              <button type="button" onClick={() => setMoSuaDoi((x) => !x)} className="mt-3 text-sm text-nhan hover:underline">
                {moSuaDoi ? "Ẩn từng chỗ đã sửa" : "Xem từng chỗ đã sửa"}
              </button>
              {moSuaDoi && <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-chu-phu">{boFile.suaDoi.map((s, i) => <li key={i}>{s.noiDung}</li>)}</ul>}
            </Khung>
          )}
          {doiChieu.length > 0 && (
            <HinhTaoLai hinh={hinh} doiChieu={doiChieu} giuGoc={giuGoc}
              onDoi={(ma, giu) => setGiuGoc((s) => { const m = new Set(s); if (giu) m.add(ma); else m.delete(ma); return m; })} />
          )}
          {(nghiem.length > 0 || nhe.length > 0) && (
            <ThongBao loai={nghiem.length ? "loi" : "canh-bao"} tieuDe="Chi tiết">
              <ul className="list-disc space-y-0.5 pl-4">{kiemTra.loi.map((l, i) => <li key={i}>{l.noiDung}</li>)}</ul>
            </ThongBao>
          )}
          <Khung tieuDe="Xem trước bài soạn" moTa="Bố cục theo khung mới. Định dạng chính xác (phông, lề, công thức Word) xem trong file tải về.">
            <div className="max-h-[36rem] overflow-y-auto rounded-md border border-vien bg-nen/50 p-3 sm:p-6">
              <article className="ban-xem-truoc mx-auto max-w-[46rem] bg-[#fff] px-6 py-8 shadow-sm ring-1 ring-vien sm:px-12" dangerouslySetInnerHTML={{ __html: boFile.html }} />
            </div>
          </Khung>
        </>
      ) : (
        <Khung tieuDe="Tải về" moTa="File Word đúng thể thức: A4, Times New Roman 13, công thức sửa được bằng Equation.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ dd: false, ten: "Tải bản sạch", moTa: "Bản hoàn chỉnh để nộp, in." }, { dd: true, ten: "Tải bản đánh dấu", moTa: "Phần bổ sung tô nền xanh nhạt để thầy/cô rà soát." }].map((b) => (
              <button key={b.ten} type="button" onClick={() => luu(b.dd)}
                className="group flex items-start gap-3 rounded-lg border border-vien p-4 text-left transition-all duration-150 hover:-translate-y-px hover:border-nhan hover:shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-nhan-nhat text-nhan"><IconFile /></span>
                <span className="min-w-0">
                  <span className="block font-medium group-hover:text-nhan">{b.ten}</span>
                  <span className="block text-sm text-chu-phu">{b.moTa}</span>
                  <span className="mt-1 block break-all text-xs text-chu-phu">{tenFileXuat(thongTin, b.dd)}</span>
                </span>
              </button>
            ))}
          </div>
          {thongBaoLuu && <p className="mt-4 animate-truot text-sm text-nhan">{thongBaoLuu}</p>}
          <div className="mt-5">
            <ThongBao loai="thong-tin">Thầy/cô đọc lại phần bổ sung trước khi dùng, nhất là đáp án và lời giải. Bản đánh dấu tô nền các phần này.</ThongBao>
          </div>
        </Khung>
      )}

      {buoc === 5 && nghiem.length > 0 && (
        <ThongBao loai="canh-bao" tieuDe={`Còn ${nghiem.length} lỗi trong bài soạn`}>
          Thầy/cô có thể quay lại để soạn lại, hoặc vẫn tiếp tục tải về rồi sửa trực tiếp trong Word. Bản đánh dấu tô nền phần bổ sung để tìm nhanh chỗ cần sửa.
        </ThongBao>
      )}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-vien bg-nen/95 px-1 py-3">
        <Nut loai="phu" onClick={onQuayLai}>Quay lại</Nut>
        {buoc === 5 && <Nut onClick={onTiepTuc}>{nghiem.length ? "Vẫn tiếp tục để tải về" : "Tiếp tục"}</Nut>}
      </div>
    </div>
  );
}


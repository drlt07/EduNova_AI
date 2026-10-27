/** Kiểu dữ liệu dùng chung giữa các bước của luồng tạo KHBD. */

export type LoaiDoan = "MT" | "TB" | "HD" | "CH" | "TD" | "KH";

/** Một đoạn của giáo án cũ. Văn bản giữ nguyên chữ; html giữ định dạng. */
export type DoanGoc = {
  ma: string; // MT-01, TB-01, HD-01, CH-01, TD-01 (tiêu đề), KH-01 (khác)
  loai: LoaiDoan;
  html: string;
  vanBan: string;
  muc: "dau_bai" | "muc_tieu" | "thiet_bi" | "tien_trinh";
  nhomMucTieu?: "I.1" | "I.2" | "I.3";
  tenNhomCu?: string; // "Kĩ năng", "Thái độ"… để cảnh báo thuật ngữ
  hoatDongCu?: string; // mã hoạt động cũ chứa đoạn này, vd "HDC-2"
};

export type LoaiHoatDongCu = "khoi_dong" | "hinh_thanh" | "luyen_tap" | "van_dung" | "cung_co" | "khac";

export type HoatDongCu = {
  ma: string; // HDC-1, HDC-2…
  ten: string; // nguyên văn tiêu đề của GV
  loai: LoaiHoatDongCu;
  doan: string[]; // mã các đoạn thuộc hoạt động
  so?: string; // số thứ tự ghi ở tiêu đề: "2", "2.1", "II", "GĐ1"
  cha?: string; // hoạt động con (vd 2.1) thuộc hoạt động cha (2)
  kem?: string[]; // đoạn sau tiến trình (phụ lục, phiếu, rút kinh nghiệm) đi kèm hoạt động cuối; không thuộc nội dung hoạt động
};

export type ThongTinBai = {
  mon: string | null; // ma_mon trong nang_luc_dac_thu.json
  lop: 10 | 11 | 12 | null;
  tenBai: string | null;
  soTiet: number | null;
};

export type PhanTichGiaoAn = {
  thongTin: ThongTinBai;
  doan: DoanGoc[];
  hoatDong: HoatDongCu[];
  canhBao: string[];
};

/** Kết quả bước 1 đưa sang bước 2. */
export type KetQuaTaiLen = {
  tenFile: string;
  canhBao: string[];
  mathType: { stt: number; nguCanh: string }[];
  laBanScan: boolean;
  phanTich: PhanTichGiaoAn;
  coSgk: boolean;
};

/** Báo tiến độ: mã giai đoạn vừa bắt đầu (và phần trăm nếu có, vd khi tải file lên). */
export type BaoTienDo = (giaiDoan: string, phanTram?: number) => void;

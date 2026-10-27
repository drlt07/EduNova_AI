/**
 * Ma trận câu hỏi do code tính: dạng câu theo môn (bảng "Gợi ý dạng câu hỏi HĐ II theo môn" của khung),
 * số câu theo thời lượng HĐ II, mức độ Nhận biết – Thông hiểu – Vận dụng.
 */

export type MucDo = "NB" | "TH" | "VD";
export type DangCau = { nhieuLuaChon: boolean; dungSai: boolean; traLoiNgan: boolean; tuLuan: boolean };

const DANG: Record<string, DangCau> = {
  TOAN: { nhieuLuaChon: true, dungSai: true, traLoiNgan: true, tuLuan: true },
  VAT_LI: { nhieuLuaChon: true, dungSai: true, traLoiNgan: true, tuLuan: false },
  HOA_HOC: { nhieuLuaChon: true, dungSai: true, traLoiNgan: true, tuLuan: false },
  SINH_HOC: { nhieuLuaChon: true, dungSai: true, traLoiNgan: true, tuLuan: false },
  DIA_LI: { nhieuLuaChon: true, dungSai: true, traLoiNgan: true, tuLuan: false },
  LICH_SU: { nhieuLuaChon: true, dungSai: true, traLoiNgan: false, tuLuan: false },
  GDKT_PL: { nhieuLuaChon: true, dungSai: true, traLoiNgan: false, tuLuan: false },
  TIN_HOC: { nhieuLuaChon: true, dungSai: true, traLoiNgan: false, tuLuan: false },
  CONG_NGHE: { nhieuLuaChon: true, dungSai: true, traLoiNgan: false, tuLuan: false },
  NGOAI_NGU: { nhieuLuaChon: true, dungSai: false, traLoiNgan: false, tuLuan: false },
  NGU_VAN: { nhieuLuaChon: true, dungSai: false, traLoiNgan: true, tuLuan: true },
};
const NANG_KHIEU = new Set(["GDTC", "AM_NHAC", "MI_THUAT", "HDTN_HN"]);

export function dangCauHoi(maMon: string | null): DangCau {
  return DANG[maMon ?? ""] ?? { nhieuLuaChon: true, dungSai: false, traLoiNgan: false, tuLuan: false };
}

/** Chia n câu theo mức độ: khoảng 40% NB, 35% TH, còn lại VD (mỗi mức ít nhất 1 khi n ≥ 3). */
export function chiaMucDo(n: number): MucDo[] {
  if (n <= 0) return [];
  const nb = Math.max(1, Math.round(n * 0.4));
  const th = n >= 3 ? Math.max(1, Math.round(n * 0.35)) : n - nb;
  const vd = n - nb - th;
  return [...Array(nb).fill("NB"), ...Array(Math.max(th, 0)).fill("TH"), ...Array(Math.max(vd, 0)).fill("VD")];
}

export type MaTranCauHoi = {
  nhieuLuaChon: MucDo[];
  dungSai: MucDo[];
  traLoiNgan: MucDo[];
  tuLuan: number;
};

/** Ma trận câu hỏi HĐ II theo môn và thời lượng HĐ II của một tiết (phút). */
export function maTranCauHoi(maMon: string | null, phutHd2: number): MaTranCauHoi {
  const d = dangCauHoi(maMon);
  if (NANG_KHIEU.has(maMon ?? "")) return { nhieuLuaChon: chiaMucDo(3), dungSai: [], traLoiNgan: [], tuLuan: 0 };
  const ngan = phutHd2 <= 15; // bài 1 tiết: 6–8 câu nhiều lựa chọn + 1 câu đúng sai hoặc trả lời ngắn
  const soNlc = ngan ? 6 : phutHd2 >= 30 ? 10 : 8;
  if (ngan) {
    return {
      nhieuLuaChon: chiaMucDo(soNlc),
      dungSai: d.dungSai ? ["TH"] : [],
      traLoiNgan: !d.dungSai && d.traLoiNgan ? ["VD"] : [],
      tuLuan: 0,
    };
  }
  return {
    nhieuLuaChon: chiaMucDo(soNlc),
    dungSai: d.dungSai ? ["TH", "VD"] : [],
    traLoiNgan: d.traLoiNgan ? ["TH", "VD"] : [],
    tuLuan: d.tuLuan ? 1 : 0,
  };
}

export function moTaMaTran(m: MaTranCauHoi): string {
  const dem = (ds: MucDo[]) => `${ds.length} câu (${["NB", "TH", "VD"].map((x) => `${ds.filter((y) => y === x).length} ${x}`).join(", ")})`;
  return [
    `Trắc nghiệm nhiều phương án lựa chọn: ${dem(m.nhieuLuaChon)}`,
    m.dungSai.length ? `Trắc nghiệm đúng sai (mỗi câu 4 ý): ${dem(m.dungSai)}` : "Không có câu đúng sai",
    m.traLoiNgan.length ? `Trắc nghiệm trả lời ngắn: ${dem(m.traLoiNgan)}` : "Không có câu trả lời ngắn",
    m.tuLuan ? `Tự luận ngắn/nhiệm vụ kĩ năng: ${m.tuLuan} câu` : "Không có câu tự luận",
  ].join("\n");
}

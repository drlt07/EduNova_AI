import { z } from "zod";
import duLieu from "@khbd/data/nang_luc_dac_thu.json";

const ThanhPhan = z.object({
  ma: z.string(),
  ten: z.string().min(1),
  bieu_hien: z.array(z.string()),
  da_duyet: z.boolean(),
});

const NangLuc = z.object({
  ma: z.string(),
  ten: z.string().min(1),
  thanh_phan: z.array(ThanhPhan),
});

const Mon = z.object({
  ma_mon: z.string(),
  ten_mon: z.string(),
  nang_luc: z.array(NangLuc),
  goi_y: z.string(),
  goi_y_thanh_phan: z.string(),
  goi_y_nguon: z.string(),
});

export const NangLucDacThuSchema = z.object({
  nguon: z.string(),
  ghi_chu: z.string(),
  mon: z.array(Mon),
});

export type MonHoc = z.infer<typeof Mon>;
export type ThanhPhanNangLuc = z.infer<typeof ThanhPhan>;

export const nangLucDacThu = NangLucDacThuSchema.parse(duLieu);

export function timMon(maMon: string): MonHoc | undefined {
  return nangLucDacThu.mon.find((m) => m.ma_mon === maMon);
}

/** Biểu hiện chính thức chỉ hiển thị khi đã được duyệt. */
export function bieuHienHienThi(tp: ThanhPhanNangLuc): string[] {
  return tp.da_duyet ? tp.bieu_hien : [];
}

import { z } from "zod";
import duLieu from "@khbd/data/nang_luc_ai.json";

const NangLucAi = z.object({
  ma: z.string(),
  mo_ta: z.string(),
  tieu_chi: z.string(),
  minh_chung: z.string(),
  tieu_chi_en: z.string(),
});

export const nangLucAi = z
  .object({ nguon: z.string(), vi_tri_goi_y: z.string(), ghi_chu: z.string(), nang_luc: z.array(NangLucAi) })
  .parse(duLieu);

export type NangLucAiMuc = z.infer<typeof NangLucAi>;

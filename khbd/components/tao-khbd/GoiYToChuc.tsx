"use client";

import { useState } from "react";
import { IconXoay, Nhan, Nut } from "@khbd/components/ui";
import type { GoiYHinhThuc } from "@khbd/lib/pipeline/2-lua-chon/goi-y-to-chuc";
import type { TichHop } from "@khbd/lib/pipeline/2-lua-chon/goi-y-trien-khai";
import type { GoiYToChuc } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { OChon } from "./ChonNangLuc";

/** Hình thức gợi ý từ bảng của khung, xếp theo môn và nội dung bài; bấm để thêm/bỏ. */
export function DanhSachGoiYHinhThuc({ goiY, giaTri, onDoi, dauDanhSach }: {
  goiY: GoiYHinhThuc[]; giaTri: string[]; onDoi: (v: string[]) => void; dauDanhSach?: React.ReactNode;
}) {
  if (!goiY.length && !dauDanhSach) return null;
  const batTat = (ten: string) => onDoi(giaTri.includes(ten) ? giaTri.filter((x) => x !== ten) : [...giaTri, ten]);
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-chu-phu">Gợi ý theo khung và nội dung bài</p>
      {dauDanhSach}
      {goiY.map((g) => (
        <OChon key={g.ten} chon={giaTri.includes(g.ten)} onDoi={() => batTat(g.ten)}
          goiY={
            <span className="mt-1 block space-y-1">
              {g.dienBien && <span className="block text-[13px] text-chu-phu">Diễn biến: {g.dienBien}</span>}
              {g.sanPham && <span className="block text-[13px] text-chu-phu">Sản phẩm: {g.sanPham}</span>}
              <span className="flex flex-wrap gap-1">{g.lyDo.map((l) => <Nhan key={l}>{l}</Nhan>)}</span>
            </span>
          }>
          <span className="font-medium">{g.ten}</span>
        </OChon>
      ))}
    </div>
  );
}

/** Nút đọc giáo án (qua LLM) để gợi ý cách triển khai từng hoạt động cụ thể với bài. */
export function NutGoiYTheoBai({ goiY, onKetQua }: { goiY: (signal: AbortSignal) => Promise<GoiYToChuc>; onKetQua: (kq: GoiYToChuc) => void }) {
  const [tt, setTt] = useState<{ dang: boolean; loi: string | null; xong: boolean }>({ dang: false, loi: null, xong: false });
  async function chay() {
    setTt({ dang: true, loi: null, xong: false });
    try {
      onKetQua(await goiY(new AbortController().signal));
      setTt({ dang: false, loi: null, xong: true });
    } catch (e) {
      setTt({ dang: false, loi: e instanceof Error ? e.message : "Không soạn được gợi ý.", xong: false });
    }
  }
  return (
    <div className="rounded-xl border border-nhan/25 bg-nhan-nhat/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">{tt.xong ? "Đã đọc giáo án: gợi ý cụ thể với bài hiện ở từng hoạt động bên dưới." : "Đọc giáo án để gợi ý cách triển khai từng hoạt động cụ thể với nội dung bài."}</p>
        <Nut loai="phu" className="h-9" disabled={tt.dang} onClick={chay}>
          {tt.dang ? <><IconXoay /> Đang đọc giáo án…</> : tt.xong ? "Gợi ý lại" : "Gợi ý cách triển khai theo nội dung bài"}
        </Nut>
      </div>
      {tt.loi && <p className="mt-2 text-sm text-red-700">{tt.loi}</p>}
    </div>
  );
}

const NHAN_TICH_HOP: Record<TichHop["loai"], string> = { nls: "Năng lực số", ai: "Năng lực AI", tieng_anh: "Tiếng Anh" };

/** Một hoạt động: cách làm gợi ý (bấm để chọn), gợi ý theo bài, phần tích hợp theo chức năng đã chọn. */
export function TheHoatDong({ ten, goiY, goiYBai, tichHop, daChon, onChon, onSua, dichDay, onDich, children, soanLai }: {
  ten: string;
  /** Hoạt động của KHBD gốc sẽ được soạn lại theo cách đã chọn. */
  soanLai?: boolean;
  goiY: GoiYHinhThuc[];
  goiYBai?: GoiYToChuc["hoatDong"][number];
  tichHop: TichHop[];
  daChon: string;
  onChon: (v: string) => void;
  onSua: (v: string) => void;
  dichDay?: boolean;
  onDich?: () => void;
  children?: React.ReactNode;
}) {
  const giaTri = (g: { ten: string; dienBien?: string }) => (g.dienBien ? `${g.ten}: ${g.dienBien}` : g.ten);
  const giaTriBai = goiYBai ? [`${goiYBai.cachLam}: ${goiYBai.moTa}`, ...goiYBai.tichHop].join(" ") : "";
  return (
    <section className="rounded-xl border border-vien p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{ten}</h3>
        <span className="flex flex-wrap gap-1">
          {soanLai && <Nhan loai="xanh">Soạn lại theo cách đã chọn</Nhan>}
          {dichDay && <Nhan loai="xanh">Dịch ở phụ lục tiếng Anh</Nhan>}
        </span>
      </div>
      {children}
      {!children && (
        <div className="mt-3 space-y-2">
          {goiYBai && (
            <OChon chon={daChon === giaTriBai} onDoi={() => onChon(daChon === giaTriBai ? "" : giaTriBai)}
              goiY={
                <span className="mt-1 block space-y-1">
                  <span className="block text-[13px] text-chu-phu">{goiYBai.moTa}</span>
                  {goiYBai.tichHop.map((x) => <span key={x} className="block text-[13px] text-chu-phu">Tích hợp: {x}</span>)}
                  <span className="flex flex-wrap gap-1"><Nhan loai="xanh">Theo nội dung bài</Nhan><Nhan>{goiYBai.lyDo}</Nhan></span>
                </span>
              }>
              <span className="font-medium">{goiYBai.cachLam}</span>
            </OChon>
          )}
          {goiY.map((g) => (
            <OChon key={g.ten} chon={daChon === giaTri(g)} onDoi={() => onChon(daChon === giaTri(g) ? "" : giaTri(g))}
              goiY={
                <span className="mt-1 block space-y-1">
                  {g.dienBien && <span className="block text-[13px] text-chu-phu">{g.dienBien}</span>}
                  {g.lyDo.length > 0 && <span className="flex flex-wrap gap-1">{g.lyDo.map((l) => <Nhan key={l}>{l}</Nhan>)}</span>}
                </span>
              }>
              <span className="font-medium">{g.ten}</span>
            </OChon>
          ))}
          {daChon && (
            <textarea aria-label={`Cách triển khai đã chọn cho ${ten}`} rows={2} className="mt-1 w-full rounded-lg border border-vien-dam px-3 py-2 text-sm outline-none focus:border-nhan focus:ring-4 focus:ring-nhan/10"
              value={daChon} onChange={(e) => onSua(e.target.value)} />
          )}
        </div>
      )}
      {tichHop.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-vien pt-3">
          {tichHop.map((x, i) => (
            <li key={i} className="flex flex-wrap items-start gap-2 text-sm">
              <Nhan loai="xanh">{x.loai === "nls" ? `NLS ${x.nhan}` : NHAN_TICH_HOP[x.loai]}</Nhan>
              <span className="min-w-0 flex-1 text-chu-phu">{x.noiDung}</span>
              {x.loai === "tieng_anh" && onDich && !dichDay && <Nut loai="phu" className="h-8 text-xs" onClick={onDich}>Dịch hoạt động này</Nut>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

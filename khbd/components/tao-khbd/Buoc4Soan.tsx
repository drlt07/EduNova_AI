"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Luot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { chaySoan, type HamSoanLuot, type TrangThaiLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/chay";
import { DanhSachTienDo, IconDung, Khung, Nut, ThanhTienDo, ThongBao } from "@khbd/components/ui";

const dongHo = (giay: number) => `${Math.floor(giay / 60)}:${String(giay % 60).padStart(2, "0")}`;

export function Buoc4Soan({
  dsLuot, soanLuot, giaLap, onBatDauLai, onQuayLai, onTiepTuc,
}: { dsLuot: Luot[]; soanLuot: HamSoanLuot; giaLap: boolean; onBatDauLai: () => void; onQuayLai: () => void; onTiepTuc: () => void }) {
  const [trangThai, setTrangThai] = useState<Record<string, { tt: TrangThaiLuot; loi?: string }>>({});
  const [dangChay, setDangChay] = useState(false);
  const [giay, setGiay] = useState(0);
  const ac = useRef<AbortController | null>(null);

  const chay = useCallback(async (chiChay?: Set<string>) => {
    ac.current = new AbortController();
    setDangChay(true);
    setGiay(0);
    if (!chiChay) onBatDauLai();
    await chaySoan(dsLuot, soanLuot, (ma, tt, loi) => setTrangThai((s) => ({ ...s, [ma]: { tt, loi } })), ac.current.signal, chiChay);
    setDangChay(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsLuot, soanLuot]);

  useEffect(() => {
    chay();
    return () => ac.current?.abort();
  }, [chay]);

  useEffect(() => {
    if (!dangChay) return;
    const t = setInterval(() => setGiay((g) => g + 1), 1000);
    return () => clearInterval(t);
  }, [dangChay]);

  const tt = (ma: string) => trangThai[ma]?.tt ?? "cho";
  const soXong = dsLuot.filter((l) => tt(l.ma) === "xong").length;
  const loi = dsLuot.filter((l) => tt(l.ma) === "loi");
  const dang = dsLuot.find((l) => tt(l.ma) === "dang");
  const xongHet = soXong === dsLuot.length && dsLuot.length > 0;
  // Không khóa cứng: khi đã dừng và có phần soạn xong, GV vẫn đi tiếp được (phần lỗi giữ nội dung của GV).
  const tiepDuoc = xongHet || (!dangChay && soXong > 0);
  const phanTram = dsLuot.length ? ((soXong + (dang ? 0.5 : 0)) / dsLuot.length) * 100 : 100;

  return (
    <div className="space-y-6">
      <Khung tieuDe={xongHet ? "Đã soạn xong" : dangChay ? "Đang soạn nội dung" : loi.length ? "Có phần chưa soạn được" : "Đã dừng"}
        moTa={xongHet ? `Hoàn thành ${dsLuot.length} phần trong ${dongHo(giay)}.` : "Soạn từng phần nhỏ theo đúng việc thầy/cô đã chọn. Nội dung của thầy/cô không bị viết lại."}
        phai={<span className="whitespace-nowrap text-sm tabular-nums text-chu-phu">{dongHo(giay)}</span>}>
        <div className="space-y-5">
          {giaLap && (
            <ThongBao loai="thong-tin" tieuDe="Đang chạy chế độ giả lập">
              Nội dung các phần là mẫu giả lập, chỉ để xem quy trình và bố cục file.
            </ThongBao>
          )}
          <ThanhTienDo phanTram={phanTram} nhan={dang ? `Đang soạn: ${dang.ten}` : xongHet ? "Hoàn thành" : `${soXong}/${dsLuot.length} phần`} />
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Đã xong", soXong, "text-nhan"], ["Còn lại", dsLuot.length - soXong - loi.length, "text-chu"], ["Lỗi", loi.length, loi.length ? "text-red-700" : "text-chu-phu"]].map(([ten, so, mau]) => (
              <div key={ten as string} className="rounded-md border border-vien py-2.5">
                <p className={`text-xl font-semibold tabular-nums ${mau}`}>{so}</p>
                <p className="text-xs text-chu-phu">{ten}</p>
              </div>
            ))}
          </div>
          <DanhSachTienDo viec={dsLuot.map((l) => ({ ma: l.ma, ten: l.ten, trangThai: tt(l.ma), chiTiet: tt(l.ma) === "loi" ? trangThai[l.ma]?.loi : tt(l.ma) === "dang" ? l.moTa : undefined }))} />
          {!dangChay && !xongHet && soXong > 0 && (
            <ThongBao loai="canh-bao" tieuDe={loi.length ? `${loi.length} phần chưa soạn được` : "Còn phần chưa soạn"}>
              Bấm “{loi.length ? "Soạn lại phần lỗi" : "Soạn tiếp"}” để thử lại. Thầy/cô cũng có thể tiếp tục: phần chưa soạn giữ nội dung của thầy/cô trong giáo án cũ, sửa thêm trong file Word sau khi tải về.
            </ThongBao>
          )}
          {xongHet && (
            <div className="flex animate-hien items-center gap-3 rounded-md border border-nhan/25 bg-nhan-nhat px-4 py-3 text-sm">
              <span className="grid h-8 w-8 shrink-0 animate-bat place-items-center rounded-full bg-nhan text-white"><IconDung className="h-4 w-4" /></span>
              Tất cả các phần đã soạn xong. Bước tiếp theo app tự kiểm tra lỗi trước khi thầy/cô duyệt.
            </div>
          )}
        </div>
      </Khung>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-vien bg-nen/95 px-1 py-3">
        <Nut loai="phu" onClick={() => { ac.current?.abort(); onQuayLai(); }}>Quay lại</Nut>
        <div className="flex gap-2">
          {dangChay && <Nut loai="phu" onClick={() => ac.current?.abort()}>Dừng</Nut>}
          {!dangChay && !xongHet && (
            <Nut loai="phu" onClick={() => chay(new Set(dsLuot.filter((l) => tt(l.ma) !== "xong").map((l) => l.ma)))}>
              {loi.length ? "Soạn lại phần lỗi" : "Soạn tiếp"}
            </Nut>
          )}
          <Nut disabled={!tiepDuoc} onClick={onTiepTuc}>{xongHet ? "Tiếp tục" : "Tiếp tục, bỏ qua phần này"}</Nut>
        </div>
      </div>
    </div>
  );
}

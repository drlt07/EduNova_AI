"use client";

import { TEN_DICH, type DichAnhXa } from "@khbd/lib/pipeline/3-ke-hoach/anh-xa";
import { kiemTraThoiLuong } from "@khbd/lib/pipeline/3-ke-hoach/thoi-luong";
import type { KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import type { LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import type { PhanTichGiaoAn } from "@khbd/lib/pipeline/kieu";
import { IconDung, IconKhoa, Khung, Nhan, Nut, ThongBao } from "@khbd/components/ui";

const DICH: DichAnhXa[] = ["GD1", "HD1", "HD2", "HD3", "HD4", "GD3"];
const DICH_NGAN: Record<string, string> = { GD1: "GĐ 1", HD1: "HĐ I", HD2: "HĐ II", HD3: "HĐ III", HD4: "HĐ IV", GD3: "GĐ 3" };
const TEN_LOAI: Record<string, string> = { MT: "Mục tiêu", TB: "Thiết bị", HD: "Hoạt động", CH: "Câu hỏi", TD: "Tiêu đề", KH: "Thông tin chung" };

export function Buoc3KeHoach({
  phanTich, luaChon, keHoach, setKeHoach, onQuayLai, onTiepTuc,
}: {
  phanTich: PhanTichGiaoAn;
  luaChon: LuaChon;
  keHoach: KeHoach;
  setKeHoach: (k: KeHoach) => void;
  onQuayLai: () => void;
  onTiepTuc: () => void;
}) {
  const { phamVi, thoiLuong, anhXa, oViTri } = keHoach;
  const loiNghiem = keHoach.loiThoiLuong.filter((l) => l.nghiem);
  const dem = (loai: string) => phanTich.doan.filter((d) => d.loai === loai).length;

  function doiPhut(t: number, m: number, phut: number) {
    if (!thoiLuong) return;
    const moi = thoiLuong.map((x, i) => (i !== t ? x : { ...x, muc: x.muc.map((y, j) => (j === m ? { ...y, phut } : y)) }));
    setKeHoach({ ...keHoach, thoiLuong: moi, loiThoiLuong: kiemTraThoiLuong(moi, luaChon.phuongAn) });
  }

  function doiDich(dong: number, dich: DichAnhXa, co: boolean) {
    if (!anhXa) return;
    setKeHoach({ ...keHoach, anhXa: anhXa.map((d, i) => (i !== dong ? d : { ...d, dich: co ? [...d.dich, dich] : d.dich.filter((x) => x !== dich) })) });
  }

  const viec = [
    ...(phamVi.giuNguyenToanBo ? ["Giữ nguyên bố cục và nội dung giáo án gốc; chỉ thêm phần thuộc chức năng đã chọn vào đúng mục tiêu, hoạt động liên quan và phụ lục."] : ["Giữ nguyên mục tiêu của thầy/cô."]),
    ...(luaChon.chuyenKhung ? ["Chuyển sang khung mới: Giai đoạn 1 – 3, HĐ I – IV."] : []),
    ...(luaChon.taoLaiHoatDong ? [`Viết lại tổ chức HĐ II (${luaChon.hinhThucHD2.join(", ")}) và HĐ III (${luaChon.hinhThucHD3.join(", ")}); dùng lại câu hỏi, tình huống, tư liệu của thầy/cô.`] : []),
    ...(phamVi.tichHop.nls ? ["Tích hợp năng lực số."] : []),
    ...(phamVi.tichHop.ai ? ["Tích hợp năng lực AI."] : []),
    ...(phamVi.tichHop.clil ? ["Tiếng Anh (CLIL): thêm key words và nhiệm vụ dùng tiếng Anh vào đúng một hoạt động."] : []),
    ...(phamVi.tichHop.tiengAnh ? ["Phụ lục tiếng Anh: dịch đúng một hoạt động đã chọn."] : []),
    ...(phamVi.tichHop.lhdn ? ["LHĐN: học sinh tự học trước giờ (Giai đoạn 1)."] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Mục tiêu", dem("MT")], ["Hoạt động", phanTich.hoatDong.length], ["Câu hỏi", dem("CH")], ["Thiết bị", dem("TB")]].map(([ten, so]) => (
          <div key={ten} className="the px-4 py-3">
            <p className="text-xs text-chu-phu">{ten} của thầy/cô</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{so}</p>
          </div>
        ))}
      </div>

      <Khung tieuDe="Việc sẽ làm">
        <ul className="space-y-2">
          {viec.map((v) => (
            <li key={v} className="flex gap-2.5 text-sm"><IconDung className="mt-0.5 h-4 w-4 shrink-0 text-nhan" />{v}</li>
          ))}
        </ul>
      </Khung>

      {anhXa && (
        <Khung tieuDe="Ánh xạ hoạt động cũ sang khung mới" moTa="Thầy/cô bỏ chọn hoặc chọn thêm chỗ đặt cho từng hoạt động.">
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-vien bg-nen/70 text-xs text-chu-phu">
                  <th className="px-5 py-2.5 text-left font-medium">Hoạt động trong giáo án cũ</th>
                  {DICH.map((d) => <th key={d} title={TEN_DICH[d]} className="w-16 px-1 py-2.5 text-center font-medium">{DICH_NGAN[d]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-vien">
                {anhXa.map((dong, i) => (
                  <tr key={dong.hoatDongCu} className={dong.dich.length === 0 ? "bg-warning/10" : ""}>
                    <td className="px-5 py-2.5">{dong.tenCu}</td>
                    {DICH.map((d) => {
                      const chon = dong.dich.includes(d);
                      return (
                        <td key={d} className="text-center">
                          <button type="button" aria-pressed={chon} aria-label={`${dong.tenCu} → ${TEN_DICH[d]}`} onClick={() => doiDich(i, d, !chon)}
                            className={"inline-grid h-6 w-6 place-items-center rounded border transition-colors " + (chon ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-surface hover:border-nhan")}>
                            {chon && <IconDung className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Khung>
      )}

      {thoiLuong && (
        <Khung tieuDe="Thời lượng" moTa="Mỗi tiết đúng 45 phút; không bỏ HĐ IV. Sửa số phút nếu cần.">
          <div className="grid gap-4 lg:grid-cols-2">
            {thoiLuong.map((t, ti) => {
              const tong = t.muc.reduce((s, m) => s + m.phut, 0);
              const du = tong === 45;
              return (
                <div key={t.tiet} className={"overflow-hidden rounded-md border " + (du ? "border-vien" : "border-danger/40")}>
                  <div className="flex items-center justify-between bg-nen/70 px-4 py-2.5">
                    <span className="text-sm font-medium">Tiết {t.tiet}{t.nhan && <span className="font-normal text-chu-phu"> · {t.nhan}</span>}</span>
                    <span className={"text-xs font-medium tabular-nums " + (du ? "text-chu-phu" : "text-danger-fg")}>{tong}/45 phút</span>
                  </div>
                  <div className="flex h-1.5 bg-vien" aria-hidden="true">
                    {t.muc.map((m, mi) => <span key={mi} style={{ width: `${(m.phut / 45) * 100}%` }} className={"border-r border-white last:border-r-0 " + ["bg-nhan", "bg-nhan/70", "bg-nhan/45", "bg-nhan/25"][mi % 4]} />)}
                  </div>
                  {t.muc.map((m, mi) => (
                    <div key={mi} className="flex items-center justify-between gap-3 border-t border-vien px-4 py-2 text-sm">
                      <label htmlFor={`phut-${ti}-${mi}`} className="min-w-0">{m.ten}</label>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <input id={`phut-${ti}-${mi}`} type="number" min={1} max={45} value={m.phut} onChange={(e) => doiPhut(ti, mi, Number(e.target.value))}
                          className="h-8 w-14 rounded-md border border-vien-dam px-2 text-right tabular-nums outline-none focus:border-nhan" />
                        <span className="text-xs text-chu-phu">phút</span>
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {keHoach.loiThoiLuong.length > 0 && (
            <div className="mt-4">
              <ThongBao loai={loiNghiem.length ? "loi" : "canh-bao"}>
                <ul className="space-y-0.5">{keHoach.loiThoiLuong.map((l, i) => <li key={i}>{l.muc}: {l.noiDung}</li>)}</ul>
              </ThongBao>
            </div>
          )}
        </Khung>
      )}

      <Khung tieuDe="Vị trí có thể gắn năng lực" moTa="Lấy từ các hoạt động thật sự có trong bài.">
        <div className="flex flex-wrap gap-2">
          {oViTri.map((v) => <span key={v.ma} className="rounded-md border border-vien bg-nen/60 px-2.5 py-1 text-xs">{v.nhan}</span>)}
        </div>
      </Khung>

      <Khung tieuDe={`Nội dung của thầy/cô (${phanTich.doan.length} đoạn)`} moTa="Các đoạn được đánh mã và chép nguyên văn vào bài soạn."
        phai={<span className="flex items-center gap-1 whitespace-nowrap text-xs text-chu-phu"><IconKhoa className="h-3.5 w-3.5" /> Giữ nguyên</span>}>
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-nhan">Xem danh sách đoạn</summary>
          <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-md border border-vien">
            {phanTich.doan.map((d) => (
              <div key={d.ma} className="flex gap-3 border-b border-vien px-3 py-2 text-sm last:border-b-0">
                <span className="w-14 shrink-0 pt-0.5 font-mono text-xs text-chu-phu">{d.ma}</span>
                <span className="hidden w-28 shrink-0 pt-0.5 sm:block"><Nhan loai={d.loai === "TD" ? "xam" : "xanh"}>{TEN_LOAI[d.loai]}{d.nhomMucTieu ? ` ${d.nhomMucTieu}` : ""}</Nhan></span>
                <span className={"min-w-0 break-words " + (d.loai === "TD" ? "font-medium" : "")}>{d.vanBan}</span>
              </div>
            ))}
          </div>
        </details>
      </Khung>

      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-vien bg-nen/95 px-1 py-3">
        <Nut loai="phu" onClick={onQuayLai}>Quay lại</Nut>
        <Nut disabled={loiNghiem.length > 0} onClick={onTiepTuc}>Tiếp tục</Nut>
      </div>
    </div>
  );
}

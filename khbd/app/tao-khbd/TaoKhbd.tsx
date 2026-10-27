"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LUA_CHON_BAT_DAU, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapKeHoach, type KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import type { ThongTinBai } from "@khbd/lib/pipeline/kieu";
import { CotBuoc } from "@khbd/components/tao-khbd/CotBuoc";
import { Buoc1TaiLen, type GiaoAnMau, type HamDocFile } from "@khbd/components/tao-khbd/Buoc1TaiLen";
import { Buoc2LuaChon } from "@khbd/components/tao-khbd/Buoc2LuaChon";
import { Buoc3KeHoach } from "@khbd/components/tao-khbd/Buoc3KeHoach";
import type { KetQuaTaiLen } from "@khbd/components/tao-khbd/kieu";
import { Buoc5KiemTra, type HamLayMau, type HamLuuFile } from "@khbd/components/tao-khbd/Buoc56";
import { Buoc4Soan } from "@khbd/components/tao-khbd/Buoc4Soan";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import type { HamSoanLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/chay";
import { nguCanhTu, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { chiBaoNc1, docHinhQuaMayChu, giaLapQuaMayChu, goiYQuaMayChu, goiYToChucQuaMayChu, moiTruongTrinhDuyet, soanQuaMayChu, type HamDocHinh, type HamGoiYNls, type HamGoiYToChuc, type HamSoanLlm } from "@khbd/lib/pipeline/4-sinh-noi-dung/moi-truong";
import { docCacHinh, docDuocAnh, layHinh } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import { KhoaAiCuaToi, type MayChuAi } from "@khbd/components/KhoaAiCuaToi";
import { adapterTuKhoa, docKhoaAi, luuKhoaAi, xoaKhoaAi, type KhoaAi } from "@khbd/lib/llm/khoa-nguoi-dung";

/** docHinh: đọc ảnh trong giáo án (không có thì giữ nguyên ảnh gốc, không có lượt đọc hình). */
export type MoiTruongSoan = { soan: HamSoanLlm; goiY: HamGoiYNls; goiYToChuc: HamGoiYToChuc; giaLap: () => Promise<boolean>; docHinh?: HamDocHinh };
const MOI_TRUONG_MAY_CHU: MoiTruongSoan = { soan: soanQuaMayChu, goiY: goiYQuaMayChu, goiYToChuc: goiYToChucQuaMayChu, giaLap: giaLapQuaMayChu, docHinh: docHinhQuaMayChu };

/**
 * moiTruong: cách soạn mặc định (app thật: qua máy chủ; bản xem trước: quyền của người xem).
 * khoaRieng: cho giáo viên dùng khóa API của mình (khóa chỉ ở trình duyệt, gọi thẳng nhà cung cấp).
 */
export function TaoKhbd({ docFile, giaoAnMau, moiTruong: moiTruongGoc = MOI_TRUONG_MAY_CHU, layMau, luuFile, khoaRieng = true }: { docFile?: HamDocFile; giaoAnMau?: GiaoAnMau[]; moiTruong?: MoiTruongSoan; layMau?: HamLayMau; luuFile?: HamLuuFile; khoaRieng?: boolean } = {}) {
  const [khoa, setKhoa] = useState<{ khoa: KhoaAi; nho: boolean } | null>(null);
  const [mayChu, setMayChu] = useState<MayChuAi | null>(null);
  useEffect(() => {
    if (!khoaRieng) return;
    setKhoa(docKhoaAi());
    fetch("/api/soan").then((r) => r.json()).then((j) => setMayChu({ giaLap: j.giaLap !== false, nhaCungCap: j.nhaCungCap ?? null })).catch(() => setMayChu(null));
  }, [khoaRieng]);
  const doiKhoa = (k: KhoaAi | null, nho: boolean) => {
    if (k) luuKhoaAi(k, nho); else xoaKhoaAi();
    setKhoa(k ? { khoa: k, nho } : null);
  };
  // Có khóa riêng thì soạn ngay trên trình duyệt bằng khóa đó; không thì theo cách mặc định.
  const moiTruong = useMemo<MoiTruongSoan>(() => (khoaRieng && khoa ? moiTruongTrinhDuyet(adapterTuKhoa(khoa.khoa)) : moiTruongGoc), [khoaRieng, khoa, moiTruongGoc]);
  const [buoc, setBuoc] = useState(1);
  const [taiLen, setTaiLen] = useState<KetQuaTaiLen | null>(null);
  const [thongTin, setThongTin] = useState<ThongTinBai>({ mon: null, lop: null, tenBai: null, soTiet: null });
  const [luaChon, setLuaChon] = useState<LuaChon>(LUA_CHON_BAT_DAU);
  const [keHoach, setKeHoach] = useState<KeHoach | null>(null);
  const [noiDung, setNoiDung] = useState<NoiDungSoan>({});
  const [giaLap, setGiaLap] = useState(true);
  const ndRef = useRef<NoiDungSoan>({});
  useEffect(() => { moiTruong.giaLap().then(setGiaLap); }, [moiTruong]);

  const nguCanh = useMemo(
    () => (taiLen && keHoach ? nguCanhTu(taiLen.phanTich, thongTin, luaChon, keHoach, chiBaoNc1()) : null),
    [taiLen, thongTin, luaChon, keHoach],
  );
  // Ảnh trong giáo án gốc; chỉ đọc các ảnh mô hình nhận được (ảnh khác giữ nguyên).
  const hinh = useMemo(() => (taiLen ? layHinh(taiLen.phanTich) : []), [taiLen]);
  const hinhDoc = useMemo(() => (moiTruong.docHinh ? hinh.filter(docDuocAnh) : []), [hinh, moiTruong]);
  // Soạn từng lượt; kết quả lượt trước truyền cho lượt sau (vd HĐ III giải tình huống của HĐ I).
  const soanLuot: HamSoanLuot = useCallback(async (luot, signal) => {
    if (!nguCanh) return null;
    if (luot.ma === "doc_hinh") {
      const doc = await docCacHinh(hinhDoc, (h, s) => moiTruong.docHinh!(h, nguCanh, s), signal);
      ndRef.current = { ...ndRef.current, doc_hinh: doc };
      setNoiDung(ndRef.current);
      return doc;
    }
    const kq = await moiTruong.soan(luot.ma, nguCanh, ndRef.current, signal);
    if (kq) {
      ndRef.current = { ...ndRef.current, [luot.ma]: kq.duLieu };
      setNoiDung(ndRef.current);
    }
    return kq;
  }, [nguCanh, moiTruong, hinhDoc]);

  // Giữ nguyên danh sách lượt giữa các lần vẽ lại để bước 4 không chạy lại từ đầu.
  const dsLuot = useMemo(() => (keHoach ? lapDanhSachLuot(keHoach, luaChon, hinhDoc.length, taiLen?.phanTich.hoatDong) : []), [keHoach, luaChon, hinhDoc.length, taiLen]);

  const chuyen = (b: number) => { setBuoc(b); window.scrollTo(0, 0); };

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside><CotBuoc buoc={buoc} /></aside>
      <div className="min-w-0 space-y-5">
      {khoaRieng && buoc <= 4 && <KhoaAiCuaToi khoa={khoa?.khoa ?? null} nho={khoa?.nho ?? false} mayChu={mayChu} onDoi={doiKhoa} />}
      <div key={buoc} className="min-w-0 animate-hien">
        {buoc === 1 && (
          <Buoc1TaiLen docFile={docFile} giaoAnMau={giaoAnMau} onXong={(kq) => { setTaiLen(kq); setThongTin(kq.phanTich.thongTin); setLuaChon(LUA_CHON_BAT_DAU); chuyen(2); }} />
        )}
        {buoc === 2 && taiLen && (
          <Buoc2LuaChon taiLen={taiLen} thongTin={thongTin} setThongTin={setThongTin} luaChon={luaChon} setLuaChon={setLuaChon} goiYNls={moiTruong.goiY} goiYToChuc={moiTruong.goiYToChuc}
            onQuayLai={() => chuyen(1)}
            onBatDau={() => { setKeHoach(lapKeHoach(taiLen.phanTich, thongTin, luaChon)); ndRef.current = {}; setNoiDung({}); chuyen(3); }} />
        )}
        {buoc === 3 && taiLen && keHoach && (
          <Buoc3KeHoach phanTich={taiLen.phanTich} luaChon={luaChon} keHoach={keHoach} setKeHoach={setKeHoach}
            onQuayLai={() => chuyen(2)} onTiepTuc={() => chuyen(4)} />
        )}
        {buoc === 4 && keHoach && (
          <Buoc4Soan dsLuot={dsLuot} soanLuot={soanLuot} giaLap={giaLap} onBatDauLai={() => { ndRef.current = {}; setNoiDung({}); }} onQuayLai={() => chuyen(3)} onTiepTuc={() => chuyen(5)} />
        )}
        {buoc >= 5 && taiLen && keHoach && (
          <Buoc5KiemTra phanTich={taiLen.phanTich} thongTin={thongTin} luaChon={luaChon} keHoach={keHoach} noiDung={noiDung} nguCanh={nguCanh}
            layMau={layMau} luuFile={luuFile} buoc={buoc === 6 ? 6 : 5} hinh={hinh}
            onQuayLai={() => chuyen(buoc - 1)} onTiepTuc={() => chuyen(6)} />
        )}
      </div>
      </div>
    </div>
  );
}

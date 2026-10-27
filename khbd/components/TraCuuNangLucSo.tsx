"use client";

import { useState } from "react";
import { coDuLieuNls, locChiBao, nls, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import { NutDungTrongBaiSoan } from "./NutDungTrongBaiSoan";
import { IconLuoi, Nhan, Nut, oNhap } from "./ui";

export function TraCuuNangLucSo() {
  const [mien, setMien] = useState("");
  const [thanhPhan, setThanhPhan] = useState("");
  const [trinhDo, setTrinhDo] = useState(TRINH_DO_THPT);
  const [tuKhoa, setTuKhoa] = useState("");

  if (!coDuLieuNls()) {
    return (
      <div className="animate-hien the px-6 py-12 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-nhan-nhat text-nhan"><IconLuoi /></span>
        <p className="mt-4 font-medium">Chưa có dữ liệu năng lực số</p>
      </div>
    );
  }

  const dsThanhPhan = nls.thanhPhan.filter((t) => !mien || t.maMien === mien);
  const ketQua = locChiBao({ trinhDo, mien: mien || null, thanhPhan: thanhPhan || null, tuKhoa });
  const nhom = dsThanhPhan.map((tp) => ({ tp, ds: ketQua.filter((c) => c.maThanhPhan === tp.ma) })).filter((n) => n.ds.length);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 the p-4 md:grid-cols-[1fr_200px_260px_auto]">
        <input aria-label="Tìm theo mã hoặc từ khóa" className={oNhap} placeholder="Tìm theo mã (vd 1.1.5.2) hoặc từ khóa" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} />
        <select aria-label="Miền" className={oNhap} value={mien} onChange={(e) => { setMien(e.target.value); setThanhPhan(""); }}>
          <option value="">Tất cả miền</option>
          {nls.mien.map((m) => <option key={m.ma} value={m.ma}>Miền {m.ma}{m.ten ? `. ${m.ten}` : ""}</option>)}
        </select>
        <select aria-label="Năng lực thành phần" className={oNhap} value={thanhPhan} onChange={(e) => setThanhPhan(e.target.value)}>
          <option value="">Tất cả thành phần</option>
          {dsThanhPhan.map((t) => <option key={t.ma} value={t.ma}>{t.ma} {t.ten}</option>)}
        </select>
        {nls.trinhDo.length < 2 ? <span className="hidden md:block" /> : trinhDo === TRINH_DO_THPT ? (
          <Nut loai="phu" onClick={() => setTrinhDo(nls.trinhDo.find((t) => t.ma !== TRINH_DO_THPT)?.ma ?? TRINH_DO_THPT)}>Xem trình độ khác</Nut>
        ) : (
          <select aria-label="Trình độ" className={oNhap} value={trinhDo} onChange={(e) => setTrinhDo(e.target.value)}>
            {nls.trinhDo.map((t) => <option key={t.ma} value={t.ma}>{t.ma}{t.lop ? ` (${t.lop})` : ""}</option>)}
          </select>
        )}
      </div>
      <p className="text-sm text-chu-phu">{ketQua.length} chỉ báo · bậc {trinhDo}{trinhDo === TRINH_DO_THPT ? " (lớp 10 – 12)" : ""}</p>
      {nhom.map(({ tp, ds }) => (
        <section key={tp.ma} className="animate-hien overflow-hidden the">
          <header className="border-b border-vien px-5 py-3">
            <p className="text-xs text-chu-phu">Miền {tp.maMien}{nls.mien.find((m) => m.ma === tp.maMien)?.ten ? ` · ${nls.mien.find((m) => m.ma === tp.maMien)!.ten}` : ""}</p>
            <h2 className="font-semibold"><span className="font-mono text-nhan">{tp.ma}</span> {tp.ten}</h2>
          </header>
          <ul className="divide-y divide-vien">
            {ds.map((c) => (
              <li key={c.ma} className="flex items-start gap-4 px-5 py-3 text-sm">
                <Nhan loai="xanh">{c.ma}</Nhan>
                <span className="min-w-0 flex-1">{c.noiDung}</span>
                <NutDungTrongBaiSoan muc={{ loai: "nls", ma: c.ma, ten: `${c.ma}: ${c.noiDung}` }} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

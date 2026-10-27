"use client";

import { useEffect, useState } from "react";
import type { MonHoc } from "@khbd/lib/data/nang-luc-dac-thu";
import { docGio, type MucGioChon } from "@khbd/lib/gio-chon";
import { NutDungTrongBaiSoan } from "@khbd/components/NutDungTrongBaiSoan";
import { Nhan, oNhap } from "@khbd/components/ui";

export function TraCuuDacThu({ dsMon }: { dsMon: MonHoc[] }) {
  const [maMon, setMaMon] = useState(dsMon.find((m) => m.ma_mon === "TOAN")?.ma_mon ?? dsMon[0]?.ma_mon ?? "");
  const [gio, setGio] = useState<MucGioChon[]>([]);
  const mon = dsMon.find((m) => m.ma_mon === maMon);
  const capNhatGio = () => setGio(docGio().filter((g) => g.loai === "dac_thu"));
  useEffect(capNhatGio, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div>
        <label htmlFor="mon" className="mb-1.5 block text-sm font-medium lg:hidden">Môn học</label>
        <select id="mon" value={maMon} onChange={(e) => setMaMon(e.target.value)} className={oNhap + " lg:hidden"}>
          {dsMon.map((m) => <option key={m.ma_mon} value={m.ma_mon}>{m.ten_mon}</option>)}
        </select>
        <nav aria-label="Môn học" className="hidden overflow-hidden the lg:block">
          <p className="border-b border-vien px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-chu-phu">Môn học</p>
          <ul className="py-1">
            {dsMon.map((m) => (
              <li key={m.ma_mon}>
                <button type="button" onClick={() => setMaMon(m.ma_mon)} aria-current={m.ma_mon === maMon ? "true" : undefined}
                  className={"w-full px-4 py-2 text-left text-sm " + (m.ma_mon === maMon ? "bg-nhan-nhat font-medium text-nhan" : "hover:bg-nen")}>
                  {m.ten_mon}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {mon && (
        <div className="min-w-0 space-y-4">
          {mon.nang_luc.map((nl) => (
            <section key={nl.ma} className="overflow-hidden the">
              <header className="flex items-center justify-between gap-3 border-b border-vien px-5 py-3.5">
                <div>
                  <p className="text-xs text-chu-phu">Năng lực đặc thù môn {mon.ten_mon}</p>
                  <h2 className="font-semibold first-letter:uppercase">{nl.ten}</h2>
                </div>
                {nl.thanh_phan.length === 0 && <NutDungTrongBaiSoan muc={{ loai: "dac_thu", ma: nl.ma, ten: nl.ten }} onDoi={capNhatGio} />}
              </header>
              {nl.thanh_phan.length > 0 && (
                <ul className="divide-y divide-vien">
                  {nl.thanh_phan.map((tp, i) => (
                    <li key={tp.ma} className="flex items-start gap-4 px-5 py-3">
                      <span className="mt-0.5 w-5 shrink-0 text-sm tabular-nums text-chu-phu">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm first-letter:uppercase">{tp.ten}</p>
                        {tp.da_duyet && tp.bieu_hien.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-chu-phu">
                            {tp.bieu_hien.map((bh) => <li key={bh}>{bh}</li>)}
                          </ul>
                        )}
                      </div>
                      <NutDungTrongBaiSoan muc={{ loai: "dac_thu", ma: tp.ma, ten: `${nl.ten} – ${tp.ten}` }} onDoi={capNhatGio} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="the px-5 py-4">
            <div className="flex items-center gap-2"><Nhan loai="xanh">Gợi ý</Nhan><span className="text-sm font-medium">Ví dụ cách ghi biểu hiện ({mon.goi_y_thanh_phan})</span></div>
            <p className="mt-2 text-sm">{mon.goi_y}</p>
          </div>

          <div className="rounded-lg border border-dashed border-vien-dam bg-white px-5 py-4 text-sm">
            <p className="font-medium">Đã chọn để dùng trong bài soạn ({gio.length})</p>
            {gio.length === 0 ? (
              <p className="mt-1 text-chu-phu">Bấm “Dùng trong bài soạn” ở mục cần dùng. Các mục đã chọn sẽ hiện ở bước 2 khi soạn.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-0.5 pl-5">{gio.map((g) => <li key={g.ma} className="first-letter:uppercase">{g.ten}</li>)}</ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

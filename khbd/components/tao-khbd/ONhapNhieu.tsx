"use client";

import { useState } from "react";
import { IconDung, oNhap } from "@khbd/components/ui";

/** Chọn nhiều giá trị: bấm gợi ý hoặc gõ tự do rồi Enter. Không có giá trị mặc định. */
export function ONhapNhieu({
  id, nhan, giaTri, onDoi, goiY = [], viDu, goiYNho,
}: { id: string; nhan: string; giaTri: string[]; onDoi: (v: string[]) => void; goiY?: string[]; viDu?: string; goiYNho?: string }) {
  const [chu, setChu] = useState("");
  const them = (v: string) => {
    const t = v.trim();
    if (t && !giaTri.includes(t)) onDoi([...giaTri, t]);
    setChu("");
  };
  const batTat = (v: string) => (giaTri.includes(v) ? onDoi(giaTri.filter((x) => x !== v)) : onDoi([...giaTri, v]));
  const tuNhap = giaTri.filter((v) => !goiY.includes(v));

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{nhan}</label>
      {goiY.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {goiY.map((g) => {
            const chon = giaTri.includes(g);
            return (
              <button key={g} type="button" onClick={() => batTat(g)} aria-pressed={chon}
                className={"inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors " +
                  (chon ? "border-nhan bg-nhan-nhat font-medium text-nhan" : "border-vien-dam bg-surface hover:border-nhan")}>
                {chon && <IconDung className="h-3.5 w-3.5" />}{g}
              </button>
            );
          })}
        </div>
      )}
      {tuNhap.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {tuNhap.map((v) => (
            <span key={v} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-nhan bg-nhan-nhat pl-3 pr-1.5 text-[13px] font-medium text-nhan">
              {v}
              <button type="button" aria-label={`Bỏ ${v}`} onClick={() => onDoi(giaTri.filter((x) => x !== v))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-surface">×</button>
            </span>
          ))}
        </div>
      )}
      <input id={id} value={chu} onChange={(e) => setChu(e.target.value)} placeholder={viDu}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); them(chu); } }}
        onBlur={() => them(chu)} className={oNhap} />
      {goiYNho && <p className="mt-1 text-xs text-chu-phu">{goiYNho}</p>}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { batTatMuc, datGio, docGio, type MucGioChon } from "@khbd/lib/gio-chon";
import { IconDung } from "./ui";

export function NutDungTrongBaiSoan({ muc, onDoi }: { muc: MucGioChon; onDoi?: () => void }) {
  const [daChon, setDaChon] = useState(false);

  useEffect(() => {
    setDaChon(docGio().some((m) => m.ma === muc.ma));
  }, [muc.ma]);

  function bam() {
    const gio = batTatMuc(docGio(), muc);
    datGio(gio);
    setDaChon(gio.some((m) => m.ma === muc.ma));
    onDoi?.();
  }

  return (
    <button type="button" onClick={bam} aria-pressed={daChon}
      className={"inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors " +
        (daChon ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-surface text-nhan hover:border-nhan")}>
      {daChon && <IconDung className="h-3.5 w-3.5" />}
      {daChon ? "Đã chọn" : "Dùng trong bài soạn"}
    </button>
  );
}

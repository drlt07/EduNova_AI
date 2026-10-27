"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BAN_DO_APP, KhungTrang, type TenTrang } from "./KhungTrang";

export function KhungTrangApp({ children }: { children: ReactNode }) {
  const duong = usePathname();
  const hienTai = (Object.entries(BAN_DO_APP).find(([ma, d]) => ma !== "trang-chu" && duong.startsWith(d))?.[0] ?? "trang-chu") as TenTrang;
  return <KhungTrang banDo={BAN_DO_APP} hienTai={hienTai}>{children}</KhungTrang>;
}

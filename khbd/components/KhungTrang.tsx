import type { ReactNode } from "react";
import { IconSach } from "./ui";

export type TenTrang = "trang-chu" | "tao-khbd" | "dac-thu" | "nang-luc-so";

/** Đường dẫn của từng trang; bản xem trước truyền đường dẫn dạng #. */
export type BanDo = Record<TenTrang, string>;

export const BAN_DO_APP: BanDo = {
  "trang-chu": "/",
  "tao-khbd": "/tao-khbd",
  "dac-thu": "/tra-cuu/nang-luc-dac-thu",
  "nang-luc-so": "/tra-cuu/nang-luc-so",
};

const MUC: [TenTrang, string][] = [
  ["tao-khbd", "Tạo KHBD"],
  ["dac-thu", "Năng lực đặc thù"],
  ["nang-luc-so", "Năng lực số"],
];

export function KhungTrang({ banDo, hienTai, children }: { banDo: BanDo; hienTai?: TenTrang; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-vien bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
          <a href={banDo["trang-chu"]} className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-nhan text-white shadow-[0_4px_10px_-4px_rgb(31_79_182/0.6)]"><IconSach className="h-[18px] w-[18px]" /></span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight">Soạn KHBD THPT</span>
              <span className="hidden text-[11px] text-chu-phu sm:block">Lớp 10 – 12 · Chương trình GDPT 2018</span>
            </span>
          </a>
          <nav className="-mx-2 flex w-full items-center gap-1 overflow-x-auto text-sm sm:mx-0 sm:ml-auto sm:w-auto" aria-label="Chính">
            {MUC.map(([ma, ten]) => (
              <a key={ma} href={banDo[ma]} aria-current={hienTai === ma ? "page" : undefined}
                className={"relative whitespace-nowrap rounded-lg px-3 py-2 transition-colors " + (hienTai === ma ? "bg-nhan-nhat font-semibold text-nhan sm:bg-transparent" : "text-chu-phu hover:bg-nen hover:text-chu")}>
                {ten}
                {hienTai === ma && <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] hidden h-0.5 rounded-full bg-nhan sm:block" />}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-vien bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-5 text-xs text-chu-phu sm:px-6">
          <span className="font-medium text-chu">Soạn KHBD THPT</span>
          <span>Khung KHBD Giai đoạn 1 – 3 · Năng lực số theo Thông tư 02/2025/TT-BGDĐT · Chương trình GDPT 2018</span>
        </div>
      </footer>
    </div>
  );
}

export function TieuDeTrang({ tieuDe, moTa }: { tieuDe: string; moTa?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">{tieuDe}</h1>
      {moTa && <p className="mt-2 max-w-2xl text-[15px] text-chu-phu">{moTa}</p>}
    </div>
  );
}

/** Thành phần giao diện dùng chung: một kiểu nút, khung, ô nhập, thông báo cho toàn app. */
import type { ReactNode } from "react";

type IconProps = { className?: string };
const svg = (d: ReactNode) =>
  function Icon({ className = "h-5 w-5" }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {d}
      </svg>
    );
  };

export const IconTaiLen = svg(<><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>);
export const IconFile = svg(<><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></>);
export const IconDung = svg(<path d="m5 12 4.5 4.5L19 7" />);
export const IconCanhBao = svg(<><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17.5v.01" /></>);
export const IconSach = svg(<><path d="M4 5a1 1 0 0 1 1-1h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" /><path d="M20 5a1 1 0 0 0-1-1h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" /></>);
export const IconLuoi = svg(<><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>);
export const IconMuiTen = svg(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const IconKhoa = svg(<><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const IconThongTin = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>);

export function Nut({
  loai = "chinh", className = "", children, ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loai?: "chinh" | "phu" | "nhe" }) {
  const kieu = {
    chinh: "bg-nhan text-white hover:bg-nhan-dam border-nhan shadow-[0_1px_2px_rgb(16_26_44/0.12),0_4px_12px_-4px_rgb(31_79_182/0.45)]",
    phu: "bg-white text-chu border-vien-dam shadow-[0_1px_2px_rgb(16_26_44/0.05)] hover:border-nhan hover:text-nhan",
    nhe: "bg-transparent text-nhan border-transparent hover:bg-nhan-nhat",
  }[loai];
  return (
    <button type="button" {...p}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${kieu} ${className}`}>
      {children}
    </button>
  );
}

export function Khung({
  tieuDe, moTa, children, chanTrang, className = "", phai,
}: { tieuDe?: ReactNode; moTa?: ReactNode; children: ReactNode; chanTrang?: ReactNode; className?: string; phai?: ReactNode }) {
  return (
    <section className={`animate-hien the ${className}`}>
      {tieuDe && (
        <header className="flex items-start justify-between gap-4 border-b border-vien px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[17px] font-semibold">{tieuDe}</h2>
            {moTa && <p className="mt-0.5 text-sm text-chu-phu">{moTa}</p>}
          </div>
          {phai}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {chanTrang && <footer className="flex flex-wrap items-center justify-end gap-3 rounded-b-[14px] border-t border-vien bg-nen/60 px-5 py-3 sm:px-6">{chanTrang}</footer>}
    </section>
  );
}

export function Truong({ id, nhan, goiY, children, phai }: { id: string; nhan: ReactNode; goiY?: ReactNode; children: ReactNode; phai?: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">{nhan}</label>
        {phai}
      </div>
      {children}
      {goiY && <p className="mt-1 text-xs text-chu-phu">{goiY}</p>}
    </div>
  );
}

export const oNhap =
  "h-10 w-full rounded-lg border border-vien-dam bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-chu-phu/70 hover:border-nhan-vua focus:border-nhan focus:ring-4 focus:ring-nhan/10";

export function ThongBao({ loai = "canh-bao", tieuDe, children }: { loai?: "canh-bao" | "loi" | "thong-tin"; tieuDe?: ReactNode; children: ReactNode }) {
  const kieu = {
    "canh-bao": "border-amber-200 bg-amber-50 text-amber-900",
    loi: "border-red-200 bg-red-50 text-red-800",
    "thong-tin": "border-nhan/20 bg-nhan-nhat text-chu",
  }[loai];
  const Icon = loai === "thong-tin" ? IconThongTin : IconCanhBao;
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${kieu}`} role={loai === "loi" ? "alert" : undefined}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {tieuDe && <p className="font-medium">{tieuDe}</p>}
        <div className={tieuDe ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}

export function Nhan({ loai = "xam", children }: { loai?: "xam" | "xanh" | "vang"; children: ReactNode }) {
  const kieu = { xam: "bg-nen-dam text-chu-phu border-transparent", xanh: "bg-nhan-nhat text-nhan border-nhan-vua/60", vang: "bg-amber-50 text-amber-800 border-amber-200" }[loai];
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-1.5 py-[3px] text-[11px] font-medium leading-none ${kieu}`}>{children}</span>;
}

export function IconXoay({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-xoay ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Thanh phần trăm có chuyển động mượt. */
export function ThanhTienDo({ phanTram, nhan }: { phanTram: number; nhan?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(phanTram)));
  return (
    <div>
      {nhan && (
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-medium">{nhan}</span>
          <span className="tabular-nums text-chu-phu">{p}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-vien" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-nhan transition-[width] duration-500 ease-out" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export type TrangThaiViec = "cho" | "dang" | "xong" | "loi";
export type ViecTienDo = { ma: string; ten: string; trangThai: TrangThaiViec; chiTiet?: string };

/** Danh sách việc với trạng thái: chờ / đang làm / xong / lỗi. */
export function DanhSachTienDo({ viec }: { viec: ViecTienDo[] }) {
  return (
    <ol className="space-y-1">
      {viec.map((v) => (
        <li key={v.ma} className={"flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors " + (v.trangThai === "dang" ? "bg-nhan-nhat" : "")}>
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
            {v.trangThai === "xong" && <span className="grid h-5 w-5 animate-bat place-items-center rounded-full bg-nhan text-white"><IconDung className="h-3 w-3" /></span>}
            {v.trangThai === "dang" && <IconXoay className="h-4.5 w-4.5 text-nhan" />}
            {v.trangThai === "cho" && <span className="h-2 w-2 rounded-full bg-vien-dam" />}
            {v.trangThai === "loi" && <span className="grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">!</span>}
          </span>
          <span className="min-w-0">
            <span className={v.trangThai === "cho" ? "text-chu-phu" : v.trangThai === "dang" ? "font-medium text-nhan" : ""}>{v.ten}</span>
            {v.chiTiet && <span className="block text-xs text-chu-phu">{v.chiTiet}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

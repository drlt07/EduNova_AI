import { IconDung } from "@khbd/components/ui";
import { TEN_BUOC } from "./kieu";

export function CotBuoc({ buoc }: { buoc: number }) {
  return (
    <>
      <nav aria-label="Các bước" className="the sticky top-24 hidden p-5 md:block">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-chu-phu">Các bước</p>
        <ol>
          {TEN_BUOC.map((ten, i) => {
            const so = i + 1;
            const tt = so < buoc ? "xong" : so === buoc ? "dang" : "chua";
            return (
              <li key={ten} className="relative flex gap-3 pb-6 last:pb-0" aria-current={tt === "dang" ? "step" : undefined}>
                {so < TEN_BUOC.length && (
                  <span aria-hidden="true" className={"absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px " + (tt === "xong" ? "bg-nhan" : "bg-vien")} />
                )}
                <span className={"relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold " +
                  (tt === "dang" ? "bg-nhan text-white ring-4 ring-nhan-nhat shadow-[0_4px_10px_-4px_rgb(31_79_182/0.6)]" : tt === "xong" ? "bg-nhan text-white" : "border border-vien-dam bg-surface text-chu-phu")}>
                  {tt === "xong" ? <IconDung className="h-3.5 w-3.5" /> : so}
                </span>
                <span className="pt-0.5">
                  <span className={"block text-sm " + (tt === "chua" ? "text-chu-phu" : "font-medium")}>{ten}</span>
                  <span className={"block text-xs " + (tt === "dang" ? "text-nhan" : "text-chu-phu")}>
                    {tt === "xong" ? "Xong" : tt === "dang" ? "Đang làm" : "Chưa tới"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="the px-4 py-3 md:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{TEN_BUOC[buoc - 1]}</span>
          <span className="text-xs text-chu-phu">Bước {buoc}/6</span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {TEN_BUOC.map((t, i) => <span key={t} className={"h-1.5 flex-1 rounded-full " + (i < buoc ? "bg-nhan" : "bg-vien")} />)}
        </div>
      </div>
    </>
  );
}

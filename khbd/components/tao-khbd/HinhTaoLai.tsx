"use client";

import temml from "@khbd/lib/pipeline/6-xuat-file/dat-temml";
import type { HinhGoc } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import { tenLoaiHinh, type BanTaoLai, type DoiChieuHinh } from "@khbd/lib/pipeline/5-kiem-tra/doi-chieu-hinh";
import { Khung, Nhan } from "@khbd/components/ui";

const thoat = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Chữ có $LaTeX$ → HTML (công thức hiển thị bằng MathML). */
function chuCoCongThuc(s: string): string {
  return s.split(/(\$[^$]+\$)/).map((p) => {
    if (!/^\$[^$]+\$$/.test(p)) return thoat(p);
    try { return temml.renderToString(p.slice(1, -1)); } catch { return thoat(p); }
  }).join("");
}

function banHtml(b: BanTaoLai): string {
  if (b.loai === "bbt") return b.html;
  if (b.loai === "do_thi") return b.svg;
  if (b.loai === "cong_thuc") return chuCoCongThuc(`$${b.latex}$`);
  return `<table class="bang-tao-lai">${b.hang.map((h) => `<tr>${h.map((o) => `<td>${chuCoCongThuc(o)}</td>`).join("")}</tr>`).join("")}</table>`;
}

/**
 * Hình trong giáo án gốc: ảnh gốc bên trái, bản app tạo lại bên phải (khi đã đối chiếu khớp).
 * Giáo viên chọn giữ ảnh gốc cho từng hình.
 */
export function HinhTaoLai({ hinh, doiChieu, giuGoc, onDoi }: {
  hinh: HinhGoc[]; doiChieu: DoiChieuHinh[]; giuGoc: Set<string>; onDoi: (ma: string, giu: boolean) => void;
}) {
  const soThay = doiChieu.filter((d) => d.ketQua === "thay" && !giuGoc.has(d.ma)).length;
  return (
    <Khung tieuDe="Hình trong giáo án"
      moTa={`${doiChieu.length} hình. ${soThay ? `Tạo lại ${soThay} hình để sửa được trong Word (đã đối chiếu khớp với bản gốc)` : "Giữ nguyên các ảnh gốc"}${soThay < doiChieu.length && soThay ? "; các hình còn lại giữ ảnh gốc" : ""}.`}>
      <ul className="space-y-4">
        {doiChieu.map((d) => {
          const h = hinh.find((x) => x.ma === d.ma);
          const thay = d.ketQua === "thay" && !giuGoc.has(d.ma);
          return (
            <li key={d.ma} className="rounded-lg border border-vien p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-medium">{tenLoaiHinh(d.loai)}</span>
                {thay ? <Nhan loai="xanh">Tạo lại</Nhan> : <Nhan>Giữ ảnh gốc</Nhan>}
                {d.moTa && <span className="min-w-0 text-sm text-chu-phu" dangerouslySetInnerHTML={{ __html: chuCoCongThuc(d.moTa) }} />}
              </div>
              <div className={`grid gap-3 ${d.ban ? "sm:grid-cols-2" : ""}`}>
                <figure className="min-w-0">
                  <figcaption className="mb-1 text-xs text-chu-phu">Ảnh gốc</figcaption>
                  {h && <img src={`data:${h.mime};base64,${h.base64}`} alt="" className="max-h-56 max-w-full rounded border border-vien bg-white object-contain" />}
                </figure>
                {d.ban && (
                  <figure className="min-w-0">
                    <figcaption className="mb-1 text-xs text-chu-phu">Bản tạo lại</figcaption>
                    <div className="hinh-tao-lai max-h-56 overflow-auto rounded border border-vien bg-white p-2" dangerouslySetInnerHTML={{ __html: banHtml(d.ban) }} />
                  </figure>
                )}
              </div>
              {d.loai !== "khac" && <p className="mt-2 text-sm text-chu-phu" dangerouslySetInnerHTML={{ __html: chuCoCongThuc(d.canCu) }} />}
              {d.ketQua === "thay" && (
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--color-nhan)]" checked={giuGoc.has(d.ma)} onChange={(e) => onDoi(d.ma, e.target.checked)} />
                  Giữ ảnh gốc cho hình này
                </label>
              )}
            </li>
          );
        })}
      </ul>
    </Khung>
  );
}

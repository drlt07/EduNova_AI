"use client";

import { useMemo, useState } from "react";
import { coDuLieuNls, locChiBao, nls, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import { nangLucAi } from "@khbd/lib/data/nang-luc-ai";
import { goiYChiBao, type BaiDeGoiY } from "@khbd/lib/pipeline/2-lua-chon/goi-y-nls";
import { IconDung, IconXoay, Nhan, Nut, ThongBao, oNhap } from "@khbd/components/ui";
import type { GoiYNls } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";

export function OChon({ chon, onDoi, children, goiY }: { chon: boolean; onDoi: () => void; children: React.ReactNode; goiY?: React.ReactNode }) {
  return (
    <button type="button" onClick={onDoi} aria-pressed={chon}
      className={"group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-150 hover:-translate-y-px " +
        (chon ? "border-nhan bg-nhan-nhat/70 ring-1 ring-nhan" : "border-vien bg-surface hover:border-vien-dam hover:shadow-sm")}>
      <span className={"mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded border " + (chon ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-surface")}>
        {chon && <IconDung className="h-3 w-3 animate-bat" />}
      </span>
      <span className="min-w-0 flex-1">{children}{goiY}</span>
    </button>
  );
}

/** Chọn 1–3 mã năng lực số bậc 5; gợi ý theo nội dung kiến thức và cách tổ chức của bài (và soạn gợi ý khi có). */
export function ChonNls({ chon, onDoi, bai, goiYSoan }: {
  chon: string[]; onDoi: (ma: string[]) => void; bai: BaiDeGoiY;
  goiYSoan?: (signal: AbortSignal) => Promise<GoiYNls | null>;
}) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [soan, setSoan] = useState<{ dang: boolean; kq: GoiYNls | null; loi: string | null }>({ dang: false, kq: null, loi: null });
  async function chaySoanGoiY() {
    if (!goiYSoan) return;
    setSoan({ dang: true, kq: null, loi: null });
    try {
      setSoan({ dang: false, kq: await goiYSoan(new AbortController().signal), loi: null });
    } catch (e) {
      setSoan({ dang: false, kq: null, loi: e instanceof Error ? e.message : "Không soạn được gợi ý." });
    }
  }
  const [mien, setMien] = useState("");
  const nc1 = useMemo(() => locChiBao({ trinhDo: TRINH_DO_THPT }), []);
  const goiY = useMemo(() => goiYChiBao(nc1, bai, 5), [nc1, bai]);
  const ketQua = locChiBao({ trinhDo: TRINH_DO_THPT, mien: mien || null, tuKhoa });
  const batTat = (ma: string) => onDoi(chon.includes(ma) ? chon.filter((x) => x !== ma) : [...chon, ma]);

  if (!coDuLieuNls()) {
    return (
      <ThongBao loai="thong-tin">Chưa có dữ liệu năng lực số.</ThongBao>
    );
  }

  return (
    <div className="space-y-5">
      {goiYSoan && (
        <div className="rounded-md border border-nhan/25 bg-nhan-nhat/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">Đọc kĩ giáo án để chọn mã và vị trí có nhiệm vụ số thật sự.</p>
            <Nut loai="phu" className="h-9" disabled={soan.dang} onClick={chaySoanGoiY}>
              {soan.dang ? <><IconXoay /> Đang đọc giáo án…</> : "Gợi ý mã theo nội dung bài"}
            </Nut>
          </div>
          {soan.loi && <p className="mt-2 text-sm text-danger-fg">{soan.loi}</p>}
          {soan.kq && (
            <div className="mt-3 space-y-2">
              {soan.kq.goiY.length === 0 && <p className="text-sm text-chu-phu">Bài chưa có nhiệm vụ số phù hợp.</p>}
              {soan.kq.goiY.map((g) => {
                const cb = nls.chiBao.find((c) => c.ma === g.ma);
                return (
                  <OChon key={g.ma} chon={chon.includes(g.ma)} onDoi={() => batTat(g.ma)}
                    goiY={<span className="mt-1 block text-xs text-chu-phu"><Nhan loai="xanh">Gợi ý</Nhan> {g.lyDo}</span>}>
                    <span className="font-mono text-xs font-semibold text-nhan">{g.ma}</span> <span>{cb?.noiDung}</span>
                  </OChon>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Gợi ý theo nội dung và cách tổ chức của bài</p>
          <span className={"text-xs " + (chon.length > 3 ? "font-medium text-danger-fg" : "text-chu-phu")}>Đã chọn {chon.length}/3</span>
        </div>
        {goiY.length === 0 && <p className="text-sm text-chu-phu">Chưa đủ căn cứ để gợi ý. Thầy/cô chọn hình thức tổ chức, bấm “Gợi ý mã theo nội dung bài” hoặc tìm mã ở ô bên dưới.</p>}
        <div className="space-y-2">
          {goiY.map((g) => (
            <OChon key={g.chiBao.ma} chon={chon.includes(g.chiBao.ma)} onDoi={() => batTat(g.chiBao.ma)}
              goiY={<span className="mt-1 flex flex-wrap items-center gap-1">{g.lyDo.map((t) => <Nhan key={t}>{t}</Nhan>)}</span>}>
              <span className="font-mono text-xs font-semibold text-nhan">{g.chiBao.ma}</span> <span>{g.chiBao.noiDung}</span>
            </OChon>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Tìm trong toàn bộ chỉ báo bậc 5</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input aria-label="Tìm theo mã hoặc từ khóa" className={oNhap} placeholder="Gõ mã (vd 1.1) hoặc từ khóa (vd tìm kiếm)" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} />
          <select aria-label="Lọc theo miền" className={oNhap + " sm:w-56"} value={mien} onChange={(e) => setMien(e.target.value)}>
            <option value="">Tất cả miền</option>
            {nls.mien.map((m) => <option key={m.ma} value={m.ma}>Miền {m.ma}{m.ten ? `. ${m.ten}` : ""}</option>)}
          </select>
        </div>
        <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
          {ketQua.map((c) => (
            <OChon key={c.ma} chon={chon.includes(c.ma)} onDoi={() => batTat(c.ma)}>
              <span className="font-mono text-xs font-semibold text-nhan">{c.ma}</span> <span>{c.noiDung}</span>
            </OChon>
          ))}
          {ketQua.length === 0 && <p className="text-sm text-chu-phu">Không có chỉ báo phù hợp.</p>}
        </div>
      </div>
    </div>
  );
}

/** Chọn năng lực AI theo khung (NLa, NLc, NLd); khung đặt ở HĐ III. */
export function ChonAi({ chon, onDoi }: { chon: string[]; onDoi: (ma: string[]) => void }) {
  const batTat = (ma: string) => onDoi(chon.includes(ma) ? chon.filter((x) => x !== ma) : [...chon, ma]);
  const tatCa = nangLucAi.nang_luc.map((n) => n.ma);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-chu-phu">Theo khung, năng lực AI gắn với quy trình dùng AI có kiểm chứng ở HĐ III.</p>
        <Nut loai="nhe" className="h-8 px-3 text-xs" onClick={() => onDoi(chon.length === tatCa.length ? [] : tatCa)}>
          {chon.length === tatCa.length ? "Bỏ chọn tất cả" : "Dùng cả 3 gợi ý"}
        </Nut>
      </div>
      {nangLucAi.nang_luc.map((n) => (
        <OChon key={n.ma} chon={chon.includes(n.ma)} onDoi={() => batTat(n.ma)}
          goiY={<span className="mt-1 block text-xs text-chu-phu">Tiêu chí: {n.tieu_chi} Minh chứng: {n.minh_chung}.</span>}>
          <span className="font-mono text-xs font-semibold text-nhan">{n.ma}</span> <span>{n.mo_ta}</span> <Nhan loai="xanh">Gợi ý</Nhan>
        </OChon>
      ))}
    </div>
  );
}

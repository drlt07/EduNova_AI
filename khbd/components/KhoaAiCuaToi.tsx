"use client";

import { useState } from "react";
import { IconDung, IconKhoa, IconXoay, Khung, Nut, oNhap, ThongBao, Truong } from "@khbd/components/ui";
import { kiemTraKhoaAi, NHA_CUNG_CAP, type KhoaAi, type NhaCungCap } from "@khbd/lib/llm/khoa-nguoi-dung";

/** Tình trạng khóa chung của máy chủ (không bao giờ chứa khóa). */
export type MayChuAi = { giaLap: boolean; nhaCungCap: string | null };

const duoiKhoa = (k: string) => `…${k.trim().slice(-4)}`;

/**
 * Mục "Khóa AI của tôi": giáo viên dán khóa riêng (Claude hoặc Gemini), app kiểm tra rồi dùng khóa đó để soạn.
 * Thu gọn thành một dòng cho biết đang soạn bằng khóa nào.
 */
export function KhoaAiCuaToi({ khoa, nho, mayChu, onDoi }: {
  khoa: KhoaAi | null; nho: boolean; mayChu: MayChuAi | null;
  onDoi: (khoa: KhoaAi | null, nho: boolean) => void;
}) {
  const [mo, setMo] = useState(false);
  const [ncc, setNcc] = useState<NhaCungCap>(khoa?.nhaCungCap ?? "gemini");
  const [chuoiKhoa, setChuoiKhoa] = useState("");
  const [hien, setHien] = useState(false);
  const [moHinh, setMoHinh] = useState(khoa?.moHinh ?? "");
  const [nhoMay, setNhoMay] = useState(nho);
  const [trangThai, setTrangThai] = useState<{ dang: boolean; loi: string | null }>({ dang: false, loi: null });
  const tt = NHA_CUNG_CAP[ncc];

  async function kiemTraVaDung() {
    const moi: KhoaAi = { nhaCungCap: ncc, khoa: chuoiKhoa.trim(), moHinh: moHinh.trim() };
    setTrangThai({ dang: true, loi: null });
    try {
      await kiemTraKhoaAi(moi);
      onDoi(moi, nhoMay);
      setChuoiKhoa("");
      setTrangThai({ dang: false, loi: null });
      setMo(false);
    } catch (e) {
      setTrangThai({ dang: false, loi: e instanceof Error ? e.message : "Không kiểm tra được khóa." });
    }
  }

  const dongTomTat = khoa
    ? <>Đang soạn bằng khóa của thầy/cô: <span className="font-medium text-chu">{NHA_CUNG_CAP[khoa.nhaCungCap].ten}</span> <span className="tabular-nums">{duoiKhoa(khoa.khoa)}</span>{nho ? " · nhớ trên máy này" : ""}.</>
    : mayChu && !mayChu.giaLap
      ? <>Đang soạn bằng khóa chung của hệ thống. Thầy/cô có thể dùng khóa riêng của mình.</>
      : <>Chưa có khóa: bài soạn sẽ là nội dung mẫu để xem thử. Thêm khóa để soạn thật.</>;

  if (!mo) {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${khoa || (mayChu && !mayChu.giaLap) ? "border-vien bg-white text-chu-phu" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        <p className="flex min-w-0 items-center gap-2"><IconKhoa className="h-4 w-4 shrink-0" /><span>{dongTomTat}</span></p>
        <Nut loai="phu" className="h-9 px-4" onClick={() => { setMo(true); setTrangThai({ dang: false, loi: null }); }}>{khoa ? "Đổi khóa" : "Thêm khóa"}</Nut>
      </div>
    );
  }

  return (
    <Khung tieuDe="Khóa AI của tôi" moTa="Dùng khóa API của chính thầy/cô để soạn; chi phí và lượt dùng tính vào tài khoản của thầy/cô."
      phai={<Nut loai="nhe" className="h-9 px-3" onClick={() => setMo(false)}>Đóng</Nut>}
      chanTrang={<>
        {khoa && <Nut loai="phu" onClick={() => { onDoi(null, false); setMo(false); }}>Xóa khóa đang dùng</Nut>}
        <Nut onClick={kiemTraVaDung} disabled={trangThai.dang || !chuoiKhoa.trim()}>
          {trangThai.dang ? <><IconXoay /> Đang kiểm tra…</> : <><IconDung className="h-4 w-4" /> Kiểm tra và dùng khóa</>}
        </Nut>
      </>}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Nhà cung cấp">
          {(Object.keys(NHA_CUNG_CAP) as NhaCungCap[]).map((m) => (
            <label key={m} className={`cursor-pointer rounded-lg border p-3 transition-colors ${ncc === m ? "border-nhan bg-nhan-nhat" : "border-vien hover:border-nhan-vua"}`}>
              <input type="radio" name="nha-cung-cap" className="sr-only" checked={ncc === m} onChange={() => { setNcc(m); setTrangThai({ dang: false, loi: null }); }} />
              <span className="block font-medium">{NHA_CUNG_CAP[m].ten}</span>
              <span className="block text-sm text-chu-phu">{NHA_CUNG_CAP[m].moTa}</span>
            </label>
          ))}
        </div>

        <ol className="list-decimal space-y-1 pl-5 text-sm text-chu-phu">
          <li>Mở <a className="text-nhan underline" href={tt.diaChi} target="_blank" rel="noopener noreferrer">{tt.diaChi.replace(/^https:\/\//, "")}</a> và đăng nhập{ncc === "anthropic" ? " (cần thêm phương thức thanh toán)" : " bằng tài khoản Google"}.</li>
          <li>{tt.layKhoa}.</li>
          <li>Sao chép khóa, dán vào ô dưới rồi bấm “Kiểm tra và dùng khóa”.</li>
        </ol>

        <Truong id="khoa-ai" nhan={`Khóa API ${tt.ten}`}
          phai={<button type="button" className="text-xs text-nhan hover:underline" onClick={() => setHien((x) => !x)}>{hien ? "Ẩn" : "Hiện"}</button>}>
          <input id="khoa-ai" className={oNhap} type={hien ? "text" : "password"} autoComplete="off" spellCheck={false}
            placeholder={ncc === "anthropic" ? "sk-ant-…" : "AIza…"} value={chuoiKhoa} onChange={(e) => setChuoiKhoa(e.target.value)} />
        </Truong>

        <Truong id="mo-hinh-ai" nhan="Mô hình (không bắt buộc)" goiY={`Để trống để dùng mặc định: ${tt.moHinhMacDinh}.`}>
          <input id="mo-hinh-ai" className={oNhap + " sm:w-80"} value={moHinh} placeholder={tt.moHinhMacDinh} onChange={(e) => setMoHinh(e.target.value)} />
        </Truong>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-nhan)]" checked={nhoMay} onChange={(e) => setNhoMay(e.target.checked)} />
          <span>Nhớ khóa trên máy này <span className="text-chu-phu">(không chọn trên máy dùng chung; không chọn thì đóng trang là xóa khóa)</span></span>
        </label>

        <p className="text-xs text-chu-phu">Khóa chỉ lưu trên trình duyệt này và được gửi thẳng tới {tt.ten} khi soạn; hệ thống không nhận và không lưu khóa của thầy/cô.</p>

        {trangThai.loi && <ThongBao loai="loi">{trangThai.loi}</ThongBao>}
      </div>
    </Khung>
  );
}

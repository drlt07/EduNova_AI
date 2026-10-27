"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { dienMacDinh } from "@khbd/lib/pipeline/2-lua-chon/mac-dinh";
import { canPhuongAn, chuanHoaTheoBai, doiViec, hoatDongTiengAnhMacDinh, kiemTraLuaChon, NEN_TANG_TU_HOC_LHDN, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import type { ThongTinBai } from "@khbd/lib/pipeline/kieu";
import { docGio, type MucGioChon } from "@khbd/lib/gio-chon";
import { IconDung, Khung, Nhan, Nut, ThongBao, Truong, oNhap } from "@khbd/components/ui";
import { ONhapNhieu } from "./ONhapNhieu";
import { ChonAi, ChonNls } from "./ChonNangLuc";
import { DanhSachGoiYHinhThuc, NutGoiYTheoBai, TheHoatDong } from "./GoiYToChuc";
import { goiYCachLam, goiYTichHop, hoatDongTrienKhai } from "@khbd/lib/pipeline/2-lua-chon/goi-y-trien-khai";
import { GOI_Y_HINH_THUC_HD2, GOI_Y_HINH_THUC_HD3, goiYHinhThucHd2, goiYHinhThucHd3, goiYPhuongAn, goiYViec, nhiemVuHd3TheoMon, vanBanDeGoiY } from "@khbd/lib/pipeline/2-lua-chon/goi-y-to-chuc";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { nguCanhTu, type GoiYToChuc } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { chiBaoNc1, type HamGoiYNls, type HamGoiYToChuc } from "@khbd/lib/pipeline/4-sinh-noi-dung/moi-truong";
import type { KetQuaTaiLen } from "./kieu";

type Viec = "nls" | "ai" | "tiengAnh" | "lhdn";

const THE: { viec: Viec; ten: string; moTa: string }[] = [
  { viec: "nls", ten: "Năng lực số", moTa: "Thêm mã chỉ báo bậc 5 vào mục tiêu và nhiệm vụ số vào hoạt động phù hợp." },
  { viec: "ai", ten: "Năng lực AI", moTa: "Thêm mã năng lực AI, quy trình dùng AI có kiểm chứng và phiếu kiểm chứng." },
  { viec: "tiengAnh", ten: "Tiếng Anh", moTa: "Dịch một hoạt động trong tiến trình dạy học ở phụ lục tiếng Anh." },
  { viec: "lhdn", ten: "LHĐN", moTa: "Chuyển sang khung 3 giai đoạn: tự học trước giờ, lên lớp chỉnh lỗi, luyện tập, vận dụng." },
];

const PHUONG_AN = [
  { ma: "A", ten: "Mở rộng vận dụng", moTa: "Một mạch kiến thức chính, cần nhiều thời gian thực hành, thí nghiệm, dự án." },
  { ma: "B", ten: "Cuốn chiếu theo mạch", moTa: "Nhiều mạch tương đối độc lập; mỗi tiết một mạch, tiết cuối tổng hợp." },
  { ma: "C", ten: "Luyện tập theo mục", moTa: "Bài nặng kiến thức; mỗi mục một tiết luyện tập, tổng hợp ở cuối." },
] as const;

function NhanNhanDien({ coGiaTri }: { coGiaTri: boolean }) {
  return coGiaTri ? <Nhan>Đọc từ file</Nhan> : <Nhan loai="vang">Chưa nhận ra, thầy/cô chọn</Nhan>;
}

function TheChon({ id, chon, onDoi, tieuDe, moTa, kieu = "checkbox", ten, goiY }: {
  id: string; chon: boolean; onDoi: (v: boolean) => void; tieuDe: ReactNode; moTa: ReactNode; kieu?: "checkbox" | "radio"; ten?: string; goiY?: string;
}) {
  return (
    <label htmlFor={id} className={"relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-all duration-150 " +
      (chon ? "border-nhan bg-nhan-nhat/70 ring-1 ring-nhan" : "border-vien bg-white hover:-translate-y-px hover:border-nhan-vua hover:shadow-[var(--shadow-the)]")}>
      <input id={id} type={kieu} name={ten} className="peer sr-only" checked={chon} onChange={(e) => onDoi(e.target.checked)} />
      <span aria-hidden="true" className={"mt-0.5 grid h-5 w-5 shrink-0 place-items-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-nhan " +
        (kieu === "radio" ? "rounded-full " : "rounded ") + (chon ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-white")}>
        {chon && (kieu === "radio" ? <span className="h-2 w-2 animate-bat rounded-full bg-white" /> : <IconDung className="h-3.5 w-3.5 animate-bat" />)}
      </span>
      <span>
        <span className="block text-sm font-medium">{tieuDe}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-chu-phu">{moTa}</span>
        {goiY && <span className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-nhan"><Nhan loai="xanh">Gợi ý</Nhan><span className="pt-px">{goiY}</span></span>}
      </span>
    </label>
  );
}

export function Buoc2LuaChon({
  taiLen, thongTin, setThongTin, luaChon, setLuaChon, onQuayLai, onBatDau, goiYNls, goiYToChuc,
}: {
  goiYNls?: HamGoiYNls;
  goiYToChuc?: HamGoiYToChuc;
  taiLen: KetQuaTaiLen;
  thongTin: ThongTinBai;
  setThongTin: (t: ThongTinBai) => void;
  luaChon: LuaChon;
  setLuaChon: (l: LuaChon) => void;
  onQuayLai: () => void;
  onBatDau: () => void;
}) {
  // Chọn chức năng nào thì tích hợp chức năng đó; LHĐN mới chuyển khung. Hoạt động tiếng Anh luôn hợp lệ với bố cục.
  const datLuaChon = (l: LuaChon) => setLuaChon(chuanHoaTheoBai(l, taiLen.phanTich));
  // Bật chức năng nào thì app chọn sẵn thiết lập con theo bài (mã năng lực số, phương án A); GV vẫn sửa được.
  const batChucNang = (l: LuaChon) => setLuaChon(dienMacDinh(l, taiLen.phanTich, thongTin));
  const [gio, setGio] = useState<MucGioChon[]>([]);
  const [daBam, setDaBam] = useState(false);
  useEffect(() => setGio(docGio()), []);
  // Số tiết đổi thành từ 3 tiết trở lên khi đã bật LHĐN: chọn sẵn phương án A.
  useEffect(() => {
    if (canPhuongAn(luaChon, thongTin.soTiet ?? 0) && !luaChon.phuongAn) setLuaChon(dienMacDinh(luaChon, taiLen.phanTich, thongTin));
  }, [luaChon, thongTin, taiLen, setLuaChon]);

  const lc = luaChon;
  const doi = (x: Partial<LuaChon>) => datLuaChon({ ...lc, ...x });
  const goc = taiLen.phanTich.thongTin;
  const soTiet = thongTin.soTiet ?? 0;
  const yeuCauI1 = taiLen.phanTich.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.1");
  const loi = [
    ...(!thongTin.mon ? ["Chọn môn học."] : []),
    ...(!thongTin.lop ? ["Chọn lớp."] : []),
    ...(!thongTin.soTiet || thongTin.soTiet < 1 ? ["Nhập số tiết."] : []),
    ...kiemTraLuaChon(lc, soTiet, yeuCauI1.map((d) => d.ma)),
  ];
  const tenMach = lc.phuongAn === "B" ? "Mạch" : "Mục";
  const soDaChon = THE.filter((t) => lc[t.viec]).length;
  // Đọc giáo án để gợi ý: việc nên làm, hình thức HĐ II/HĐ III, phương án, mã năng lực số.
  const vanBanBai = useMemo(() => vanBanDeGoiY(taiLen.phanTich, thongTin), [taiLen, thongTin]);
  const viecGoiY = useMemo(() => goiYViec(taiLen.phanTich), [taiLen]);
  const goiYHd2 = useMemo(() => goiYHinhThucHd2(thongTin.mon, vanBanBai), [thongTin.mon, vanBanBai]);
  const goiYHd3 = useMemo(() => goiYHinhThucHd3(thongTin.mon, vanBanBai, thongTin.soTiet), [thongTin.mon, vanBanBai, thongTin.soTiet]);
  const nvHd3 = nhiemVuHd3TheoMon(thongTin.mon);
  const paGoiY = useMemo(() => goiYPhuongAn(taiLen.phanTich, thongTin), [taiLen, thongTin]);
  const baiDeGoiY = useMemo(
    () => ({ mon: thongTin.mon, vanBan: vanBanBai, hinhThucHD2: lc.hinhThucHD2, hinhThucHD3: lc.hinhThucHD3, tuHoc: lc.tuHoc.bat }),
    [thongTin.mon, vanBanBai, lc.hinhThucHD2, lc.hinhThucHD3, lc.tuHoc.bat],
  );
  /** Ngữ cảnh gửi cho phần gợi ý bằng LLM (kế hoạch tạm khi chưa chọn phương án). */
  const nguCanhGoiY = () => {
    let kh;
    try { kh = lapKeHoach(taiLen.phanTich, thongTin, lc); } catch { kh = lapKeHoach(taiLen.phanTich, thongTin, { ...lc, phuongAn: lc.phuongAn ?? "A" }); }
    return nguCanhTu(taiLen.phanTich, thongTin, lc, kh, chiBaoNc1());
  };
  const them = (ds: string[], v: string) => (ds.includes(v) ? ds : [...ds, v]);
  const dsHoatDong = useMemo(() => hoatDongTrienKhai(taiLen.phanTich, lc), [taiLen, lc]);
  const tichHop = useMemo(() => goiYTichHop(dsHoatDong, lc), [dsHoatDong, lc]);
  const [goiYBai, setGoiYBai] = useState<GoiYToChuc | null>(null);

  function datPhuongAn(pa: "A" | "B" | "C") {
    const soMach = pa === "A" ? 0 : Math.max(soTiet - 1, 2);
    const mach = pa === "A" ? [] : Array.from({ length: soMach }, (_, i) => lc.mach[i] ?? { ten: "", yeuCau: [] });
    doi({ phuongAn: pa, mach });
  }

  function ganYeuCau(maYc: string, viTri: number) {
    doi({ mach: lc.mach.map((m, i) => ({ ...m, yeuCau: i === viTri ? [...m.yeuCau.filter((y) => y !== maYc), maYc] : m.yeuCau.filter((y) => y !== maYc) })) });
  }

  return (
    <div className="space-y-6">
      <Khung tieuDe="Thông tin bài" moTa={<>Đọc từ file <span className="font-medium text-chu">{taiLen.tenFile}</span>. Thầy/cô sửa nếu chưa đúng.</>}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Truong id="mon" nhan="Môn học" phai={<NhanNhanDien coGiaTri={!!goc.mon} />}>
            <select id="mon" className={oNhap} value={thongTin.mon ?? ""} onChange={(e) => setThongTin({ ...thongTin, mon: e.target.value || null })}>
              <option value="">Chọn môn</option>
              {nangLucDacThu.mon.map((m) => <option key={m.ma_mon} value={m.ma_mon}>{m.ten_mon}</option>)}
            </select>
          </Truong>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium" id="nhan-lop">Lớp</span>
              <NhanNhanDien coGiaTri={!!goc.lop} />
            </div>
            <div role="radiogroup" aria-labelledby="nhan-lop" className="grid h-10 grid-cols-3 overflow-hidden rounded-md border border-vien-dam">
              {([10, 11, 12] as const).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={thongTin.lop === l} onClick={() => setThongTin({ ...thongTin, lop: l })}
                  className={"border-r border-vien-dam text-sm last:border-r-0 " + (thongTin.lop === l ? "bg-nhan font-medium text-white" : "bg-white hover:bg-nen")}>
                  Lớp {l}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Truong id="ten-bai" nhan="Tên bài" phai={<NhanNhanDien coGiaTri={!!goc.tenBai} />}>
              <input id="ten-bai" className={oNhap} value={thongTin.tenBai ?? ""} placeholder="Ví dụ: Bài 3. Bất phương trình bậc hai một ẩn" onChange={(e) => setThongTin({ ...thongTin, tenBai: e.target.value })} />
            </Truong>
          </div>
          <Truong id="so-tiet" nhan="Số tiết" phai={<NhanNhanDien coGiaTri={!!goc.soTiet} />}>
            <div className="flex h-10 w-40 overflow-hidden rounded-md border border-vien-dam">
              <button type="button" aria-label="Bớt một tiết" className="w-10 border-r border-vien-dam hover:bg-nen" onClick={() => setThongTin({ ...thongTin, soTiet: Math.max(1, (thongTin.soTiet ?? 2) - 1) })}>−</button>
              <input id="so-tiet" type="number" min={1} max={10} className="min-w-0 flex-1 text-center text-sm tabular-nums outline-none" value={thongTin.soTiet ?? ""}
                onChange={(e) => setThongTin({ ...thongTin, soTiet: e.target.value ? Number(e.target.value) : null })} />
              <button type="button" aria-label="Thêm một tiết" className="w-10 border-l border-vien-dam hover:bg-nen" onClick={() => setThongTin({ ...thongTin, soTiet: Math.min(10, (thongTin.soTiet ?? 0) + 1) })}>+</button>
            </div>
          </Truong>
        </div>

        {(taiLen.canhBao.length > 0 || taiLen.mathType.length > 0) && (
          <div className="mt-5 space-y-3">
            {taiLen.canhBao.length > 0 && (
              <ThongBao tieuDe="Lưu ý khi đọc file">
                <ul className="list-disc space-y-0.5 pl-4">{taiLen.canhBao.map((c) => <li key={c}>{c}</li>)}</ul>
              </ThongBao>
            )}
            {taiLen.mathType.length > 0 && (
              <ThongBao tieuDe="Công thức MathType cần nhập lại">
                <ul className="list-disc space-y-0.5 pl-4">{taiLen.mathType.map((m) => <li key={m.stt}>Công thức {m.stt}, trong đoạn “{m.nguCanh || "…"}”</li>)}</ul>
              </ThongBao>
            )}
          </div>
        )}
      </Khung>

      <Khung tieuDe="Chọn chức năng" moTa="Chọn chức năng rồi bấm Bắt đầu. Phần thiết lập bên dưới app đã chọn sẵn theo bài, thầy/cô chỉ sửa nếu muốn."
        phai={<span className="whitespace-nowrap text-sm text-chu-phu">Đã chọn {soDaChon}/{THE.length}</span>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {THE.map((t) => (
            <TheChon key={t.viec} id={`viec-${t.viec}`} chon={lc[t.viec]} onDoi={(v) => (v ? batChucNang : datLuaChon)(doiViec(lc, t.viec, v))} tieuDe={t.ten} moTa={t.moTa}
              goiY={t.viec in viecGoiY ? viecGoiY[t.viec as keyof typeof viecGoiY] : undefined} />
          ))}
        </div>
        {soDaChon > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-nen px-4 py-3 text-sm">
            <IconDung className="mt-0.5 h-4 w-4 shrink-0 text-nhan" />
            <span>{lc.lhdn
              ? "Chuyển giáo án sang khung 3 giai đoạn (Giai đoạn 1 – 3, HĐ I – IV), giữ nguyên nội dung của thầy/cô."
              : `Giữ nguyên bố cục giáo án gốc; chỉ thêm ${[lc.nls && "mã năng lực số và nhiệm vụ số", lc.ai && "mã năng lực AI và quy trình dùng AI", lc.tiengAnh && "bản dịch tiếng Anh một hoạt động ở phụ lục"].filter(Boolean).join(", ")}.`}</span>
          </p>
        )}
      </Khung>

      {lc.nls && (
        <Khung tieuDe="Thiết lập: Năng lực số" moTa="Đã chọn sẵn 2 mã phù hợp với bài; thầy/cô có thể đổi (1–3 mã chỉ báo bậc 5).">
          <ChonNls chon={lc.maNls} onDoi={(maNls) => doi({ maNls })} bai={baiDeGoiY}
            goiYSoan={goiYNls ? (signal) => goiYNls(nguCanhGoiY(), signal) : undefined} />
        </Khung>
      )}
      {lc.ai && (
        <Khung tieuDe="Thiết lập: Năng lực AI" moTa="Mô tả, tiêu chí, minh chứng chép nguyên văn từ khung.">
          <ChonAi chon={lc.maAi} onDoi={(maAi) => doi({ maAi })} />
        </Khung>
      )}
      {lc.tiengAnh && (
        <Khung tieuDe="Thiết lập: Tiếng Anh" moTa="Thầy/cô chọn cách tích hợp và hoạt động.">
          {thongTin.mon === "NGOAI_NGU" && <div className="mb-4"><ThongBao loai="thong-tin">Môn Ngoại ngữ không dùng CLIL; chỉ làm phụ lục tiếng Anh.</ThongBao></div>}
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {([["dich", "Dịch hoạt động", "Dịch đúng một hoạt động ở phụ lục tiếng Anh; KHBD giữ nguyên."], ["clil", "CLIL trong hoạt động", "Thêm key words và nhiệm vụ dùng tiếng Anh vào một hoạt động."], ["ca_hai", "Cả hai", "Thêm CLIL vào hoạt động và dịch hoạt động đó ở phụ lục."]] as const).map(([ma, ten, moTa]) => (
              <TheChon key={ma} id={`tieng-anh-${ma}`} kieu="radio" ten="cach-tieng-anh" chon={lc.cachTiengAnh === ma} onDoi={() => doi({ cachTiengAnh: ma })} tieuDe={ten} moTa={moTa} />
            ))}
          </div>
          <Truong id="hd-tieng-anh" nhan="Hoạt động tích hợp tiếng Anh" goiY={lc.lhdn
              ? "Đã chọn LHĐN: tích hợp vào hoạt động của khung mới (HĐ I–IV) sau khi chuyển khung. Nên chọn HĐ III."
              : "Giữ bố cục KHBD gốc: tích hợp vào đúng hoạt động của thầy/cô, các hoạt động khác giữ nguyên. Nên chọn hoạt động vận dụng."}>
            <select id="hd-tieng-anh" className={oNhap + " sm:w-96"} value={lc.hoatDongTiengAnh ?? ""} onChange={(e) => doi({ hoatDongTiengAnh: e.target.value || null })}>
              <option value="">Chọn hoạt động</option>
              {dsHoatDong.filter((h) => h.ma !== "GD1").map((h) => <option key={h.ma} value={h.ma}>{taiLen.phanTich.hoatDong.find((x) => x.ma === h.ma)?.cha ? "\u00a0\u00a0\u00a0– " : ""}{h.ten}{h.ma === hoatDongTiengAnhMacDinh(taiLen.phanTich, lc) ? " (gợi ý)" : ""}</option>)}
            </select>
          </Truong>
          {!dsHoatDong.some((h) => h.ma !== "GD1") && (
            <div className="mt-3"><ThongBao>Không nhận ra tiêu đề hoạt động trong giáo án. Thầy/cô đặt tiêu đề dạng “Hoạt động 1: Mở đầu” rồi tải lên lại.</ThongBao></div>
          )}
        </Khung>
      )}
      {lc.lhdn && (
        <Khung tieuDe="Thiết lập: LHĐN" moTa="Học sinh tự học trước giờ (Giai đoạn 1), lên lớp chỉnh lỗi, luyện tập, vận dụng.">
          <div className="sm:w-96">
            <Truong id="nen-tang-tu-hoc" nhan="Nền tảng tự học trước giờ" goiY="Mặc định EduNext; thầy/cô đổi được.">
              <input id="nen-tang-tu-hoc" className={oNhap} value={lc.tuHoc.nenTang} placeholder={NEN_TANG_TU_HOC_LHDN} onChange={(e) => doi({ tuHoc: { bat: true, nenTang: e.target.value } })} />
            </Truong>
          </div>
        </Khung>
      )}

      {canPhuongAn(lc, soTiet) && (
        <Khung tieuDe={`Cách tổ chức bài ${soTiet} tiết`} moTa="Đã chọn sẵn phương án A; phương án B, C thầy/cô đặt tên mạch và gán yêu cầu cần đạt.">
          <div className="grid gap-3 md:grid-cols-3">
            {PHUONG_AN.map((pa) => (
              <TheChon key={pa.ma} id={`pa-${pa.ma}`} kieu="radio" ten="phuong-an" chon={lc.phuongAn === pa.ma} onDoi={() => datPhuongAn(pa.ma)}
                tieuDe={`Phương án ${pa.ma} – ${pa.ten}`} moTa={pa.moTa} goiY={paGoiY?.ma === pa.ma ? paGoiY.lyDo : undefined} />
            ))}
          </div>
          {(lc.phuongAn === "B" || lc.phuongAn === "C") && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Tên các {tenMach.toLowerCase()}</p>
                  <div className="flex gap-1">
                    {lc.mach.length > 2 && <Nut loai="nhe" className="h-8 px-2 text-xs" onClick={() => doi({ mach: lc.mach.slice(0, -1) })}>Bớt</Nut>}
                    <Nut loai="nhe" className="h-8 px-2 text-xs" onClick={() => doi({ mach: [...lc.mach, { ten: "", yeuCau: [] }] })}>Thêm {tenMach.toLowerCase()}</Nut>
                  </div>
                </div>
                <div className="space-y-2">
                  {lc.mach.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <label htmlFor={`mach-${i}`} className="grid h-10 w-20 shrink-0 place-items-center rounded-md bg-nen text-xs font-medium text-chu-phu">{tenMach} {i + 1}</label>
                      <input id={`mach-${i}`} className={oNhap} value={m.ten} placeholder={`Tên ${tenMach.toLowerCase()} ${i + 1}`}
                        onChange={(e) => doi({ mach: lc.mach.map((x, j) => (j === i ? { ...x, ten: e.target.value } : x)) })} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Gán yêu cầu cần đạt</p>
                {yeuCauI1.length === 0 && <p className="text-sm text-chu-phu">Không tìm thấy yêu cầu cần đạt ở mục I.1 của giáo án.</p>}
                <div className="divide-y divide-vien rounded-md border border-vien">
                  {yeuCauI1.map((d) => {
                    const viTri = lc.mach.findIndex((m) => m.yeuCau.includes(d.ma));
                    return (
                      <div key={d.ma} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                        <span className="min-w-0 flex-1 text-sm">{d.vanBan}</span>
                        <select aria-label={`${tenMach} cho: ${d.vanBan}`} className={oNhap + " sm:w-40 " + (viTri < 0 ? "border-amber-300" : "")} value={viTri} onChange={(e) => ganYeuCau(d.ma, Number(e.target.value))}>
                          <option value={-1}>Chưa gán</option>
                          {lc.mach.map((m, i) => <option key={i} value={i}>{tenMach} {i + 1}{m.ten ? `: ${m.ten}` : ""}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Khung>
      )}


      {soDaChon > 0 && (
        <Khung tieuDe="Triển khai từng hoạt động" moTa={lc.lhdn ? "Hoạt động theo khung 3 giai đoạn. Bấm một gợi ý để chọn cách triển khai; HĐ II, HĐ III chọn hình thức thì app soạn lại." : "Hoạt động trong giáo án của thầy/cô. Chọn một gợi ý thì app soạn lại hoạt động đó theo cách đã chọn (mục tiêu, các bước GV/HS, sản phẩm, tiêu chí); câu hỏi, ví dụ, bài tập, bảng của thầy/cô giữ nguyên văn. Không chọn thì hoạt động giữ nguyên."}>
          <div className="space-y-4">
            {goiYToChuc && <NutGoiYTheoBai goiY={(signal) => goiYToChuc(nguCanhGoiY(), signal)} onKetQua={setGoiYBai} />}
            {dsHoatDong.map((h) => {
              const bai = goiYBai?.hoatDong.find((g) => g.ma === h.ma);
              const laHd23 = lc.lhdn && (h.ma === "HD2" || h.ma === "HD3");
              const khoa = h.ma === "HD2" ? "hinhThucHD2" : "hinhThucHD3";
              const dh = h.ma === "HD2" ? "dinhHuongHD2" : "dinhHuongHD3";
              return (
                <TheHoatDong key={h.ma} ten={h.ten} soanLai={!lc.lhdn && !!lc.trienKhai[h.ma]?.trim()} goiY={goiYCachLam(h, thongTin.mon, vanBanBai, thongTin.soTiet)} goiYBai={bai} tichHop={tichHop[h.ma] ?? []}
                  daChon={lc.trienKhai[h.ma] ?? ""} onChon={(v) => doi({ trienKhai: { ...lc.trienKhai, [h.ma]: v } })} onSua={(v) => doi({ trienKhai: { ...lc.trienKhai, [h.ma]: v } })}
                  dichDay={lc.tiengAnh && lc.hoatDongTiengAnh === h.ma} onDich={lc.tiengAnh ? () => doi({ hoatDongTiengAnh: h.ma }) : undefined}>
                  {laHd23 && (
                    <div className="mt-3 space-y-3">
                      {bai && (
                        <div className="rounded-lg border border-nhan-vua bg-nhan-nhat/50 p-3 text-sm">
                          <p><span className="font-medium">{bai.cachLam}</span>: {bai.moTa}</p>
                          {bai.tichHop.map((x) => <p key={x} className="mt-1 text-chu-phu">Tích hợp: {x}</p>)}
                          <Nut loai="phu" className="mt-2 h-8 text-xs" onClick={() => doi({ [khoa]: them(lc[khoa], bai.cachLam), [dh]: [bai.moTa, ...bai.tichHop].join(" ") } as Partial<LuaChon>)}>Dùng gợi ý này</Nut>
                        </div>
                      )}
                      <ONhapNhieu id={`hinh-thuc-${h.ma.toLowerCase()}`} nhan="Hình thức tổ chức" giaTri={lc[khoa]} onDoi={(v) => doi({ [khoa]: v } as Partial<LuaChon>)}
                        goiY={h.ma === "HD2" ? GOI_Y_HINH_THUC_HD2 : GOI_Y_HINH_THUC_HD3} viDu="Gõ hình thức khác rồi nhấn Enter" />
                      <DanhSachGoiYHinhThuc goiY={h.ma === "HD2" ? goiYHd2 : goiYHd3} giaTri={lc[khoa]} onDoi={(v) => doi({ [khoa]: v } as Partial<LuaChon>)}
                        dauDanhSach={h.ma === "HD3" && nvHd3 ? (
                          <p className="rounded-lg border border-vien bg-nen px-3 py-2 text-[13px]">
                            <span className="font-medium">Khung, môn {nvHd3.mon}:</span> {nvHd3.dang_nhiem_vu}. <span className="text-chu-phu">Sản phẩm: {nvHd3.san_pham}.</span>
                          </p>
                        ) : undefined} />
                      {lc[dh] && (
                        <Truong id={`dinh-huong-${h.ma}`} nhan="Diễn biến đã chọn (sửa được)">
                          <textarea id={`dinh-huong-${h.ma}`} rows={3} className={oNhap + " h-auto py-2"} value={lc[dh]} onChange={(e) => doi({ [dh]: e.target.value } as Partial<LuaChon>)} />
                        </Truong>
                      )}
                      {h.ma === "HD2" && (
                        <ONhapNhieu id="nen-tang" nhan="Nền tảng số cho luyện tập" giaTri={lc.nenTang} onDoi={(v) => doi({ nenTang: v })} viDu="Ví dụ: Kahoot, Quizizz, Azota, Google Forms" goiYNho="Có thể để trống." />
                      )}
                    </div>
                  )}
                </TheHoatDong>
              );
            })}
          </div>
        </Khung>
      )}

      {gio.length > 0 && (
        <Khung tieuDe="Đã chọn từ trang tra cứu">
          <ul className="list-disc space-y-0.5 pl-5 text-sm">{gio.map((g) => <li key={g.ma} className="first-letter:uppercase">{g.ten}</li>)}</ul>
          {gio.some((g) => g.loai === "nls") && (
            <Nut loai="phu" className="mt-3" onClick={() => datLuaChon(doiViec({ ...lc, maNls: [...new Set([...lc.maNls, ...gio.filter((g) => g.loai === "nls").map((g) => g.ma)])] }, "nls", true))}>
              Dùng các mã năng lực số đã chọn
            </Nut>
          )}
        </Khung>
      )}

      {daBam && loi.length > 0 && (
        <ThongBao loai="loi" tieuDe="Cần bổ sung trước khi bắt đầu">
          <ul className="list-disc space-y-0.5 pl-4">{loi.map((l) => <li key={l}>{l}</li>)}</ul>
        </ThongBao>
      )}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-vien bg-nen/95 px-1 py-3">
        <Nut loai="phu" onClick={onQuayLai}>Quay lại</Nut>
        <Nut onClick={() => { setDaBam(true); if (loi.length === 0) onBatDau(); }}>Bắt đầu</Nut>
      </div>
    </div>
  );
}

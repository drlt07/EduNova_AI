"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { LUA_CHON_BAT_DAU, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapKeHoach, type KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import type { ThongTinBai } from "@khbd/lib/pipeline/kieu";
import type { KetQuaTaiLen } from "@khbd/components/tao-khbd/kieu";
import { Buoc1TaiLen, docMacDinh } from "@khbd/components/tao-khbd/Buoc1TaiLen";
import { Buoc2LuaChon } from "@khbd/components/tao-khbd/Buoc2LuaChon";
import { Buoc3KeHoach } from "@khbd/components/tao-khbd/Buoc3KeHoach";
import { Buoc4Soan } from "@khbd/components/tao-khbd/Buoc4Soan";
import { Buoc5KiemTra } from "@khbd/components/tao-khbd/Buoc56";
import { KhoaAiCuaToi, type MayChuAi } from "@khbd/components/KhoaAiCuaToi";
import type { MoiTruongSoan } from "@khbd/app/tao-khbd/TaoKhbd";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import type { HamSoanLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/chay";
import { nguCanhTu, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { chiBaoNc1, docHinhQuaMayChu, giaLapQuaMayChu, goiYQuaMayChu, goiYToChucQuaMayChu, moiTruongTrinhDuyet, soanQuaMayChu } from "@khbd/lib/pipeline/4-sinh-noi-dung/moi-truong";
import { docCacHinh, docDuocAnh, layHinh } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import { adapterTuKhoa, docKhoaAi, luuKhoaAi, xoaKhoaAi, type KhoaAi } from "@khbd/lib/llm/khoa-nguoi-dung";
import type { HocLieuGan } from "@khbd/lib/pipeline/6-xuat-file/hoc-lieu";
import { getLesson } from "@/lib/data/curriculum";
import { KHBD_RUNTIME } from "@/lib/khbd/runtime";
import { cn } from "@/lib/utils";
import { LessonPicker, type LessonChoice } from "./lesson-picker";
import { StarterEditor } from "./starter-editor";
import { SimLinker } from "./sim-linker";
import { SavePanel } from "./save-panel";

const MAY_CHU: MoiTruongSoan = { soan: soanQuaMayChu, goiY: goiYQuaMayChu, goiYToChuc: goiYToChucQuaMayChu, giaLap: giaLapQuaMayChu, docHinh: docHinhQuaMayChu };

/** 8 màn hình, gom theo 5 bước giáo viên thấy. */
const NHOM = [
  { ten: "Chọn bài học", man: [1] },
  { ten: "Nhập hoặc tải KHBD", man: [2] },
  { ten: "Trợ lý phân tích và soạn", man: [3, 4, 5], con: ["Chọn tích hợp", "Lập kế hoạch", "Soạn nội dung"] },
  { ten: "Học liệu và mô phỏng", man: [6] },
  { ten: "Hoàn thiện", man: [7, 8], con: ["Kiểm tra", "Lưu và tải về"] },
];

function Stepper({ man }: { man: number }) {
  return (
    <nav aria-label="Các bước soạn KHBD" className="rounded-2xl border border-line bg-surface p-4">
      <ol className="space-y-3">
        {NHOM.map((n, i) => {
          const xong = man > Math.max(...n.man);
          const dang = n.man.includes(man);
          return (
            <li key={n.ten} aria-current={dang ? "step" : undefined}>
              <div className="flex items-center gap-2.5">
                {xong ? <CheckCircle2 className="size-5 shrink-0 text-success-fg" aria-label="xong" /> : dang ? <span className="grid size-5 shrink-0 place-items-center rounded-full bg-cyan text-[11px] font-bold text-[#04111f]">{i + 1}</span> : <Circle className="size-5 shrink-0 text-muted" aria-hidden />}
                <span className={cn("text-sm", dang ? "font-semibold text-fg" : xong ? "text-fg" : "text-muted")}>{n.ten}</span>
              </div>
              {dang && n.con && (
                <ol className="ml-7 mt-1.5 space-y-1 border-l border-line pl-3">
                  {n.con.map((c, k) => (
                    <li key={c} className={cn("text-xs", n.man[k] === man ? "font-medium text-cyan-fg" : n.man[k] < man ? "text-fg" : "text-muted")}>{c}</li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Trợ lý xây dựng KHBD: EduNova chọn bài, dựng bản khởi đầu, gắn mô phỏng và lưu; phân tích – soạn – kiểm tra – xuất Word
 * do trợ lý KHBD (khbd/) đảm nhận, giữ nguyên luật và kiểm tra của trợ lý.
 */
export function KhbdAssistant({ onSaved, initialLessonId }: { onSaved?: (planId: string) => void; initialLessonId?: string }) {
  const rt = KHBD_RUNTIME;
  const [man, setMan] = useState(1);
  const [chon, setChon] = useState<LessonChoice>(() => {
    const start = (initialLessonId && getLesson(initialLessonId)) || getLesson("L-10-if-kntt")!;
    return { grade: start.grade, textbookId: start.textbookId, lessonId: start.id, periods: 2, source: "upload" };
  });
  const lesson = getLesson(chon.lessonId);

  // Khóa AI riêng của GV (chỉ app Next.js) — giống TaoKhbd của trợ lý
  const [khoa, setKhoa] = useState<{ khoa: KhoaAi; nho: boolean } | null>(() => (rt.khoaRieng && typeof window !== "undefined" ? docKhoaAi() : null));
  const [mayChu, setMayChu] = useState<MayChuAi | null>(null);
  useEffect(() => {
    if (!rt.khoaRieng) return;
    fetch("/api/khbd/soan").then((r) => r.json()).then((j) => setMayChu({ giaLap: j.giaLap !== false, nhaCungCap: j.nhaCungCap ?? null })).catch(() => setMayChu(null));
  }, [rt.khoaRieng]);
  const doiKhoa = (k: KhoaAi | null, nho: boolean) => {
    if (k) luuKhoaAi(k, nho); else xoaKhoaAi();
    setKhoa(k ? { khoa: k, nho } : null);
  };
  const moiTruong = useMemo<MoiTruongSoan>(() => (rt.khoaRieng && khoa ? moiTruongTrinhDuyet(adapterTuKhoa(khoa.khoa)) : rt.moiTruong ?? MAY_CHU), [rt, khoa]);
  const [giaLap, setGiaLap] = useState(true);
  useEffect(() => { moiTruong.giaLap().then(setGiaLap); }, [moiTruong]);

  const [taiLen, setTaiLen] = useState<KetQuaTaiLen | null>(null);
  const [thongTin, setThongTin] = useState<ThongTinBai>({ mon: null, lop: null, tenBai: null, soTiet: null });
  const [luaChon, setLuaChon] = useState<LuaChon>(LUA_CHON_BAT_DAU);
  const [keHoach, setKeHoach] = useState<KeHoach | null>(null);
  const [noiDung, setNoiDung] = useState<NoiDungSoan>({});
  const [hocLieu, setHocLieu] = useState<HocLieuGan[]>([]);
  const ndRef = useRef<NoiDungSoan>({});

  const nguCanh = useMemo(() => (taiLen && keHoach ? nguCanhTu(taiLen.phanTich, thongTin, luaChon, keHoach, chiBaoNc1()) : null), [taiLen, thongTin, luaChon, keHoach]);
  const hinh = useMemo(() => (taiLen ? layHinh(taiLen.phanTich) : []), [taiLen]);
  const hinhDoc = useMemo(() => (moiTruong.docHinh ? hinh.filter(docDuocAnh) : []), [hinh, moiTruong]);
  const soanLuot: HamSoanLuot = useCallback(async (luot, signal) => {
    if (!nguCanh) return null;
    if (luot.ma === "doc_hinh") {
      const doc = await docCacHinh(hinhDoc, (h, s) => moiTruong.docHinh!(h, nguCanh, s), signal);
      ndRef.current = { ...ndRef.current, doc_hinh: doc };
      setNoiDung(ndRef.current);
      return doc;
    }
    const kq = await moiTruong.soan(luot.ma, nguCanh, ndRef.current, signal);
    if (kq) {
      ndRef.current = { ...ndRef.current, [luot.ma]: kq.duLieu };
      setNoiDung(ndRef.current);
    }
    return kq;
  }, [nguCanh, moiTruong, hinhDoc]);
  const dsLuot = useMemo(() => (keHoach ? lapDanhSachLuot(keHoach, luaChon, hinhDoc.length, taiLen?.phanTich.hoatDong) : []), [keHoach, luaChon, hinhDoc.length, taiLen]);
  const noiDungCuoi = useMemo<NoiDungSoan>(() => ({ ...noiDung, hoc_lieu: hocLieu }), [noiDung, hocLieu]);

  const chuyen = (m: number) => { setMan(m); window.scrollTo(0, 0); };

  /** File đã đọc xong (tải lên hoặc bản khởi đầu): lớp, số tiết theo lựa chọn ở bước 1; tên bài lấy từ file nếu đọc được. */
  const nhanFile = (kq: KetQuaTaiLen) => {
    setTaiLen(kq);
    setThongTin({ ...kq.phanTich.thongTin, mon: "TIN_HOC", lop: chon.grade, soTiet: chon.periods, tenBai: kq.phanTich.thongTin.tenBai ?? lesson?.title ?? null });
    setLuaChon(LUA_CHON_BAT_DAU);
    setHocLieu([]);
    chuyen(3);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <Stepper man={man} />
        <p className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3 text-xs text-muted">
          {giaLap ? <Circle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <Loader2 className="mt-0.5 size-3.5 shrink-0 text-success-fg" aria-hidden />}
          <span>{giaLap ? "Đang dùng nội dung mẫu (chưa kết nối mô hình AI)." : "Đã kết nối mô hình AI để soạn."} {rt.moTa}</span>
        </p>
      </aside>
      <div className="min-w-0 space-y-5">
        {rt.khoaRieng && man >= 2 && man <= 5 && <KhoaAiCuaToi khoa={khoa?.khoa ?? null} nho={khoa?.nho ?? false} mayChu={mayChu} onDoi={doiKhoa} />}
        <div key={man} className="min-w-0 animate-hien">
          {man === 1 && <LessonPicker value={chon} onChange={setChon} onNext={() => chuyen(2)} />}
          {man === 2 && chon.source === "upload" && (
            <div className="space-y-3">
              <Buoc1TaiLen docFile={rt.docFile ?? docMacDinh} giaoAnMau={rt.giaoAnMau} onXong={nhanFile} />
              <button type="button" className="text-sm font-medium text-cyan-fg hover:underline" onClick={() => chuyen(1)}>← Đổi bài học</button>
            </div>
          )}
          {man === 2 && chon.source === "starter" && lesson && <StarterEditor lesson={lesson} periods={chon.periods} docFile={rt.docFile ?? docMacDinh} onBack={() => chuyen(1)} onDone={nhanFile} />}
          {man === 3 && taiLen && chon.source === "starter" && (
            <p className="mb-4 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-fg">
              KHBD soạn mới: chọn <b>LHĐN</b> để trợ lý thiết kế lại tiến trình theo khung HĐ I–IV (mục tiêu, cách tổ chức, sản phẩm, tiêu chí đánh giá); chọn <b>Năng lực số</b> hoặc <b>Năng lực AI</b> để bổ sung vào hoạt động.
            </p>
          )}
          {man === 3 && taiLen && (
            <Buoc2LuaChon taiLen={taiLen} thongTin={thongTin} setThongTin={setThongTin} luaChon={luaChon} setLuaChon={setLuaChon} goiYNls={moiTruong.goiY} goiYToChuc={moiTruong.goiYToChuc}
              onQuayLai={() => chuyen(2)}
              onBatDau={() => { setKeHoach(lapKeHoach(taiLen.phanTich, thongTin, luaChon)); ndRef.current = {}; setNoiDung({}); setHocLieu([]); chuyen(4); }} />
          )}
          {man === 4 && taiLen && keHoach && <Buoc3KeHoach phanTich={taiLen.phanTich} luaChon={luaChon} keHoach={keHoach} setKeHoach={setKeHoach} onQuayLai={() => chuyen(3)} onTiepTuc={() => chuyen(5)} />}
          {man === 5 && keHoach && <Buoc4Soan dsLuot={dsLuot} soanLuot={soanLuot} giaLap={giaLap} onBatDauLai={() => { ndRef.current = {}; setNoiDung({}); }} onQuayLai={() => chuyen(4)} onTiepTuc={() => chuyen(6)} />}
          {man === 6 && taiLen && keHoach && (
            <SimLinker lesson={lesson} phanTich={taiLen.phanTich} thongTin={thongTin} luaChon={luaChon} keHoach={keHoach} noiDung={noiDung} value={hocLieu} onChange={setHocLieu} onBack={() => chuyen(5)} onNext={() => chuyen(7)} />
          )}
          {man >= 7 && taiLen && keHoach && (
            <div className="space-y-5">
              {man === 8 && (
                <SavePanel lesson={lesson} choice={chon} phanTich={taiLen.phanTich} thongTin={thongTin} luaChon={luaChon} keHoach={keHoach} noiDung={noiDungCuoi} hocLieu={hocLieu} layMau={rt.layMau} onSaved={onSaved} />
              )}
              <Buoc5KiemTra phanTich={taiLen.phanTich} thongTin={thongTin} luaChon={luaChon} keHoach={keHoach} noiDung={noiDungCuoi} nguCanh={nguCanh}
                layMau={rt.layMau} luuFile={rt.luuFile} buoc={man === 8 ? 6 : 5} hinh={hinh}
                onQuayLai={() => chuyen(man - 1)} onTiepTuc={() => chuyen(8)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

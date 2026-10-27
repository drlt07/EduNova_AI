"use client";

import { useRef, useState } from "react";
import type { BaoTienDo, KetQuaTaiLen } from "@khbd/lib/pipeline/kieu";
import { GIAI_DOAN_DOC, docVaPhanTichDocx, kiemTraFile } from "@khbd/lib/pipeline/1-tai-len/kiem-tra";
import { DanhSachTienDo, IconFile, IconTaiLen, Khung, Nut, ThanhTienDo, ThongBao, Truong, type ViecTienDo } from "@khbd/components/ui";

const TOI_DA = 20 * 1024 * 1024;

function kiemTra(f: File): string | null {
  const duoi = f.name.toLowerCase().split(".").pop();
  if (duoi === "doc") return "File .doc là định dạng Word cũ. Thầy/cô mở file trong Word, chọn Lưu thành (Save As) định dạng .docx rồi tải lại.";
  if (duoi !== "docx" && duoi !== "pdf") return "Chỉ nhận file .docx hoặc .pdf.";
  if (f.size > TOI_DA) return "File lớn hơn 20 MB.";
  return null;
}

export type HamDocFile = (file: File, sgk: File | null, baoTienDo: BaoTienDo) => Promise<KetQuaTaiLen>;

/** Gửi PDF lên máy chủ, báo phần trăm tải lên. */
function guiPdf(file: File, sgk: File | null, baoTienDo: BaoTienDo): Promise<KetQuaTaiLen> {
  return new Promise((ok, loi) => {
    const fd = new FormData();
    fd.append("file", file);
    if (sgk) fd.append("sgk", sgk);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/khbd/doc-file");
    xhr.upload.onprogress = (e) => e.lengthComputable && baoTienDo("tai_len", (e.loaded / e.total) * 100);
    xhr.upload.onload = () => baoTienDo("doc_pdf");
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) loi(new Error(json.loi ?? "Không đọc được file."));
        else { baoTienDo("xong"); ok(json); }
      } catch { loi(new Error("Không đọc được file.")); }
    };
    xhr.onerror = () => loi(new Error("Mất kết nối khi tải file lên. Thầy/cô thử lại."));
    baoTienDo("tai_len", 0);
    xhr.send(fd);
  });
}

/** File .docx đọc ngay trên trình duyệt (không giới hạn dung lượng gửi lên); PDF gửi lên máy chủ. */
export const docMacDinh: HamDocFile = async (file, sgk, baoTienDo) => {
  if (kiemTraFile(file.name, file.size) === "pdf") return guiPdf(file, sgk, baoTienDo);
  return docVaPhanTichDocx(file.name, new Uint8Array(await file.arrayBuffer()), baoTienDo);
};

export type GiaoAnMau = { ten: string; layFile: () => Promise<File> };

export function Buoc1TaiLen({
  onXong, docFile = docMacDinh, giaoAnMau = [],
}: { onXong: (kq: KetQuaTaiLen) => void; docFile?: HamDocFile; giaoAnMau?: GiaoAnMau[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [sgk, setSgk] = useState<File | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangDoc, setDangDoc] = useState(false);
  const [keo, setKeo] = useState(false);
  const [giaiDoan, setGiaiDoan] = useState<{ ma: string; phanTram?: number }>({ ma: "" });
  const input = useRef<HTMLInputElement>(null);

  function chon(f: File | undefined) {
    if (!f) return;
    const l = kiemTra(f);
    setLoi(l);
    setFile(l ? null : f);
  }

  async function taiLen(f: File | null = file) {
    if (!f) return;
    setDangDoc(true);
    setLoi(null);
    setGiaiDoan({ ma: "" });
    try {
      const kq = await docFile(f, sgk, (ma, phanTram) => setGiaiDoan({ ma, phanTram }));
      await new Promise((r) => setTimeout(r, 450)); // để thầy/cô kịp thấy các bước đã xong
      onXong(kq);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đọc được file.");
    } finally {
      setDangDoc(false);
    }
  }

  const kichThuoc = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  return (
    <div className="space-y-6">
      <Khung tieuDe="Tải lên giáo án" moTa="File .docx hoặc .pdf, tối đa 20 MB. File .docx giữ được bảng và công thức tốt hơn."
        chanTrang={<Nut disabled={!file || dangDoc} onClick={() => taiLen()}>{dangDoc ? "Đang đọc file…" : "Tải lên"}</Nut>}>
        <div className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setKeo(true); }}
            onDragLeave={() => setKeo(false)}
            onDrop={(e) => { e.preventDefault(); setKeo(false); chon(e.dataTransfer.files[0]); }}
            className={"rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors " + (keo ? "border-nhan bg-nhan-nhat" : "border-vien-dam bg-nen/50")}
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface text-nhan shadow-sm ring-1 ring-vien"><IconTaiLen /></span>
            <p className="mt-4 font-medium">Kéo thả file giáo án vào đây</p>
            <p className="mt-1 text-sm text-chu-phu">hoặc</p>
            <Nut loai="phu" className="mt-3" onClick={() => input.current?.click()}>Chọn file từ máy</Nut>
            <input ref={input} id="file-giao-an" type="file" accept=".docx,.pdf,.doc" className="hidden" onChange={(e) => chon(e.target.files?.[0])} />
          </div>

          {file && (
            <div className="flex items-center gap-3 rounded-md border border-vien px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-nhan-nhat text-nhan"><IconFile /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-chu-phu">{kichThuoc(file.size)}</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="text-sm text-chu-phu hover:text-chu">Bỏ</button>
            </div>
          )}

          {dangDoc && file && <TienDoDoc laPdf={file.name.toLowerCase().endsWith(".pdf")} giaiDoan={giaiDoan} />}

          {loi && <ThongBao loai="loi">{loi}</ThongBao>}

          <Truong id="file-sgk" nhan="Kèm nội dung SGK" goiY="Không bắt buộc. Giúp phần soạn bám sát SGK hơn.">
            <input id="file-sgk" type="file" accept=".docx,.pdf" onChange={(e) => setSgk(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-chu-phu file:mr-3 file:h-9 file:rounded-md file:border file:border-vien-dam file:bg-surface file:px-3 file:text-sm file:font-medium file:text-chu hover:file:border-nhan" />
          </Truong>
        </div>
      </Khung>

      {giaoAnMau.length > 0 && (
        <Khung tieuDe="Dùng thử giáo án mẫu" moTa="Chọn một giáo án mẫu nếu chưa có file.">
          <div className="grid gap-3 sm:grid-cols-3">
            {giaoAnMau.map((m) => (
              <button key={m.ten} type="button" disabled={dangDoc}
                className="flex items-start gap-3 rounded-md border border-vien p-3 text-left text-sm transition-colors hover:border-nhan disabled:opacity-50"
                onClick={async () => { const f = await m.layFile(); setFile(f); taiLen(f); }}>
                <IconFile className="mt-0.5 h-4 w-4 shrink-0 text-nhan" />
                <span>{m.ten}</span>
              </button>
            ))}
          </div>
        </Khung>
      )}
    </div>
  );
}

function TienDoDoc({ laPdf, giaiDoan }: { laPdf: boolean; giaiDoan: { ma: string; phanTram?: number } }) {
  const ds = GIAI_DOAN_DOC.filter((g) => (laPdf ? g.chiPdf : !g.chiPdf) || g.ma === "phan_tich");
  const viTri = giaiDoan.ma === "xong" ? ds.length : ds.findIndex((g) => g.ma === giaiDoan.ma);
  const viec: ViecTienDo[] = ds.map((g, i) => ({
    ma: g.ma,
    ten: g.ten,
    trangThai: i < viTri ? "xong" : i === viTri ? "dang" : "cho",
    chiTiet: g.ma === "tai_len" && i === viTri && giaiDoan.phanTram !== undefined ? `${Math.round(giaiDoan.phanTram)}%` : undefined,
  }));
  const trongBuoc = giaiDoan.ma === "tai_len" && giaiDoan.phanTram !== undefined ? giaiDoan.phanTram / 100 : 0.5;
  const phanTram = viTri >= ds.length ? 100 : ((Math.max(viTri, 0) + trongBuoc) / ds.length) * 100;
  return (
    <div className="animate-truot rounded-lg border border-nhan/25 bg-surface p-4">
      <ThanhTienDo phanTram={phanTram} nhan={viTri >= ds.length ? "Đã đọc xong" : "Đang đọc giáo án"} />
      <div className="mt-3"><DanhSachTienDo viec={viec} /></div>
    </div>
  );
}

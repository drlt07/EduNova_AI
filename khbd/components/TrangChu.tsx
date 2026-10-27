import type { BanDo } from "./KhungTrang";
import { IconDung, IconFile, IconKhoa, IconLuoi, IconMuiTen, IconSach, IconTaiLen } from "./ui";

const BUOC = [
  { Icon: IconTaiLen, ten: "Tải lên giáo án cũ", moTa: "File Word hoặc PDF. App tự nhận môn, lớp, tên bài, số tiết; đọc được chữ TCVN3, VNI và công thức Word." },
  { Icon: IconLuoi, ten: "Chọn năng lực, xem gợi ý", moTa: "Chọn phần cần tích hợp. App đọc giáo án rồi gợi ý hình thức HĐ II, HĐ III theo bảng của khung, mã năng lực số, phương án thời lượng." },
  { Icon: IconFile, ten: "Duyệt và tải về", moTa: "Kiểm tra tự động trước khi xuất. Tải bản sạch và bản đánh dấu phần bổ sung để rà soát." },
];

const VIEC = [
  { ten: "Giữ nguyên KHBD gốc", moTa: "Chỉ phần thuộc chức năng thầy/cô chọn được thêm vào; mục tiêu, nội dung, hoạt động khác giữ nguyên." },
  { ten: "Năng lực số", moTa: "Chỉ báo bậc 5 nguyên văn Thông tư 02/2025; nhiệm vụ số gắn vào hoạt động có sẵn, có công cụ, minh chứng, tiêu chí." },
  { ten: "Năng lực AI", moTa: "Quy trình tự làm trước, dùng AI gợi ý, kiểm chứng, đặt vào một hoạt động; kèm phiếu kiểm chứng." },
  { ten: "Tiếng Anh", moTa: "Dịch một hoạt động ở phụ lục hoặc thêm key words CLIL vào đúng một hoạt động." },
  { ten: "LHĐN", moTa: "Chuyển sang khung 3 giai đoạn: tự học trước giờ, hoạt động trên lớp, đánh giá sau giờ học." },
  { ten: "Gợi ý triển khai từng hoạt động", moTa: "Ví dụ khởi động: đóng kịch tình huống; luyện tập, vận dụng theo bảng gợi ý của khung." },
];

/** Hình minh họa: một trang KHBD với dòng giữ nguyên và dòng bổ sung, đúng cách app đánh dấu. */
function TrangMinhHoa() {
  const dong = (rong: string) => <span className="block h-2 rounded-full bg-vien" style={{ width: rong }} />;
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden="true">
      <div className="the rotate-[1.5deg] p-6 pb-7 font-serif text-[11px] leading-snug text-chu" style={{ boxShadow: "var(--shadow-the-noi)" }}>
        <p className="text-center font-bold">MÔN TOÁN – LỚP 10</p>
        <p className="text-center font-bold">BÀI 3. BẤT PHƯƠNG TRÌNH BẬC HAI MỘT ẨN (2 TIẾT)</p>
        <p className="mt-3 font-bold">I. MỤC TIÊU</p>
        <p className="font-bold">2. Năng lực</p>
        <p className="mt-1">- <b>Năng lực chung:</b></p>
        <div className="space-y-1.5 py-1.5 pl-5">{dong("88%")}{dong("72%")}</div>
        <p>- <b>Năng lực đặc thù môn Toán – Năng lực toán học:</b></p>
        <p className="pl-5">+ Mô hình hóa toán học: chuyển bài toán lợi nhuận thành bất phương trình bậc hai.</p>
        <p>- <b>Năng lực số:</b></p>
        <p className="mt-0.5 rounded-sm bg-nhan-nhat pl-5 pr-1">+ 5.2.5.2: Áp dụng được các công cụ số khác nhau… Biểu hiện trong bài: HS vẽ đồ thị trên GeoGebra trong HĐ III – tiết 2.</p>
        <p className="mt-3 font-bold">III. TIẾN TRÌNH DẠY HỌC</p>
        <div className="space-y-1.5 pt-1.5">{dong("94%")}{dong("80%")}{dong("62%")}</div>
      </div>
      <div className="absolute -top-4 right-2 flex items-center gap-2 rounded-xl border border-vien bg-white px-3 py-2 text-xs shadow-[var(--shadow-the)] sm:-right-4">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-nhan text-white"><IconDung className="h-3 w-3" /></span>
        <span><b>Kiểm tra tự động</b> · giữ 100% nội dung gốc</span>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-chu-phu">
        <span className="flex items-center gap-1.5"><IconKhoa className="h-3.5 w-3.5" /> Chữ của thầy/cô: giữ nguyên</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-nhan-vua bg-nhan-nhat" /> Phần bổ sung: nền xanh nhạt</span>
      </div>
    </div>
  );
}

export function TrangChu({ banDo }: { banDo: BanDo }) {
  return (
    <div className="hien-lan-luot space-y-16 sm:space-y-20">
      <section className="grid items-center gap-12 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-nhan-vua bg-nhan-nhat px-3 py-1 text-xs font-medium text-nhan">
            Khung KHBD Giai đoạn 1 – 3 · HĐ I – IV
          </p>
          <h1 className="mt-5 text-[34px] font-bold leading-[1.15] tracking-tight sm:text-[46px]">
            Nâng cấp giáo án cũ thành KHBD đúng khung, <span className="text-nhan">giữ nguyên nội dung của thầy/cô</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] text-chu-phu">
            Dành cho giáo viên THPT lớp 10, 11, 12. Tải giáo án lên, chọn phần cần tích hợp, duyệt kế hoạch và tải về
            file Word đúng thể thức trình bày.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={banDo["tao-khbd"]} className="inline-flex h-12 items-center gap-2 rounded-xl bg-nhan px-6 font-semibold text-white shadow-[0_1px_2px_rgb(16_26_44/0.12),0_8px_20px_-8px_rgb(31_79_182/0.7)] transition-colors hover:bg-nhan-dam">
              Bắt đầu soạn <IconMuiTen className="h-4 w-4" />
            </a>
            <a href={banDo["dac-thu"]} className="inline-flex h-12 items-center rounded-xl border border-vien-dam bg-white px-5 font-medium transition-colors hover:border-nhan hover:text-nhan">
              Tra cứu năng lực
            </a>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-vien pt-6">
            {[["45 phút", "mỗi tiết, đủ thời lượng"], ["Bậc 5", "năng lực số THPT"], ["3 nhóm", "phân hóa theo mức đạt"]].map(([so, nhan]) => (
              <div key={so}>
                <dt className="text-xl font-bold tracking-tight text-chu">{so}</dt>
                <dd className="mt-0.5 text-xs text-chu-phu">{nhan}</dd>
              </div>
            ))}
          </dl>
        </div>
        <TrangMinhHoa />
      </section>

      <section>
        <p className="nhan-muc">Cách làm</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Ba bước từ giáo án cũ đến file Word</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {BUOC.map(({ Icon, ten, moTa }, i) => (
            <li key={ten} className="the relative p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-nhan-nhat text-nhan"><Icon /></span>
                <span className="text-sm font-semibold tabular-nums text-chu-phu/60">Bước {i + 1}</span>
              </div>
              <p className="mt-5 text-[17px] font-semibold">{ten}</p>
              <p className="mt-1.5 text-sm text-chu-phu">{moTa}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="nhan-muc">Việc app làm được</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Chọn chức năng nào thì tích hợp chức năng đó</h2>
          <p className="mt-3 text-chu-phu">
            KHBD gốc là nguồn chuẩn. Phần thầy/cô không chọn thì app không viết, không nhắc; nền tảng số, hình thức tổ chức
            do thầy/cô quyết định, app chỉ gợi ý kèm căn cứ.
          </p>
        </div>
        <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {VIEC.map((v) => (
            <li key={v.ten} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-nhan text-white"><IconDung className="h-3.5 w-3.5" /></span>
              <span>
                <span className="block font-semibold">{v.ten}</span>
                <span className="mt-0.5 block text-sm text-chu-phu">{v.moTa}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { href: banDo["dac-thu"], Icon: IconSach, ten: "Tra cứu năng lực đặc thù", moTa: "Năng lực, thành phần năng lực và ví dụ cách ghi biểu hiện của 15 môn THPT." },
          { href: banDo["nang-luc-so"], Icon: IconLuoi, ten: "Tra cứu năng lực số", moTa: "6 miền, 24 năng lực thành phần, 55 chỉ báo bậc 5 cho lớp 10 – 12." },
        ].map(({ href, Icon, ten, moTa }) => (
          <a key={ten} href={href} className="the group flex items-center gap-5 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-nhan-vua hover:shadow-[var(--shadow-the-noi)]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nhan-nhat text-nhan transition-colors group-hover:bg-nhan group-hover:text-white"><Icon /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold">{ten}</span>
              <span className="mt-1 block text-sm text-chu-phu">{moTa}</span>
            </span>
            <IconMuiTen className="h-5 w-5 shrink-0 text-chu-phu transition-transform group-hover:translate-x-1 group-hover:text-nhan" />
          </a>
        ))}
      </section>
    </div>
  );
}

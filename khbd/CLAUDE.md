# CLAUDE.md – Nguyên tắc dự án KHBD THPT

Web app giúp giáo viên THPT (lớp 10, 11, 12) soạn kế hoạch bài dạy (KHBD) theo khung
trong `docs/khung_khbd.docx`. Đọc file này và `PLAN.md` trước khi làm bất cứ việc gì.

## Cách làm việc

- Đọc `docs/khung_khbd.docx`, `data/*`, `docs/bai_mau.docx` (nếu có) trước khi sửa code liên quan.
- Người dùng không phải lập trình viên: trước khi cài đặt hay chạy lệnh, giải thích ngắn bằng
  tiếng Việt.
- Mỗi phần trong `PLAN.md` làm trên một nhánh riêng (`phan-N-<ten>`), xong thì chạy test,
  báo kết quả và DỪNG chờ duyệt. Chỗ nào khung chưa rõ thì hỏi, không tự đoán.
- Cập nhật `PLAN.md` (tiến độ, việc tiếp theo) và file này trước khi kết thúc mỗi bước.
- Commit mọi thứ; phiên sau bắt đầu từ bản clone mới.
- Không ghi API key vào code. Đọc từ `LLM_API_KEY` (và các biến trong `.env.example`).
  `.env` nằm trong `.gitignore`.
- Trong phiên phát triển KHÔNG gọi LLM thật. Dùng adapter `mock` trả JSON mẫu đúng schema;
  mọi test dùng mock.
- File Word dùng để kiểm tra lưu vào `samples/output/` và commit.

## Nguyên tắc cốt lõi

1. **Code giữ khung, LLM điền nội dung.** Bố cục, định dạng, thời lượng, rẽ nhánh do code
   quyết định. LLM chỉ trả JSON theo schema zod. Không gửi cho LLM bất kì khung nào còn ngoặc `[ ]`.
2. **Mặc định THPT.** Lớp 10–12, tiết 45 phút, năng lực số **bậc 5** (NC1, Thông tư 02/2025; mã chỉ báo dạng `1.1.5.1`), năng lực đặc thù
   lấy từ `data/nang_luc_dac_thu.json` (bản THPT).
3. **Giữ nguyên nội dung của giáo viên.** KHBD cũ được tách thành đoạn có mã
   (`MT-xx`, `HD-xx`, `CH-xx`, `TB-xx`). LLM không trả lại văn bản của GV, chỉ trả mã đoạn
   và vị trí; code chép nguyên văn. LLM chỉ viết phần thiếu hoặc phần được phép sửa.
   Mỗi đoạn kết quả có `nguon: "giu_nguyen" | "bo_sung"`.
4. **Không mặc định nền tảng số hay hình thức tổ chức.** Mọi tên nền tảng trong khung
   (EduNext, Quizizz, Azota…) chỉ là ví dụ; trong mẫu và prompt đều là biến do GV chọn.
   Phần GV không chọn thì không viết, không nhắc (không chọn AI → không có chữ "AI").
   Ngoại lệ do GV yêu cầu: chọn LHĐN thì mặc định tự học trước giờ trên EduNext (GV đổi được).
5. **Dữ liệu trong `data/` là nguồn chuẩn.** LLM không sinh, không sửa. Mã năng lực LLM
   chọn từ enum lấy trong dữ liệu; nguyên văn chỉ báo/thành phần do code tra và chép.

## Quy ước kĩ thuật

- Dữ liệu trong `data/` phải có nguồn văn bản gốc và test đối chiếu nguyên văn; không viết theo trí nhớ.
- `data/nang_luc_dac_thu.json` sinh bằng `scripts/tao_nang_luc_dac_thu.py`; sửa script rồi chạy lại,
  không sửa tay file JSON.

- Next.js (App Router) + TypeScript + Tailwind; deploy được lên Vercel.
- LLM gọi qua `lib/llm/` (adapter `mock`, `anthropic`, `gemini`), structured output. Hai cách:
  (1) khóa chung của máy chủ: API route `/api/soan`, chọn bằng `LLM_PROVIDER`/`LLM_API_KEY` trong `.env`;
  (2) khóa riêng của GV (mục "Khóa AI của tôi", `lib/llm/khoa-nguoi-dung.ts`): khóa chỉ ở trình duyệt (phiên, hoặc
  nhớ trên máy nếu GV chọn), gọi thẳng nhà cung cấp (`dangerouslyAllowBrowser` cho Claude), máy chủ không nhận khóa.
  Không có khóa nào và máy chủ ở `mock` → nội dung mẫu, giao diện báo rõ. Mặc định Gemini: `gemini-flash-latest`.
- Pipeline 6 bước: mỗi bước một module trong `lib/pipeline/` (`1-tai-len`, `2-lua-chon`,
  `3-ke-hoach`, `4-sinh-noi-dung`, `5-kiem-tra`, `6-xuat-file`). Hàm thuần, có test.
- Đọc file: mammoth (docx → HTML), pdf-parse; PDF scan → ảnh từng trang cho LLM.
  Phát hiện TCVN3/VNI và đổi sang Unicode trước khi xử lý.
- Công thức: lưu dạng LaTeX trong `$...$`; xuất Word bằng temml (+ mhchem) → MathML →
  mathml2omml; xem trước bằng KaTeX.
- Xuất Word: docxtemplater + pizzip, `paragraphLoop: true`, `linebreaks: true`; bỏ chuỗi rỗng
  trước khi render. Định dạng chỉ qua Styles của `templates/mau.docx`; code không tự đặt font,
  trừ đoạn XML dựng tay cho thẻ `{@...}` (phải gắn `<w:pStyle>` và Times New Roman).
- Schema: zod. Test: vitest. Excel/CSV: exceljs.
- Luật viết cho LLM nằm trong `rules/*.md`, ghép theo lựa chọn của GV. Không viết luật cứng
  trong code prompt. Sửa luật xong chạy `npm run luat` (tự chạy trước dev/build/test).
- Mỗi lượt soạn định nghĩa ở `lib/pipeline/4-sinh-noi-dung/dinh-nghia.ts` (schema zod/v4 + yêu cầu).
  Adapter thật mặc định `claude-opus-5-5` qua `@anthropic-ai/sdk`; bản xem trước dùng quyền `sample`.
- Biểu hiện năng lực (đặc thù, số) viết theo: hành động quan sát được + nội dung kiến thức/kĩ năng +
  kết quả cần đạt (`rules/bieu_hien.md`). Câu gợi ý mỗi môn ngoài Toán là bản nháp chờ GV duyệt.
- `data/nls_*.csv` sinh bằng `scripts/tao_nls.py` từ `docs/nguon/nls_thong_tu_02_2025_bac5.tsv`.
- Giao diện chỉ ghi điều GV cần để thao tác; không ghi nguồn nội bộ, tên file, "chờ duyệt", ghi chú kĩ thuật.
- `data/goi_y_to_chuc.json` sinh bằng `scripts/tao_goi_y_to_chuc.py` (hai bảng gợi ý HĐ II, HĐ III của khung).
- Chế độ mặc định (GV yêu cầu): GV chỉ bật chức năng rồi bấm Bắt đầu. Bật chức năng thì app chọn sẵn thiết lập con
  theo bài (`2-lua-chon/mac-dinh.ts`: 2 mã năng lực số gợi ý đầu, không có căn cứ thì mã theo môn; phương án A cho bài
  ≥ 3 tiết; AI đủ mã theo khung), GV sửa được. Riêng tiếng Anh GV vẫn tự chọn cách tích hợp và hoạt động (không chọn
  sẵn; `cachTiengAnh`, `hoatDongTiengAnh` để null, ô chọn chỉ ghi "(gợi ý)"); kịch bản mẫu/test dùng `chonTiengAnhTheoGoiY`. Gợi ý khác (hình thức HĐ II/III, việc, cách triển
  khai) vẫn chỉ hiện để GV bấm chọn, không chọn sẵn; mỗi gợi ý ghi căn cứ.
- Mục I.2: năng lực chung → đặc thù → số → AI → CLIL; tiêu đề loại cấp 1 in đậm, từng dòng cấp 2.
- Phụ lục tiếng Anh: chỉ bản dịch hoạt động đã chọn; không bảng thuật ngữ, không ghi lại tên hoạt động.
- KHBD gốc là nguồn chuẩn; chỉ thay đổi phần thuộc chức năng GV chọn (4 chức năng: năng lực số, AI, tiếng Anh, LHĐN).
  `chuanHoaTheoBai`: chỉ LHĐN mới chuyển khung 3 giai đoạn; năng lực số/AI/tiếng Anh giữ bố cục gốc.
  - Tiếng Anh: `cachTiengAnh` dich (phụ lục, chỉ hoạt động đã chọn) | clil (key words + nhiệm vụ, chỉ chèn vào
    hoạt động đã chọn) | ca_hai; GV chọn hoạt động (gợi ý: LHĐN → HĐ III; giữ bố cục → vận dụng của GV). Không chèn CLIL vào mục tiêu khi giữ bố cục.
  - Năng lực số: chỉ đưa mã có hoạt động thực tế (đã soạn biểu hiện, vị trí hợp lệ); mỗi mã một lần; nêu công cụ,
    minh chứng, tiêu chí; mã không hợp → `boQua`. AI: quy trình đặt một lần (vận dụng hoặc HĐ III).
  - Mục tiêu năng lực: chuỗi liên kết mục tiêu → hoạt động → hành vi HS → sản phẩm → tiêu chí (`5-kiem-tra/lien-ket-nang-luc.ts`);
    năng lực thiếu mắt xích không ghi vào KHBD, bước 5 cảnh báo. Đặc thù: 1–3 thành phần đúng môn, gắn yêu cầu cần đạt, có
    sản phẩm và tiêu chí (tiêu chí đặt ở hoạt động thể hiện). Năng lực số: nhiệm vụ đúng hành vi của mã (`HANH_VI_NLS`).
    Dòng năng lực của GV xếp đúng nhóm (CLIL/số/AI không vào đặc thù). Tin học: "NL tin học – NLx", "NL AI – NLx".
  - Thiết kế hoạt động (`rules/hoat_dong.md`): prompt HĐ I–III kèm bối cảnh (đối tượng, thời lượng, thiết bị có sẵn);
    HĐ I, HĐ III có `cachToChuc`/`phuongPhap` + `buoc` (tên, phút, GV, HS; tổng = thời lượng), `thietBi`; HĐ III có `danhGia`;
    HĐ II có `giaoNhiemVu` cụ thể. Năng lực số có `phut`, `dieuChinh`, hành vi số thật. Kiểm tra khả thi (`5-kiem-tra/kha-thi.ts`):
    câu chung chung, tổng phút, số bước, thiết bị không có, sản phẩm/đánh giá, lặp phương pháp → lỗi thì soạn lại.
  - Thứ tự lượt: cấu trúc (gd1, hd1–hd4) → đặc thù → nls → ai → clil → tieng_anh. Test: `tests/to-hop-chuc-nang.test.ts`.
- Biên tập trước khi xuất: `ghep.ts` → `lapBanSoan` (bản soạn có cấu trúc, `6-xuat-file/ban-soan.ts`) →
  `bienTap` (`5-kiem-tra/bien-tap.ts`) → `dungDuLieuMau`. Đoạn mới phải gắn `vai`, `hd`, `chucNang` khi có. Biên tập
  không đổi chữ GV (chỉ đặt lại vị trí), không bỏ mục bắt buộc (mục tiêu, tổ chức, sản phẩm), không cắt kiến thức;
  chỉ bỏ phần lặp do sinh thêm. Thêm loại lỗi mới: thêm cả phần sửa (`bienTap`) và phần phát hiện (`kiemTraBanSoan`) + test.
- Nhận diện hoạt động (`nhanDienHoatDong` trong `3-ke-hoach/tach-doan.ts`): "Hoạt động 1/HĐ 2.1/HĐ II", "A. KHỞI ĐỘNG",
  "4. Vận dụng", "Giai đoạn 1/3", "Tiến trình dạy học 1/2/3", dòng in đậm chỉ có tên giai đoạn; tiến trình chỉ đánh số
  "1. …, 2. …" (hoặc I, II; A, B) → `suyRaHoatDongDanhSo` lấy dãy liên tiếp (ưu tiên dòng in đậm, bỏ mục con); không nhận "Hoạt động nhóm", "a) Mục tiêu", "3. Tổ chức
  thực hiện". Hoạt động con (2.1) có `cha`; phần sau "IV. Phụ lục/Rút kinh nghiệm" vào `kem` (không thuộc nội dung hoạt
  động). Dịch/CLIL một hoạt động dùng `doanCuaHoatDong` (gồm hoạt động con, không gồm hoạt động khác, phụ lục).
- LHĐN + tiếng Anh ≠ chỉ tiếng Anh: chỉ tiếng Anh → dịch hoạt động của KHBD gốc (giữ bố cục); LHĐN + tiếng Anh → dịch
  HĐ I–IV của khung mới đúng như trong bản soạn sau biên tập (`noiDungHoatDongMoi` trong `ghep.ts`: phần app soạn + phần
  GV xếp vào). Khi chuyển khung, phần `kem` của GV (phụ lục, phiếu) vào mục Phụ lục, không vào hoạt động.
- Gợi ý triển khai (giữ bố cục): GV chọn gợi ý cho hoạt động nào thì có lượt `tk_<mã hoạt động>` soạn lại hoạt động
  đó (`schemaHdMoi`: mục tiêu, cách tổ chức, bước + `maDoan`, sản phẩm, tiêu chí, `doanThay`). Code chép nguyên văn đoạn
  GV vào bước; chỉ đoạn mô tả cách tổ chức cũ bị thay (vào `doanKhongDung`); câu hỏi, bảng, công thức, hình không bao
  giờ bị thay; đoạn chưa đặt giữ ở "Tư liệu của giáo viên". Không chọn gợi ý → hoạt động giữ nguyên.
- Hình trong giáo án: ảnh gốc luôn nhúng lại (`KhoAnh`, đúng cỡ `wp:extent` ghi trong mô tả ảnh `khbd-kt:`). AI chỉ đọc
  ảnh (lượt `doc_hinh`, schema `SchemaDocHinh`); app tự tính và đối chiếu (`lib/toan/`, `5-kiem-tra/doi-chieu-hinh.ts`);
  chỉ thay khi khớp (bảng biến thiên/đồ thị cần hàm số hoặc kiểm tra nhất quán; công thức/bảng cần `chacChan: "cao"`),
  GV chọn giữ ảnh gốc từng hình. Không đoán hàm số từ hình. Hình minh họa luôn giữ ảnh gốc.
- Không cộng dồn năng lực: LHĐN (cấu trúc mới) → mục I.2 chỉ theo cấu trúc mới, KHBD gốc chỉ là tư liệu tham khảo;
  giữ bố cục → nhóm năng lực app soạn (số, AI) thay dòng cùng nhóm của gốc, đặc thù giữ nguyên. Dòng gốc bị thay ghi ở
  `BanSoan.doanKhongDung`; kiểm tra giữ nguyên dùng `doanCanGiu`.
- Trình bày Word: câu hỏi, từng phương án A/B/C/D, đáp án/lời giải/hướng dẫn chấm mỗi thứ một đoạn; bước = tên bước
  (cấp 1) + "GV:"/"HS:" (cấp 2). Biên tập tách cả đoạn GV gộp (chỉ xuống dòng, không đổi chữ, không cắt ngang thẻ).
- Regex với chữ tiếng Việt: không dùng `\b` sau/trước chữ có dấu; dùng `(?!\p{L})` với cờ `u`.
- Danh sách trong JSON luôn là mảng, mỗi phần tử một ý, không kí hiệu đầu dòng.

## Giao diện

- Giống phần mềm quản lý trường học / LMS: nền trắng, viền mảnh, một màu nhấn xanh dương đậm,
  font Be Vietnam Pro.
- KHÔNG: gradient, phát sáng, kính mờ, biểu tượng lấp lánh/ngôi sao/robot, emoji, tông tím–xanh,
  chữ "AI" trên nút.
- Dùng thành phần trong `components/ui.tsx`; nền trang `bg-nen` (xám lạnh rất nhạt), nội dung trong tấm `.the`
  (trắng, viền mảnh, bo 14px, bóng mềm). Màu và bóng chỉ khai báo ở `app/theme.css` (dùng chung app và bản xem trước).
- Trang chủ: phần giới thiệu kèm hình minh họa một trang KHBD (dòng giữ nguyên / dòng bổ sung), ba bước, việc app làm được.
- Chữ tiếng Việt thường ngày: "Tải lên", "Bắt đầu", "Tải về".

## Nguồn dữ liệu (ghi cuối trang tra cứu)

Thông tư 02/2025/TT-BGDĐT (24/01/2025); Công văn 3456/BGDĐT-GDPT (27/6/2025);
Chương trình GDPT 2018.

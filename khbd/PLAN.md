# PLAN.md – Web app soạn KHBD THPT

## Tình trạng hiện tại

- Yêu cầu đang theo: bản "XÂY DỰNG WEB APP SOẠN KHBD CHO GIÁO VIÊN THPT" (mục 1–9).
- Khung đã có: `docs/khung_khbd.docx` (bản Word, không phải PDF). Đã đọc toàn bộ.
- **Phần 1 (dữ liệu, tra cứu):** xong phần năng lực đặc thù; năng lực số bổ sung sau (GV đồng ý).
  - `data/nang_luc_dac_thu.json` (15 môn THPT) sinh bằng `scripts/tao_nang_luc_dac_thu.py` từ mục VII của khung.
  - Trang tra cứu năng lực đặc thù, giỏ chọn "Dùng trong bài soạn".
- **Phần 3 (đọc file + lập kế hoạch):** làm trước phần 2 theo yêu cầu GV ("tải lên, phân tích, chuyển đổi").
  - `lib/pipeline/1-tai-len`: docx (mammoth), pdf (pdf-parse), TCVN3/VNI → Unicode theo phông,
    OMML → LaTeX `$...$`, đánh dấu MathType `⟦MathType n⟧`, từ chối .doc / > 20 MB.
  - `lib/pipeline/2-lua-chon`: trích môn/lớp/tên bài/số tiết; schema lựa chọn (zod) và kiểm tra.
  - `lib/pipeline/3-ke-hoach`: tách đoạn có mã (MT/TB/HD/CH/TD/KH), nhóm mục tiêu I.1–I.3,
    nhận diện hoạt động cũ, ánh xạ sang khung mới, thời lượng (1, 2, A, B, C), ô vị trí, phạm vi sửa.
  - Giao diện bước 1–3 (`app/tao-khbd`), API `/api/doc-file`.
  - 3 giáo án giả trong `samples/input/` (sinh bằng `npx tsx scripts/tao-mau-dau-vao.ts`).
  - 43 test vitest đạt.
  - Bản xem trước chạy trong trình duyệt: `node scripts/xem-truoc/build.mjs` → `dist-xem-truoc/`
    (đọc .docx ngay trên máy, không cần máy chủ; dùng chung thành phần giao diện thật).
- **Giao diện (làm lại theo góp ý "xấu"):** bộ thành phần chung `components/ui.tsx` (Nut, Khung, Truong,
  ThongBao, Nhan, biểu tượng nét mảnh), khung trang `components/KhungTrang.tsx`, nền xám rất nhạt + khung trắng.
  Nhận diện thông tin bài mở rộng (mẫu 5512, tiêu đề, bảng đầu trang, tiết PPCT, tên file); 50 test đạt.
- **Hiệu ứng, tiến độ, gợi ý mã (theo góp ý GV):**
  - `app/hieu-ung.css`: hiện dần, nhích khi rê chuột, dấu tích bật, tôn trọng "giảm chuyển động".
  - Đọc .docx ngay trên trình duyệt (cả app thật), báo từng giai đoạn; PDF gửi máy chủ có % tải lên.
  - Bước 4: `lib/pipeline/4-sinh-noi-dung/luot.ts` (danh sách lượt theo lựa chọn), `chay.ts` (chạy
    từng lượt, dừng, soạn lại phần lỗi), `lib/llm` (adapter giả lập; thật bật bằng LLM_PROVIDER).
    Màn hình tiến độ: %, phần đang soạn, đã xong / còn lại / lỗi, đồng hồ.
  - Năng lực AI: `data/nang_luc_ai.json` (NLa, NLc, NLd nguyên văn khung, `scripts/tao_nang_luc_ai.py`).
  - Năng lực số: `lib/data/nls-csv.ts` (đọc + kiểm tra CSV), `scripts/kiem-tra-du-lieu.ts` (sinh
    `data/nls.json`), bộ gợi ý `goi-y-nls.ts`, trang tra cứu lọc miền/thành phần/trình độ. CSV hiện
    chỉ có dòng tiêu đề: CHỜ dữ liệu nguyên văn.
  - LHĐN: bật thì mặc định tự học trước giờ trên EduNext (`doiViec`).
  - 66 test đạt.
- **Phần 2 – Xuất Word (xong):**
  - `scripts/tao-mau-word.ts` → `templates/mau.docx`: Styles theo thể thức (A4, lề 2/2/3/1,5 cm, TNR 13,
    giãn dòng 1,15, cách sau 3 pt; TenBai 14 in hoa; Muc1/Muc2/TenHoatDong; List Bullet "-" / List Bullet 2 "+";
    bảng TNR 12, dòng 1,0, tiêu đề đậm giữa). Thẻ điều kiện ẩn phần không chọn, có điều kiện nửa câu (" VÀ NĂNG LỰC AI").
  - `lib/pipeline/6-xuat-file`: `cong-thuc.ts` (LaTeX → temml + mhchem → MathML → OMML, mã hóa < >),
    `xml.ts` (đoạn/bảng XML có pStyle + TNR, tô nền DEEAF6 ở bản đánh dấu), `cau-co-dinh.ts` (câu nguyên văn
    khung, có test đối chiếu), `ghep.ts` (đặt đoạn GV theo ánh xạ, không làm mất đoạn khi thiếu GĐ1/GĐ3),
    `xuat.ts` (docxtemplater; tên file không dấu), `xem-truoc.ts` (HTML xem trước, công thức MathML).
  - Nhãn "Mục tiêu:", "Tổ chức:", "Sản phẩm – đánh giá:" dựng trong code (đoạn có công thức phải là XML thô),
    lấy từ hằng số; tiêu đề mục lớn nằm trong mẫu.
  - `lib/pipeline/5-kiem-tra/kiem-tra-file.ts`: XML hợp lệ, chỗ trống, từ khóa AI, kí hiệu đầu dòng,
    nền tảng không chọn, giữ nguyên đoạn GV (bảng so từng ô), style/phông, LaTeX; tỉ lệ giữ nguyên.
  - Giao diện bước 5 (kiểm tra + xem trước) và bước 6 (Tải bản sạch / Tải bản đánh dấu); bản xem trước
    trên Claude dùng quyền `downloads`.
  - `scripts/xuat-mau.ts`: 4 tổ hợp → `samples/output/*.docx` (bản sạch + đánh dấu). 89 test đạt.
  - Lỗi đã sửa nhờ test: mathml2omml không mã hóa "<"; mất phần "Hình thành kiến thức" khi tạo lại hoạt
    động không có Giai đoạn 1 (nay đặt vào HĐ I); bộ kiểm tra nhầm "ai" (đại từ) với "AI".
- **Phần 4 – Sinh nội dung bằng LLM (xong phần lõi):**
  - `rules/*.md` (luat_loi, nls, ai, khong_ai, tieng_anh, cong_thuc, cau_hoi, lhdn rỗng) – trích nguyên văn
    phần in nghiêng của khung, có test đối chiếu và test không chứa ngoặc [ ]; gói bằng `npm run luat`
    → `lib/llm/luat.generated.ts` (tự chạy trước dev/build/test).
  - `lib/pipeline/4-sinh-noi-dung/dinh-nghia.ts`: mỗi lượt một schema zod/v4 + nội dung gửi LLM + luật ghép;
    mã năng lực số / thành phần đặc thù / vị trí là enum lấy từ dữ liệu và ô vị trí; lượt "goi_y_nls" gợi ý mã.
  - `ma-tran-cau-hoi.ts`: dạng câu theo môn (bảng của khung), số câu theo thời lượng HĐ II, mức độ.
  - `soan.ts`: soạn một lượt, kiểm tra (`5-kiem-tra/kiem-tra-noi-dung.ts`), lỗi nghiêm trọng → soạn lại
    đúng lượt đó, tối đa 2 lần.
  - `lib/llm`: adapter giả lập (`mau-gia-lap.ts`, ghi "giả lập"), Anthropic (`anthropic.ts`: claude-opus-5-5,
    `client.beta.messages.parse` + `betaZodOutputFormat`, effort medium, fallbacks "default"), `sample.ts`
    (quyền sample của trang Claude). API `/api/soan` chọn adapter theo LLM_PROVIDER (mock | anthropic).
  - `ghep.ts` nhận `NoiDungSoan`: năng lực số một danh sách cho I.2 + hoạt động + ma trận V; đặc thù; HĐ I–IV;
    câu hỏi + bảng đáp án; GĐ1; bản tiếng Anh.
  - Bước 2: nút "Gợi ý mã theo nội dung bài". Bước 5: thêm kiểm tra nội dung. 102 test đạt.
  - (Đã xong, xem dưới) Dữ liệu năng lực số; test vẫn dùng thêm `tests/fixtures/nls_gia.csv`.
  - Cấu trúc biểu hiện năng lực (GV quy định): hành động quan sát được + nội dung kiến thức/kĩ năng +
    kết quả cần đạt. `rules/bieu_hien.md` ghép vào lượt đặc thù và NLS; `kiemTraBieuHien` bắt chỗ trống,
    câu quá ngắn, thiếu "được", sai đầu câu → soạn lại. `goi_y` mỗi môn trong `nang_luc_dac_thu.json`
    (kèm `goi_y_thanh_phan`, `goi_y_nguon`): Toán là ví dụ của GV; 14 môn còn lại là bản nháp CHỜ GV duyệt
    (sửa trong `GOI_Y` của `scripts/tao_nang_luc_dac_thu.py`). 106 test đạt.
  - Năng lực số: đã có dữ liệu bậc 5 (THPT) từ bảng Thông tư 02/2025 do GV cung cấp
    (`docs/nguon/nls_thong_tu_02_2025_bac5.tsv` → `scripts/tao_nls.py` → `data/nls_*.csv` → `nls.json`):
    6 miền, 24 thành phần, 55 chỉ báo, mã dạng `1.1.5.1`. Tên 6 miền chưa có trong bảng nên để trống.
    Gợi ý mã (`goi-y-nls.ts`) căn cứ nội dung kiến thức + cách tổ chức (hình thức HĐ II/III, kĩ thuật trong
    giáo án, tự học trước giờ) + nhiệm vụ số nêu rõ; cộng điểm theo môn; mỗi thành phần một chỉ báo; hiện căn
    cứ cho GV. Không lấy tên nền tảng làm căn cứ (khung: "Không thêm mã chỉ vì có dùng nền tảng số").
  - Giao diện bỏ ghi chú thừa (nguồn, "chờ duyệt", ghi chú kĩ thuật). 108 test đạt.
  - Đọc giáo án rồi gợi ý (bước 2, `goi-y-to-chuc.ts`): việc nên làm (chuyển khung, tạo lại hoạt động,
    năng lực số; không gợi ý AI/tiếng Anh/LHĐN), hình thức HĐ II theo bảng "Gợi ý hình thức tổ chức HĐ II"
    và nhiệm vụ HĐ III theo bảng "Gợi ý nhiệm vụ HĐ III theo môn" của khung (`data/goi_y_to_chuc.json`,
    sinh bằng `scripts/tao_goi_y_to_chuc.py`, test đối chiếu nguyên văn), phương án bài ≥ 3 tiết, nhận diện
    môn/lớp từ nội dung. Nút "Gợi ý cách tổ chức theo nội dung bài" (lượt `goi_y_to_chuc`, luật
    `rules/to_chuc.md`): GV bấm "Dùng" → hình thức + `dinhHuongHD2/HD3` đưa vào lượt soạn HĐ II, HĐ III.
    Lượt hd2/hd3 kèm diễn biến/dạng nhiệm vụ của khung. 117 test đạt.
  - Xuất Word: mục I.2 đúng thứ tự khung (năng lực chung → đặc thù → số → AI → CLIL), tiêu đề loại in đậm
    cấp 1, từng năng lực/biểu hiện cấp 2; dòng năng lực của GV xếp vào đúng loại, giữ nguyên chữ, không lặp
    dòng soạn thêm cùng thành phần; GV chưa có năng lực chung thì dùng câu của khung. Phụ lục tiếng Anh bắt
    đầu ngay bằng bản dịch (không bảng thuật ngữ, không dòng "Hoạt động được chọn"); chưa có bản dịch thì
    không có phụ lục. Phương án trắc nghiệm xuống dòng dưới câu hỏi. 118 test đạt.
  - Giao diện làm mới: bảng màu chung `app/theme.css`, tấm `.the`, thanh trên cố định + chân trang, trang chủ mới
    (giới thiệu + hình minh họa trang KHBD, ba bước, việc app làm được, tra cứu), thẻ chọn bo mềm, menu điện thoại.
  - Bỏ hai thẻ "Chuyển sang khung mới", "Tạo lại hoạt động" (theo GV): bài soạn luôn chuyển khung
    (`chuanHoaLuaChon`, `LUA_CHON_BAT_DAU`); khung "Cách tổ chức hoạt động" luôn hiện kèm gợi ý; chọn hình thức
    HĐ II/HĐ III thì `taoLaiHoatDong` bật, bỏ trống thì giữ cách tổ chức của GV. Bước 2 đổi tên "Chọn tích hợp".
  - Sửa logic chức năng tích hợp (KHBD gốc là nguồn chuẩn). Nguyên nhân lỗi cũ: (1) luôn ép chuyển khung nên chỉ
    chọn tiếng Anh cũng đổi cả KHBD; (2) hoạt động tiếng Anh chỉ nhận HĐ I–IV, không chọn được hoạt động của GV, bản dịch
    lấy từ nội dung soạn mới (rỗng khi giữ bố cục); (3) dòng CLIL chèn vào mục tiêu dù chỉ dịch; (4) mã năng lực số hiện
    ở mục tiêu cả khi không có hoạt động tương ứng; (5) giữ bố cục thì không có quy trình AI; (6) HĐ IV, Giai đoạn 1 thiếu
    mục tiêu/sản phẩm. Đã sửa ở `lua-chon.ts` (`chuanHoaTheoBai`, `cachTiengAnh`), `luot.ts` (lượt `clil`, thứ tự),
    `dinh-nghia.ts` (schema NLS có `congCu`, `boQua`; `SchemaClil`; dịch đúng hoạt động GV), `ghep.ts`, `rules/*.md`.
    Bước 2: 4 thẻ chức năng, thiết lập tiếng Anh (dịch/CLIL/cả hai), "Triển khai từng hoạt động" (gợi ý theo loại
    hoạt động + phần tích hợp + gợi ý theo bài bằng LLM). 24 test tổ hợp mới; tổng 146 test đạt. Mẫu Word: 6 tổ hợp mới.
  - Rà soát mục tiêu năng lực. Lỗi cũ: đặc thù không gắn yêu cầu cần đạt, không có tiêu chí, không giới hạn số
    thành phần, không chặn lặp; dòng GV về tiếng Anh/NLS/AI bị xếp vào đặc thù; Tin học NLa–NLe lẫn với NLa/NLc/NLd của AI;
    năng lực số không kiểm tra nhiệm vụ đúng hành vi của mã, mã ngoài dữ liệu vẫn gửi cho LLM; không có kiểm tra chuỗi
    liên kết. Đã sửa: schema đặc thù (`yeuCau`, `tieuChi`), prompt đặc thù/NLS, `kiemTraDacThu`, `kiemTraNls`,
    `lien-ket-nang-luc.ts` (dùng ở xuất Word và bước 5), I.2 phân nhóm lại. Giáo án mẫu mới `tin10_bien_va_lenh_gan.docx`.
    Test: `tests/nang-luc-muc-tieu.test.ts` (Tin học 10, Toán 10); `to-hop-chuc-nang` chạy thêm Tin học. 166 test đạt.
  - Thiết kế hoạt động sư phạm, khả thi: luật `rules/hoat_dong.md` (yêu cầu và ví dụ Tin học 10 của GV); bối cảnh
    từng hoạt động trong prompt (đối tượng, thời lượng, thiết bị có sẵn); schema HĐ I/II/III có bước – phút – việc GV/HS,
    thiết bị, cách đánh giá; năng lực số có thời gian và cách điều chỉnh, phải có hành vi số thật (đưa vào chuỗi liên kết).
    Kiểm tra khả thi `kha-thi.ts` dùng sau mỗi lượt (soạn lại khi lỗi) và ở bước 5. Test `tests/kha-thi.test.ts`
    (4 môn mẫu). 179 test đạt.
  - Bước biên tập trước khi xuất (`5-kiem-tra/bien-tap.ts`) trên bản soạn có cấu trúc (`6-xuat-file/ban-soan.ts`):
    `lapBanSoan` ghép thành các phần, mỗi đoạn có `nguon`, `vai` (mục tiêu/tổ chức/bước/sản phẩm/tiêu chí…), `hd`,
    `chucNang`; `bienTap` sửa 9 loại lỗi (lặp giữa các phần, mã lặp "NLa: NLa:", lời nội bộ, phần không chọn, mã/tham
    chiếu không tồn tại, dấu câu, nhiệm vụ lặp, bước lặp nhiều cấp, phụ lục không dùng); `kiemTraBanSoan` phát hiện
    (bước 5 hiện danh sách chỗ đã sửa). Chữ GV không đổi, chỉ đặt lại vị trí; mục bắt buộc không bị bỏ. Sửa thêm ở
    phần ghép: ma trận không ghi mã hai lần, cột biểu hiện là biểu hiện (không phải nguyên văn chỉ báo); giữ bố cục thì
    năng lực chèn sau mục I.2 (trước đây lọt vào Phẩm chất) và vị trí AI ghi đúng hoạt động của GV; I.2 bỏ "Minh chứng"
    (đã có ở hoạt động, ma trận); HĐ III nhắc Phụ lục đánh giá; ô biểu hiện đặc thù ở phụ lục dẫn về mục tiêu. Luật
    chung bỏ câu dặn AI "chỉ ghi mã đoạn" (nguyên nhân MT-01 lọt vào KHBD). Test `tests/bien-tap.test.ts`. 202 test đạt.
  - Không cộng dồn năng lực + trình bày Word (theo KHBD Tin học 11 GV gửi, lưu ở `samples/input/tin11_he_dieu_hanh.docx`).
    Lỗi cũ: I.2 ghép dòng năng lực gốc (cả mã kiểu cũ `1.3NC1a`) với dòng app soạn; đáp án chung đoạn câu hỏi, phương
    án ngắn chung dòng, "Thực hiện nhiệm vụ" gộp nhiều bước; bước biên tập làm trống "3." của quy trình AI (tách câu nhầm ở
    số thứ tự, bỏ lặp giữa phần với chữ GV ở Phẩm chất). Đã sửa: LHĐN → I.2 lấy hoàn toàn theo cấu trúc mới (chung theo
    khung, đặc thù/số/AI app soạn, CLIL theo khung; gốc chỉ dùng đặc thù khi app không soạn được); giữ bố cục → nhóm số/AI
    app soạn thay dòng cùng nhóm của gốc; `doanKhongDung` + `doanCanGiu` để kiểm tra giữ nguyên không tính dòng đã thay.
    Trình bày: bước = tên bước (cấp 1, in đậm) + "GV:" + "HS:" (cấp 2); HĐ II tên bước + từng việc; mỗi phương án một dòng;
    đáp án, hướng dẫn chấm, lời giải xuống đoạn riêng. Bước biên tập thêm `tachTrinhBay` (tách cả đoạn GV, chỉ xuống dòng,
    không đổi chữ), loại lỗi `cong_don`, `trinh_bay`. Đọc file: tiêu đề in đậm bằng style, "HĐ I." (lỗi `\b` với chữ có
    dấu), Giai đoạn 1/3, đoạn tiến trình chưa thuộc hoạt động. Test `tests/cong-don-trinh-bay.test.ts`. 223 test đạt.
  - Chế độ mặc định: bật chức năng là đủ để bấm Bắt đầu (`dienMacDinh` chọn sẵn mã năng lực số, phương án A; GV đã chọn
    thì giữ). Tiếng Anh vẫn do GV chọn (cách tích hợp, hoạt động; không chọn sẵn). Test `tests/mac-dinh.test.ts`. 234 test đạt.
  - Khóa AI riêng của giáo viên (Claude hoặc Gemini): mục "Khóa AI của tôi" ở bước 1–4, kiểm tra khóa không tốn lượt
    (lấy thông tin mô hình), lỗi khóa/hết tiền/hết lượt báo tiếng Việt. Máy chủ hỗ trợ thêm `LLM_PROVIDER=gemini`.
    Thư viện `@google/genai` 2.26.0. Test `tests/khoa-ai.test.ts`. 243 test đạt. Chưa thử với khóa thật.
  - Đọc và tạo lại hình trong giáo án (bảng biến thiên, đồ thị hàm số, công thức chụp ảnh, bảng chụp ảnh). Ảnh gốc nay
    được nhúng lại vào file Word đúng cỡ (trước đây chỉ in dòng "[Chèn hình…]"). Lượt "Đọc n hình trong giáo án" chạy
    đầu bước 4: AI chỉ đọc (`rules/doc_hinh.md`, `lib/pipeline/4-sinh-noi-dung/doc-hinh.ts`, mỗi ảnh một lần gọi), app
    tự tính (`lib/toan/`: đọc biểu thức, bảng biến thiên, vẽ đồ thị SVG) và đối chiếu (`5-kiem-tra/doi-chieu-hinh.ts`).
    Khớp thì thay bằng bản sửa được trong Word: bảng biến thiên là bảng Word (nét đôi ở tiệm cận), đồ thị vẽ lại từ hàm
    số (PNG), công thức là Equation, bảng là bảng Word; lệch hoặc AI đọc không chắc → giữ ảnh gốc, ghi lí do. Bước 5 có
    khung "Hình trong giáo án" (ảnh gốc – bản tạo lại – căn cứ – ô "Giữ ảnh gốc"). Mô tả hình đưa vào ngữ cảnh các lượt
    sau. Giáo án mẫu `toan12_don_dieu_cuc_tri.docx` (`scripts/tao-mau-hinh.ts`). Test `tests/hinh.test.ts`. 274 test đạt.
    Chưa thử AI thật đọc ảnh; bản xem trước trong Claude (quyền sample) không gửi được ảnh nên giữ ảnh gốc.
  - Nhận diện đầu mục hoạt động dưới mọi dạng KHBD (5512, khung 5 bước A–E, LHĐN, thiếu tiêu đề mục III, có hoạt động
    con 2.1/2.2, có phụ lục cuối) để dịch tiếng Anh/CLIL đúng một hoạt động. Sửa lỗi cũ: "Hoạt động nhóm:" bị coi là
    hoạt động mới; "3. Tổ chức thực hiện", "1. Mục tiêu" trong hoạt động làm đổi mục lớn; phụ lục bị dịch cùng hoạt
    động cuối. Bước 2 báo khi không nhận ra hoạt động. Test `tests/nhan-dien-hoat-dong.test.ts`. 303 test đạt.
  - LHĐN + tiếng Anh khác chỉ tiếng Anh: LHĐN thì dịch/CLIL hoạt động của khung mới sau chuyển khung (trước đây dịch
    JSON thô của app, thiếu phần GV được xếp vào, tình huống chỉ là mã đoạn); chỉ tiếng Anh thì dịch hoạt động gốc.
    Phụ lục, phiếu của GV khi chuyển khung vào mục Phụ lục. 306 test đạt.
  - Tiến trình dạng "Tiến trình dạy học 1/2/3" hoặc chỉ đánh số "1. …, 2. …, 3. …" (không có chữ "Hoạt động"): nhận
    là hoạt động; loại theo tên, không rõ thì theo vị trí. 309 test đạt.
  - Chọn gợi ý triển khai cho hoạt động của KHBD gốc → app soạn lại hoạt động đó theo cách đã chọn (trước đây gợi ý chỉ
    là ngữ cảnh, hoạt động vẫn y cũ, chỉ thêm mã). Câu hỏi, ví dụ, bảng, công thức của GV giữ nguyên văn trong các bước.
    Test `tests/soan-lai-hoat-dong.test.ts`. 316 test đạt.
  - Không khóa cứng nút "Tiếp tục": bước 4 còn phần lỗi vẫn đi tiếp được (phần đó giữ nội dung GV), bước 5 còn lỗi
    kiểm tra thì nút "Vẫn tiếp tục để tải về" kèm cảnh báo. Bước 3 chỉ chặn khi GV sửa phút làm sai tổng.
- **Việc tiếp theo:** hỏi GV loại hình "khác" muốn tạo lại (đã chọn "Something else" khi chọn phạm vi); chạy thử
  đọc hình với khóa thật; chạy thử với khóa thật của GV (Claude, Gemini) và chỉnh luật theo kết quả; trang duyệt có sửa trực
  tiếp, "Bỏ", "Soạn lại mục này"; xuất bộ câu hỏi theo nền tảng; dữ liệu năng lực số (chờ nguyên văn);
  file luật `rules/*.md`; README.
- **Việc tiếp theo (cũ):** Phần 2 – mẫu Word `templates/mau.docx` + render JSON giả + công thức OMML;
  sau đó Phần 4 – sinh nội dung (adapter mock) và bộ kiểm tra; tạo các file `rules/*.md` từ phần
  in nghiêng của khung.
- **Đang chặn:**
  - Mạng của môi trường chỉ cho tải thư viện lập trình; không vào được thuvienphapluat.vn,
    moet.gov.vn, hoatieu.vn… Năng lực số đã có (GV dán bảng); còn thiếu tên 6 miền năng lực số và
    yêu cầu cần đạt chương trình các môn. Không viết dữ liệu theo trí nhớ.
- Chưa có kho Git từ xa: chỉ có kho Git cục bộ trong phiên.

## Đối chiếu khung với yêu cầu (đã thống nhất / cần hỏi)

- Thời lượng 2 tiết: khung ghi rõ Tiết 1 = HĐ I 15 + HĐ II 30; Tiết 2 = HĐ III 35 + HĐ IV 10. Đã rõ.
- PA A (3, 4 tiết), PA B (3 tiết; 4 tiết mỗi tiết mạch 8+20+14+3), PA C (tiết mục 5–10 / 25–35 / 3–7)
  có bảng cụ thể trong khung mục III.Giai đoạn 2.
- Khung có lề 2,54 cm mọi phía; mẫu xuất dùng lề theo yêu cầu (trên/dưới 2, trái 3, phải 1,5 cm).
- PA C khi số mục = số tiết: tổng hợp ghép cuối tiết mục cuối, mặc định 5 + 20 + 12 + 8 (tự đặt, GV sửa được; cần xác nhận).
- CẦN HỎI: năng lực AI trong khung ghi NLa, NLc, NLd kèm mô tả cố định; yêu cầu ghi dùng mã miền 6
  (6.1–6.3, NC1); phụ lục tiếng Anh của khung lại nhắc mã "6.3.NC1b".

## Cấu trúc thư mục dự kiến

```
app/                      Next.js App Router
  page.tsx                Trang chủ
  tra-cuu/nang-luc-dac-thu/
  tra-cuu/nang-luc-so/
  tao-khbd/               Luồng 6 bước + trang duyệt
  api/                    Route gọi LLM, đọc file, xuất file
components/               Giao diện dùng chung
lib/
  data/                   Đọc, tra cứu data/ (NLS, năng lực đặc thù)
  llm/                    Adapter: mock.ts, <nhà cung cấp>.ts, index.ts
  pipeline/               1-tai-len … 6-xuat-file
  schema/                 zod schema cho JSON LLM trả về và KHBD trung gian
  math/                   LaTeX ↔ OMML, kiểm tra KaTeX
  encoding/               TCVN3/VNI → Unicode
rules/                    luat_loi.md, nls.md, ai.md, khong_ai.md, tieng_anh.md,
                          cong_thuc.md, cau_hoi.md, lhdn.md (rỗng)
templates/mau.docx        Mẫu Word có thẻ docxtemplater
config/platforms.json     Ánh xạ cột xuất câu hỏi theo nền tảng
data/                     Dữ liệu chuẩn (không để LLM sinh/sửa)
scripts/                  kiem-tra-du-lieu.ts, trich-bieu-hien-ct2018.ts
samples/input/, samples/output/
tests/                    vitest
```

## Mô hình dữ liệu trung gian (tóm tắt)

- `DoanGoc { ma: "MT-01" | "HD-01" | "CH-01" | "TB-01", loai, html, vanBan }`: đoạn tách từ KHBD cũ.
- `DoanKetQua { nguon: "giu_nguyen" | "bo_sung", maGoc?, noiDung }`: `giu_nguyen` thì code chép từ `maGoc`.
- `KeHoach { soTiet, cachToChuc: "A"|"B"|"C"|null, tiet[]: { hoatDong[]: { ma, phut } }, oViTri[] }`.
- `NlsMuc { ma: "1.1.NC1a", viTri: "HD2_T1", hanhVi, minhChung, tieuChi }`: một mảng duy nhất,
  render vào I.2, hoạt động tương ứng và ma trận mục V.
- `LuaChon { chuyenKhung, taoLaiHoatDong, nls, ai, tiengAnh, lhdn, hinhThuc, nenTang[], nenTangTuHoc }`.

## Các bước

Thứ tự theo mục 9 của yêu cầu. Mỗi phần: nhánh riêng, test xanh, cập nhật PLAN.md và CLAUDE.md, báo kết quả, dừng chờ duyệt.

### Phần 1 – Dữ liệu, trang tra cứu, script kiểm tra (`phan-1-du-lieu-tra-cuu`) – ĐANG LÀM
- [x] Khởi tạo Next.js + TS + Tailwind + vitest; font Be Vietnam Pro; `.env.example`, `.gitignore`; trang chủ.
- `lib/data`: nạp CSV/JSON, tra theo mã, lọc theo miền/thành phần/trình độ, tìm từ khóa.
- `scripts/kiem-tra-du-lieu.ts`: mã trùng, mã sai định dạng (`^\d\.\d\.(CB|TC|NC)\d[a-z]$`,
  định dạng thật lấy theo CSV), chỉ báo rỗng, thành phần không có chỉ báo NC1.
- `scripts/trich-bieu-hien-ct2018.ts` (nếu có `data/ct2018/*.pdf`): trích nguyên văn bảng
  "Yêu cầu cần đạt về năng lực đặc thù" cấp THPT → `bieu_hien` + `da_duyet: false`,
  xuất `data/review_bieu_hien.md`.
- Trang chủ; trang tra cứu năng lực đặc thù; trang tra cứu năng lực số (mặc định NC1,
  nút xem trình độ khác, tìm theo từ khóa/mã); nút "Dùng trong bài soạn" → giỏ chọn
  (localStorage); dòng nguồn cuối trang.
- Test: tra mã NLS, lọc, script kiểm tra dữ liệu.

### Phần 2 – Mẫu Word + render JSON giả (`phan-2-mau-word`)
- Dựng `templates/mau.docx` đúng bố cục khung (cần khung): Styles theo mục 6 bước 6
  của yêu cầu, thẻ điều kiện cho từng module (cả mức nửa câu), biến tên nền tảng/hình thức.
- `lib/math`: `$...$` → temml(+mhchem) → MathML → mathml2omml → `{@...}`.
- Render bản sạch và bản đánh dấu (nền xanh nhạt cho `bo_sung`); tên file
  `KHBD_<môn>_<lớp>_<tên bài>.docx`.
- Test: render template từ JSON giả, đổi công thức, không còn `[ ]`, không dòng trống thừa,
  đúng style. Xuất `samples/output/`.

### Phần 3 – Đọc file + lập kế hoạch (`phan-3-doc-file-ke-hoach`)
- Đọc .docx (mammoth, giữ bảng/danh sách/in đậm/ảnh; OMML → LaTeX; liệt kê MathType không đọc
  được), .pdf có chữ (pdf-parse), PDF scan → ảnh trang; .doc → báo lưu lại thành .docx;
  TCVN3/VNI → Unicode.
- Tách đoạn có mã; nhận diện mục tiêu cũ (Kiến thức/Kĩ năng → I.1; Năng lực → I.2;
  Thái độ/Phẩm chất → I.3, giữ nguyên chữ, cảnh báo nhỏ về thuật ngữ).
- Bảng ánh xạ khung cũ → khung mới (GV đổi được).
- Lập thời lượng: 1, 2, ≥3 tiết (A, B, C); ràng buộc 45 phút/tiết, luôn có HĐ IV.
- Sinh danh sách ô vị trí (`GD1`, `HD1_T1`, `HD2_T1`, …).
- Ghép system prompt từ `rules/*.md`; tạo các file luật từ nguyên văn phần in nghiêng của khung.
- Tạo 3 KHBD giả trong `samples/input/` (Toán 10, Lịch sử 11, Hóa học 12).
- Test: thời lượng 1, 2, 3A, 3B, 4C tiết; tách đoạn; đổi mã chữ.

### Phần 4 – Sinh nội dung + kiểm tra (`phan-4-sinh-noi-dung`)
- `lib/llm`: adapter mock (JSON mẫu đúng schema) + adapter thật (structured output, ảnh).
- Sinh nội dung nhiều lượt nhỏ theo phạm vi được sửa; enum mã NLS/AI (NC1) và enum ô vị trí.
- Câu hỏi: code tính ma trận số câu, dạng câu theo môn (cần khung), mức độ; phương án nhiễu
  ứng với lỗi hiểu; câu tương tự lượt 2; GĐ1 theo Lý thuyết – Cơ bản – Nâng cao; exit ticket
  không trùng HĐ II.
- Kiểm định đáp án: lượt AI thứ hai giải đề đã xóa đáp án → so → sinh lại câu lệch.
- Phụ lục tiếng Anh: lượt dịch cuối, bảng thuật ngữ trong khung, thay mã/tên nền tảng bằng `⟦n⟧`.
- Bộ kiểm tra (mỗi loại lỗi một hàm, có test): `[ ]`/`......`, kí hiệu đầu dòng, nền tảng/hình
  thức không chọn, từ khóa AI khi không chọn AI, `giu_nguyen` trùng nguyên văn, đoạn GV không mất,
  trắc nghiệm (đủ phương án, 1 đáp án, rải đều), đủ ma trận, LaTeX hợp lệ (KaTeX), không có ², √
  ngoài `$...$`, phụ lục tiếng Anh không dấu tiếng Việt, 45 phút/tiết, đủ 3 nhóm phân hóa.
  Lỗi → gọi lại đúng phần, tối đa 2 lần, còn lỗi thì báo GV.

### Phần 5 – Giao diện 6 bước + trang duyệt (`phan-5-giao-dien`)
- Cột trái 6 bước có trạng thái; điện thoại thu thành thanh tiến độ.
- Bước 1 tải lên (kéo thả, tối đa 20 MB, kèm SGK); bước 2 thông tin bài + thẻ lựa chọn và phần
  thiết lập từng thẻ (kéo yêu cầu cần đạt vào mạch/mục cho B, C); không có giá trị mặc định cho
  nền tảng và hình thức.
- Trang duyệt: khóa cho đoạn giữ nguyên, nền xanh nhạt + "Bỏ" cho đoạn bổ sung, "Xem bản cũ",
  sửa trực tiếp, "Soạn lại mục này", cảnh báo đầu trang, tỉ lệ "Giữ nguyên x% nội dung của thầy/cô".
- Chạy các tổ hợp kiểm thử bằng mock, xuất `samples/output/*.docx`.

### Phần 6 – Xuất file, bộ câu hỏi theo nền tảng, README (`phan-6-xuat-file`)
- `config/platforms.json`; đọc file mẫu import GV tải lên để lấy tên cột; công thức LaTeX hoặc PNG.
- README tiếng Việt: cách cài, mở app, điền API key, sửa luật trong `rules/`, thêm nền tảng.

## Câu hỏi cần thầy/cô trả lời

1. **Văn bản nguồn.** Mở mạng cho các trang văn bản, hoặc đính kèm PDF Thông tư 02/2025, Công văn
   3456 (có phụ lục bảng mã chỉ báo) và chương trình các môn THPT. Không có kho từ xa thì nhánh và pull
   request chỉ nằm trong phiên này, **mất khi phiên kết thúc**. Thầy/cô có muốn mỗi bước mình
   đóng gói một file .zip để tải về không?
2. **Nhà cung cấp LLM thật.** Dùng hãng nào (Anthropic, OpenAI, Google)? Mình đề xuất
   viết adapter cho một hãng trước, các hãng khác thêm sau qua cùng giao diện.
3. **Giới hạn Vercel.** Hàm serverless của Vercel chỉ nhận yêu cầu khoảng 4,5 MB, trong khi
   file tải lên tối đa 20 MB. Đề xuất: đọc .docx/.pdf ngay trên trình duyệt, chỉ gửi văn bản
   và ảnh trang lên server. Nhiều lượt LLM thì chia thành nhiều lời gọi API nhỏ để không
   vượt giới hạn thời gian. Thầy/cô đồng ý không?
4. **Lưu trữ.** Có cần tài khoản và lưu bài soạn trên server không? Đề xuất bản đầu không có
   cơ sở dữ liệu: bài đang soạn và giỏ chọn lưu trong trình duyệt.
5. **Năng lực AI:** dùng NLa/NLc/NLd như khung, hay mã miền 6 (6.1–6.3 NC1), hay cả hai?
6. **Chỉ chọn tích hợp, KHBD cũ theo khung cũ** (Khởi động, Hình thành kiến thức…): ô vị trí
   gắn mã năng lực đặt theo tên hoạt động cũ (ví dụ `KD_T1`, `HTKT_T1`) hay luôn theo HĐ I–IV?
   Ma trận mục V có được thêm vào KHBD cũ vốn không có mục này không?

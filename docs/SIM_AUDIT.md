# Đánh giá hệ thống mô phỏng EduNova (Giai đoạn 1 — Audit)

Phạm vi: toàn bộ mô phỏng trong `src/components/{phet,life,labs,pc3d,traffic3d}` và logic trong `src/lib/{sim,traffic}`.
Đánh giá dựa trên đọc mã nguồn, bộ test hiện có và lần chạy thử giao diện gần nhất; chưa có khảo sát với học sinh thật.
Chưa sửa code ở giai đoạn này.

## 1. Kiến trúc hiện tại

Không phải mọi mô phỏng đều cùng kiến trúc. Có ba nhóm:

| Nhóm | Số lượng | Thành phần | Cách chấm |
|---|---|---|---|
| **A. Khung PhET** (`components/phet/kit.tsx`) | 25 mô phỏng theo bài + 9 mô phỏng đời sống | `SimShell` (thanh màn Khám phá / Thử thách), `SimLayout` (vùng thao tác + bảng điều khiển 300px), `Stage`, `Panel`, `SimSlider`, `Segmented`, `ResetAll`, `useChallenge`, `ChallengeFrame` | `useChallenge.check(ok, text)` đếm số lần sai → `LabScore` |
| **B. Mô phỏng nhiệm vụ riêng** | 3 | Bên trong máy tính 3D (React Three Fiber, `lib/sim/pc-build`), Smart Traffic City 3D (R3F, `lib/traffic`), Vườn thông minh (Python + test case, `lib/sim/smart-garden`) | Nhiệm vụ riêng; vườn chấm bằng test case |
| **C. Cũ / công cụ** | 2 | `binary-lab` (Bit & cổng logic), `web-creator` (soạn HTML tự do) | Không chấm |

Luồng dùng chung:
`LabPreview(slug)` → `LabResultScope` (đo thời gian) → mô phỏng → màn hoàn thành gọi `LabScore(mistakes)` → `recordLabResult` (điểm = 10 − 0,5 × số lần sai, thấp nhất 5) → phần giải thích ngắn chấm theo rubric (`lib/ai/lab-grader.ts`, mặc định bộ luật / mock) → giáo viên xem ở tab Đã giao và trang chi tiết bài giao.

Liên kết bài học: `SGK_SIMS` (`lib/data/lab-catalog.ts`) + khối `sim` trong nội dung bài + `textbookMapping` của `LAB_TEMPLATES` → `lessonSimSlugs()` (`lib/sgk/book.ts`). Giao bài: `Assignment.task = { kind: "lab", ref: slug }`, có hạn, số lần làm, cách tính điểm.

Supabase đã có sẵn bảng `lab_attempts` và `experiment_events (type, input jsonb, output jsonb, pass)` — đủ để lưu từng bước thao tác mà **không cần đổi schema**.

## 2. Danh mục và đánh giá từng mô phỏng

Thang 1–3 (1 = yếu, 2 = ổn, 3 = tốt). **G** giao diện/đồ họa · **T** tương tác · **L** logic tách riêng & có test · **H** giá trị học tập (thao tác có buộc học sinh vận dụng kiến thức hay chỉ chọn đáp án).

### Tin học 10

| Mô phỏng (slug) | Bài | Tương tác chính hiện nay | G | T | L | H | Hướng nâng cấp |
|---|---|---|---|---|---|---|---|
| Máy xử lí thông tin (`info-processor`) | 10-1 | Chọn "dữ liệu / thông tin", bấm xếp 4 bước | 2 | 1 | 1 | 2 | Cảm biến chạy thật, kéo dữ liệu qua 4 trạm; bớt câu chọn |
| Phòng mã hóa văn bản (`text-encoding`) | 10-3 | Gõ chữ → mã, byte, bit | 2 | 2 | 1 | 3 | Hoạt ảnh tách kí tự thành byte; tách logic ra `lib/sim` |
| Phòng điều khiển nhị phân (`binary-control`) | 10-4 | Bật công tắc bit, đèn sáng, tràn số | 3 | 3 | 1 | 3 | Giữ nguyên phần lớn; hiệu ứng tràn số, lưu lỗi theo thử thách |
| Ngôi nhà thông minh (`smart-home`) | 10-5 | Lắp biểu thức `a op b` có `not` | 2 | 2 | 1 | 3 | Ngôi nhà 2.5D phản ứng theo biểu thức, bảng chân trị tự tô |
| Máy ảnh số (`digital-camera`) | 10-6 | Thanh trượt độ phân giải, bit màu, mẫu âm thanh | 2 | 2 | 2 | 3 | Ảnh mẫu pixel hóa thật, sóng âm lấy mẫu |
| An toàn số (`digital-safety`) | 10-9, 10-11 | Chọn an toàn/lừa đảo, chọn mật khẩu, bấm chỗ lộ thông tin trên ảnh | 2 | 2 | 3 | 2 | Bấm vào dấu hiệu đáng ngờ trong tin nhắn thay vì chọn một nhãn |
| Công dân số (`digital-citizen`) | 10-11, 12-6 | Chat rẽ nhánh, đồng hồ hệ quả | 2 | 2 | 3 | 2 | Lựa chọn là bản chất của chủ đề; chỉ cải thiện hình ảnh hệ quả |
| Hộp biến (`variable-boxes`) | 10-17 | Chạy từng lệnh gán; đổi chỗ hai biến bằng chọn đáp án | 2 | 2 | 1 | 2 | Dự đoán giá trị trước khi chạy; kéo giá trị vào hộp |
| Smart Traffic City 3D (`smart-coding-city`) | 10-19 | Cảnh 3D giao lộ, điều khiển đèn | 3 | 2 | 3 | 2 | Chế độ đồ họa nhẹ; fallback 2D (hiện chỉ có dòng thông báo) |
| Vườn thông minh (`smart-garden`) | 10-19 | Viết Python, chạy test case | 2 | 3 | 3 | 3 | Làm đẹp cảnh vườn; đã chấm bằng test, giữ nguyên |
| Nhà máy robot (`robot-factory`) | 10-20 | Thanh trượt `range(start, stop, step)`, băng chuyền SVG, chạy từng bước | 2 | 2 | 3 | 3 | **Đề xuất làm mẫu** (mục 4) |
| Robot thoát mê cung (`maze-robot`) | 10-21 | Lắp chương trình `while` + `if`, chạy robot | 2 | 3 | 3 | 3 | Hoạt ảnh robot, đánh dấu vòng lặp vô hạn rõ hơn |
| Toa tàu danh sách (`list-lab`) | 10-22, 10-23 | Bấm `append/insert/remove/pop` | 2 | 2 | 1 | 3 | Hoạt ảnh toa chèn/rút; chỉ số âm hiển thị trên toa |
| Kính lúp xâu (`string-lab`) | 10-24, 10-25 | Kéo `start/stop/step`, dự đoán kết quả | 2 | 3 | 2 | 3 | Hiệu ứng kính lúp trên kí tự được cắt |
| Máy hàm (`function-machine`) | 10-26, 10-27 | Đưa đối số; phần thử thách chủ yếu là chọn đáp án | 2 | 2 | 1 | 2 | Học sinh tự nối tham số → thân hàm → `return` thay vì chọn |
| Thám tử gỡ lỗi (`debug-detective`) | 10-29, 10-30 | Phân loại lỗi (chọn), viết test, sửa lỗi | 2 | 3 | 3 | 3 | Giữ luồng; làm rõ test đỏ/xanh |

### Tin học 11

| Mô phỏng (slug) | Bài | Tương tác chính hiện nay | G | T | L | H | Hướng nâng cấp |
|---|---|---|---|---|---|---|---|
| Khám phá hệ điều hành (`os-explorer`) | 11-1, 11-2 | File Explorer + Task Manager; một phần chọn chức năng HĐH | 3 | 3 | 3 | 3 | Giữ; bớt câu chọn chức năng |
| Thế giới phần mềm (`software-ecosystem`) | 11-3 | Bấm gán phần mềm vào nhóm | 2 | 1 | 1 | 2 | Kéo thả lên bản đồ nguồn mở / nguồn đóng / trực tuyến |
| Bên trong máy tính 3D (`inside-computer-3d`) | 11-4 | Lắp linh kiện 3D, theo dấu dữ liệu, chẩn đoán | 3 | 3 | 3 | 3 | Chế độ đồ họa nhẹ; fallback đã có (làm bằng nút) |
| Trạm kết nối thiết bị (`device-connection`) | 11-5 | Chọn thiết bị rồi bấm cổng | 2 | 2 | 1 | 3 | Kéo dây cắm vào cổng — ứng viên kéo thả tự nhiên nhất |
| Đám mây dữ liệu (`cloud-sharing`) | 11-6 | Đặt quyền chia sẻ, đồng bộ thiết bị | 2 | 2 | 1 | 3 | Hoạt ảnh đồng bộ giữa thiết bị |
| Thành phố dữ liệu (`database-city`) | 11-11, 11-13 | Chọn cột, khóa chính, khóa ngoài từ danh sách | 2 | 2 | 3 | 2 | Kéo cột vào bảng; tô dòng trùng khóa ngay khi thao tác |
| Thám tử SQL (`sql-detective`) | 11-14 | Dựng truy vấn, chạy trên bảng thật | 2 | 3 | 3 | 3 | Giữ; làm đẹp bảng kết quả |

### Tin học 12

| Mô phỏng (slug) | Bài | Tương tác chính hiện nay | G | T | L | H | Hướng nâng cấp |
|---|---|---|---|---|---|---|---|
| Khám phá AI (`ai-discovery`) | 12-1, 12-2 | Phân loại xoài bằng k-NN, thêm điểm dữ liệu; một phần chọn đáp án | 2 | 2 | 3 | 3 | Bớt câu chọn; tăng phần thêm/bớt dữ liệu và xem ranh giới đổi |
| Xây mạng trường (`network-builder`) | 12-3 | Đặt switch/router/AP/modem vào phòng | 2 | 2 | 2 | 3 | Kéo thiết bị; gói tin chạy thử trên sơ đồ |
| Hành trình gói tin (`network-journey`) | 12-4 | Đấu nối, dẫn gói tin, `ping`; câu chốt là chọn đáp án | 2 | 3 | 3 | 3 | Hoạt ảnh gói tin theo từng chặng |
| Xưởng web (`web-creator`) | 12-7, 12-13 | Soạn HTML tự do, xem trước | 1 | 2 | — | 2 | Thêm nhiệm vụ có kiểm tra (DOM) hoặc giữ là công cụ, không chấm |
| Mê cung website (`web-navigation`) | 12-10 | Sửa `href`, duyệt thử | 2 | 3 | 2 | 3 | Sơ đồ trang có mũi tên liên kết sáng/đỏ |
| Phòng hộp CSS (`css-box`) | 12-16 | Thanh trượt padding/border/margin, `box-sizing` | 2 | 3 | 2 | 3 | Thêm kéo trực tiếp mép hộp |

### Ngoài bài học

| Mô phỏng | Ghi chú |
|---|---|
| Bit & cổng logic (`binary-logic`) | **Không gắn bài nào** (đã được `binary-control` + `smart-home` thay thế). Giữ, không phát triển thêm. |
| 9 mô phỏng đời sống (`qr-code`, `gps`, `barcode`, `encryption`, `spam-filter`, `recommender`, `image-compress`, `password`, `rgb-pixel`) | Kho công khai, cùng khung PhET, có test `life-labs.test.ts`. Hưởng lợi tự động khi nâng khung chung. |

## 3. Vấn đề chung (ảnh hưởng nhiều mô phỏng)

1. **Kết quả chỉ lưu số lần sai.** `LabResult` có `score, mistakes, seconds` nhưng không biết em sai ở thử thách nào, sai kiểu gì. Trang chi tiết bài giao vì thế không chỉ ra được lỗi cụ thể của mô phỏng (bộ câu hỏi thì có).
2. **Mỗi lần bấm "Kiểm tra" sai đều trừ điểm**, kể cả bấm lại cùng một đáp án. Điểm phản ánh số lần bấm hơn là mức hiểu.
3. **Gợi ý tĩnh.** Mỗi thử thách có một câu phản hồi cố định; không có gợi ý theo bậc, không nhận diện kiểu lỗi (ví dụ quên "stop không lấy"). Gia sư AI chỉ nhận trạng thái ở 3 mô phỏng nhóm B; 34 mô phỏng khung PhET không gửi trạng thái.
4. **Thiếu mở đầu và mục tiêu.** Màn Khám phá vào thẳng bảng điều khiển; học sinh không biết cần làm gì trước khi sang Thử thách.
5. **Không có kéo thả nào** (0/39). Nhiều thao tác bản chất là "nối/cắm/đặt" (cổng thiết bị, thiết bị mạng, cột CSDL, nhóm phần mềm) đang làm bằng bấm nút.
6. **Một số thử thách là câu chọn đáp án**: `info-processor`, `variable-boxes` (đổi chỗ), `function-machine`, `software-ecosystem`, `database-city`, một phần `digital-safety`, `ai-discovery`, `os-explorer`, câu chốt `network-journey`. Đây là nhóm có nguy cơ "trắc nghiệm có hoạt ảnh".
7. **Logic nằm trong component** ở 14/25 mô phỏng khung PhET (ví dụ `pyRange` export từ `robot-factory.tsx`). Khó tách lớp hình ảnh / mô phỏng / chấm điểm.
8. **Hình ảnh phẳng, ít chuyển động.** Vùng thao tác và bảng điều khiển nặng ngang nhau; màn hoàn thành chỉ có sao + danh sách chữ. Hai công thức sao khác nhau (`ChallengeFrame` và `MissionDone`).
9. **3D**: có `dpr` giới hạn và thông báo khi không có WebGL; chưa có chế độ đồ họa nhẹ; Smart Traffic City không có fallback làm được nhiệm vụ.

Những phần tốt nên giữ: khung PhET thống nhất (Khám phá + Thử thách + Đặt lại), các engine đã có test (`network`, `sql-engine`, `os-sim`, `pc-build`, `smart-garden`, `expression`, `library-db`…), luồng giao bài/lưu kết quả, liên kết bài học đầy đủ cho 29 mô phỏng.

## 4. Đề xuất nâng cấp trước: **Nhà máy robot tự động** (Tin 10 · Bài 20 · vòng lặp `for` / `range`)

Lý do chọn:
- **Kiến thức cốt lõi, dễ sai**: `range` là chỗ học sinh lớp 10 hay nhầm (stop không lấy, bước âm, range rỗng) — các lỗi này **nhận diện được bằng logic xác định**, rất hợp để làm mẫu Smart Learning.
- **Logic đã đúng và có test** (`pyRange`, `phet-sims.test.ts`): nâng cấp chỉ chạm lớp hình ảnh và lớp chấm, không đụng kiến thức.
- **Có chỗ để thao tác trực tiếp thật**: kéo tay robot / mốc start–stop ngay trên băng chuyền, liên kết hai chiều với code `range(...)` — không phải bấm chọn.
- **Đã có trong dữ liệu giao bài** (`as-seed-robot`, lớp 10A1), kiểm thử được trọn luồng giáo viên giao → học sinh làm → giáo viên xem lỗi.
- **Hình ảnh còn phẳng** (SVG một lớp) nên thấy rõ khác biệt; dùng SVG 2.5D, không cần 3D → chạy tốt trên máy cấu hình trung bình.
- Kết quả là các mẫu dùng lại được cho ~20 mô phỏng lập trình và khung chung.

Phương án dự kiến (sẽ làm sau khi được đồng ý):

| Lớp | Thay đổi |
|---|---|
| Hình ảnh | Nhà xưởng 2.5D (băng chuyền có chiều sâu, bóng, ánh sáng), tay robot gắp và thả hộp có hoạt ảnh, hộp rơi vào ô; ô đích phát sáng; hiệu ứng hoàn thành. Tôn trọng `prefers-reduced-motion`. Vùng mô phỏng chiếm phần lớn màn hình, bảng điều khiển gọn lại |
| Tương tác | Mở đầu 1 câu tình huống + mục tiêu; kéo mốc start/stop trên băng chuyền (thanh trượt vẫn giữ, có bàn phím); bước "Dự đoán" trước khi chạy (em chọn các ô hộp sẽ rơi, rồi chạy để so); chạy từng bước / chạy liên tục; Đặt lại |
| Thử thách | Giữ 5 thử thách hiện có, thêm 1 thử thách vận dụng (đếm ngược / cộng dồn) |
| Smart Learning | Hàm thuần `diagnoseRange(range, target)` trong `lib/sim` nhận diện: thiếu phần tử cuối (stop không lấy), thừa phần tử, sai start, bước sai dấu, bước sai độ lớn, range rỗng. Gợi ý 3 bậc (nhắc quy tắc → chỉ chỗ sai trên băng chuyền → gợi ý tham số), không lộ đáp án ngay. Gửi trạng thái cho Gia sư AI qua `useTutorActivity`; AI chỉ giải thích, không chấm |
| Chấm điểm | Chỉ tính sai khi đáp án **khác** lần trước; lưu chi tiết từng thử thách (số lần thử, kiểu lỗi, đáp án cuối) vào trường tùy chọn của kết quả — kết quả và bài giao cũ vẫn đọc được. Hoạt ảnh không ảnh hưởng điểm (chấm trên trạng thái, không trên hình) |
| Giáo viên | Trang chi tiết bài giao hiện lỗi mô phỏng theo thử thách (ví dụ "Thử thách 2: quên stop không lấy — 2 lần") |
| Kiểm thử | Unit test `diagnoseRange` và chấm điểm; test tương thích kết quả cũ; E2E giao → làm → xem lỗi; kiểm tra màn 1280px và 1024px, hiệu năng hoạt ảnh |

Sau mẫu, phần dùng lại cho Giai đoạn 4: `SimIntro`, `useChallenge` v2 (gợi ý theo bậc, lưu chi tiết thử thách, không trừ điểm lặp), `useDrag` (kéo thả bằng pointer + bàn phím, không thêm thư viện), `CompleteBurst`, quy chuẩn màu/độ sâu cho `Stage`, kết nối gia sư trong `SimShell`.
Thứ tự mở rộng đề xuất: nhóm có thử thách dạng chọn và nhóm "nối/cắm" (`device-connection`, `software-ecosystem`, `function-machine`, `variable-boxes`, `database-city`) → các mô phỏng lập trình còn lại → chế độ đồ họa nhẹ cho 2 mô phỏng 3D.

## 5. Giai đoạn 2–3 — Mẫu Nhà máy robot (đã làm)

| Lớp | File | Nội dung |
|---|---|---|
| Logic mô phỏng | `src/lib/sim/range-lab.ts` | `pyRange`, `rangeText`, 6 thử thách, `diagnoseRange` (rỗng · sai chiều · sai start · sai bước · thiếu phần tử cuối · thừa phần tử) + 3 bậc gợi ý |
| Logic chấm (dùng chung) | `src/lib/sim/challenge.ts` | Reducer thuần: đếm lần sai (không trừ khi thử lại đáp án sai cũ), ghi `LabStep` từng thử thách, gợi ý tối đa 3 bậc |
| Hình ảnh | `src/components/phet/robot-factory.tsx` | Nhà xưởng 2.5D SVG, hộp rơi, cánh tay chạy theo i, cờ start/stop kéo được (chuột, cảm ứng, phím mũi tên), chế độ dự đoán, hộp chỉ rơi sau khi Kiểm tra |
| Khung chung | `src/components/phet/kit.tsx` | `SimShell intro`, `useChallenge(total, labels)` dùng reducer, `ChallengeFrame hints / next`, màn hoàn thành có "Chỗ em đã vấp"; công thức sao thống nhất với `starsFor` |
| Lưu kết quả | `LabResult.steps?` | Trường tùy chọn; kết quả cũ không đổi. Giáo viên xem ở chi tiết bài giao |

Kiểm thử: `tests/unit/range-lab.test.ts` (ngữ nghĩa range, mọi thử thách giải được bằng thanh trượt, từng loại lỗi, gợi ý không lộ đáp án, reducer, tương thích kết quả cũ) và chạy thử trình duyệt: học sinh làm bài giao → giáo viên thấy "Thử thách 2: thiếu phần tử cuối (stop không được lấy) · 2 gợi ý"; không lỗi trang, không tràn ngang ở 1366 / 1024 / 390 px.

Các mô phỏng khung PhET khác tự hưởng: phần mở đầu (khi truyền `intro`), không trừ điểm khi thử lại đáp án cũ (khi truyền `answer`), lưu chi tiết thử thách, gợi ý theo bậc (khi truyền `hints`).

# EduNova AI — Hệ sinh thái dạy và học Tin học THPT

Bản **giai đoạn 1** của nền tảng dạy – học Tin học 10, 11, 12 (Chương trình GDPT 2018). Ứng dụng nối liền một quy trình:

```
KHBD → Activity Builder → Thí nghiệm (Smart Garden) → Bài nộp + sự kiện → Rubric → Phân tích → Cải tiến KHBD
```

> **Lưu ý trung thực:** đây là bản demo. Dữ liệu lưu trong trình duyệt (localStorage), đăng nhập bằng tài khoản mẫu, các "trợ lý AI" và gia sư là luật + câu trả lời soạn sẵn (không gọi mô hình AI). Python được chạy bằng **trình thông dịch tập con viết bằng TypeScript** (`src/lib/py`) — không phải CPython/Pyodide, chỉ hỗ trợ biến, số, chuỗi, list, if/elif/else, for/while, hàm, input/print. Dữ liệu chương trình là minh họa, mọi bài học mang cờ `curriculumVerified: false`.

## Chạy dự án

Yêu cầu: Node.js ≥ 20.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Lệnh | Mục đích |
|---|---|
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript + React Compiler rules) |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (TypeScript strict) |
| `npm test` | Unit test (Vitest) của EduNova và của trợ lý KHBD (`npm run test:khbd`) |
| `npm run build` / `npm start` | Build & chạy production |
| `npm run e2e` | Kiểm thử chấp nhận A–D bằng Playwright (cần server đang chạy, `BASE_URL` mặc định `http://localhost:3100`) |
| `npm run a11y` | Quét accessibility bằng axe-core (`THEME=light` để quét giao diện sáng) |

Tài khoản demo (trang `/login`): **Trần Thu Hà** (giáo viên 10A1/11A2/12A3), **Lê Minh Khang** (học sinh 10A1), **Nguyễn Hoàng Lan** (admin), cùng giáo viên/học sinh **lớp 10A2** để kiểm tra cách ly dữ liệu. Có thể đổi vai trò ở thanh trên cùng; “Khôi phục dữ liệu demo” nằm trong Cài đặt.

## Trạng thái chức năng

| Chức năng | Trạng thái | Ghi chú |
|---|---|---|
| Smart Garden Lab: cảnh SVG, độ ẩm/bình nước, rule builder + rule editor, trace đánh giá, bộ test biên, mô phỏng 12 bước, ghi sự kiện `run/test/input_change/rule_change/reset/submit/pause/resume` | **REAL** | Engine TS deterministic (`src/lib/sim`), parser an toàn không dùng `eval` |
| Binary & Logic Lab (rút gọn), Web Creator (iframe `sandbox=""` + CSP, không chạy script) | **REAL** | |
| Chấm test tự động, rubric, đánh giá, analytics (mức đạt theo mục tiêu, hoàn thành, mẫu lỗi, số lần chạy, trước/sau), xuất CSV | **REAL** (tính toán) | Tính từ dữ liệu trong repository; dữ liệu nền là **seed demo** |
| Kiểm tra liên kết mục tiêu ↔ hoạt động ↔ minh chứng trong KHBD | **REAL** | Luật xác định |
| Validation (RHF + Zod): KHBD, Activity Builder theo từng bước, Lab Studio, lớp, đăng ký | **REAL** | |
| Tìm kiếm/lọc (không phân biệt dấu, đồng bộ URL) | **REAL** | |
| Lưu trữ, tài khoản, lớp, bài nộp | **DEMO** | Zustand + localStorage; mô phỏng RLS trong `src/lib/store/scoped.ts` |
| 5 vai trò AI (Curriculum Analyst, Lesson Planner, Activity Designer, Learning Mentor, Learning Analyst) | **DEMO** | `POST /api/ai/[agent]`: Zod in/out, `demo: true`, gắn cờ prompt injection, log `AIInteraction`, giáo viên duyệt |
| Học liệu “AI” (ngân hàng câu hỏi, flashcards, sơ đồ, phiếu) | **DEMO** | Sinh từ template dữ liệu bài học, trạng thái chờ duyệt |
| Student Hub: Tổng quan, Bài học 5 bước (Tình huống → Khám phá → Quan sát trực quan → Kiểm tra nhanh → Vận dụng), đánh dấu từng phần / “chưa hiểu”, ghi chú, lưu bài & thuật ngữ, quay lại đúng chỗ đã dừng | **REAL** (logic) | Tiến độ tách 3 loại: nội dung, mức đạt, thực hành; công thức hiển thị cho học sinh |
| Phòng lập trình Python: chạy, nhập dữ liệu, bảng biến, chạy từng bước, kiểm thử tự động, lịch sử phiên bản, lỗi giải thích tiếng Việt | **REAL** (tập con Python) | Trình thông dịch TS có giới hạn số bước, không truy cập mạng/tệp |
| Trò chơi Nông trại thông minh (4 cấp: biên 40%, hết nước, cảm biến lỗi, nhiều luống), chế độ Khám phá/Nhiệm vụ/Đánh giá, mở khóa theo kết quả | **REAL** | Chấm bằng chạy code thật trên từng tình huống |
| Luyện tập & kiểm tra: 8 dạng câu (trắc nghiệm, đúng/sai, sắp xếp kéo thả/bàn phím, điền code, dự đoán đầu ra, tìm lỗi, tự luận, thực hành mô phỏng); chế độ luyện tập/thích ứng (luật)/kiểm tra có giờ + khóa gia sư | **REAL** | Dự đoán đầu ra và điền code được chấm bằng cách chạy chương trình |
| Xưởng dự án (mẫu, tệp, chạy/xem trước, việc cần làm, nhật ký, quyền xem), Hồ sơ (huy hiệu, sản phẩm, xem lại quá trình), Nhiệm vụ (giáo viên giao / tự chọn), Cài đặt (cỡ chữ, tương phản, báo lỗi) | **REAL** (lưu cục bộ) | Làm dự án theo nhóm: **PLANNED** |
| Smart Traffic City 3D (`/student/games/traffic-city`, `/labs/smart-coding-city`): giao lộ low-poly bằng React Three Fiber + Three.js + Drei (WebGL), camera isometric xoay/zoom, bóng đổ, 4 cột đèn, 4 ô tô, nhà, cây, công viên; Start/Pause/Reset, chuyển đèn, chế độ tự động/thủ công, bấm xe/cột đèn trong cảnh | **REAL** | Mọi vật thể là mesh dựng bằng code, không tải asset. Logic tách riêng: `src/lib/traffic/traffic-controller.ts` (pha đèn, luôn qua vàng → đỏ toàn phần), `simulation-state.ts` (xe dừng trước vạch, quyết định đèn vàng, giữ khoảng cách, phát hiện vượt đỏ/xung đột); hiển thị: `src/components/traffic3d/` (Scene3D, Vehicle, TrafficLight, CityProps). Trình soạn Python điều khiển đèn/xe: **PLANNED** |
| Khóa học & bài giảng: giáo viên dựng khóa theo lớp/bộ sách/chủ đề/bài, khối nội dung kéo thả (kiến thức, video/hình, mô phỏng, Python, luyện tập, tài liệu), điều kiện hoàn thành, học lần lượt, phát hành cho lớp; học sinh học theo trình tự | **REAL** (lưu cục bộ) | Tệp tải lên ≤ 1 MB ở bản demo |
| Trợ lý xây dựng KHBD (`khbd/`, `/teacher/lesson-planner/assistant`): chọn bài → tải KHBD (.docx/.pdf) hoặc soạn mới từ chương trình → chọn tích hợp (năng lực số, AI, tiếng Anh, LHĐN) → lập kế hoạch → soạn → gắn mô phỏng vào hoạt động → kiểm tra, xuất Word/PDF, lưu vào KHBD có phiên bản | **REAL** (pipeline) / AI: khóa máy chủ, khóa riêng GV, hoặc quyền Claude của bản demo | Pipeline và 319 test của trợ lý giữ nguyên; xem `khbd/CLAUDE.md` |
| Gia sư AI (5 chế độ, 4 nút nhanh, mini quiz, không đưa lời giải, tự khóa khi kiểm tra) | **DEMO** | Câu trả lời soạn sẵn theo chủ đề, gắn nhãn “bản mẫu” |
| Python đầy đủ (Pyodide Worker), Inside Computer 3D (R3F + GLB), Phaser labs, 10 lab còn lại | **PLANNED** | Lab 3D hiển thị danh sách mesh bắt buộc và **báo thiếu asset**, không dựng giả |
| Supabase Auth/RLS/Storage, LLM thật, xuất Word, parse docx/pdf | **PLANNED** | Bản nháp schema + RLS: `supabase/schema.sql` (chưa áp dụng, chưa kiểm thử) |

## Kết quả kiểm tra (lần chạy gần nhất trong môi trường phát triển)

- `npm run lint`: 0 lỗi, 0 cảnh báo. `npm run typecheck`: đạt.
- `npm test`: **111/111** unit test đạt — engine Smart Garden, trình thông dịch Python (ngữ nghĩa, lỗi, giới hạn bước), chấm câu luyện tập và cấp trò chơi, toàn vẹn seed, phân quyền dữ liệu, analytics, agent/gia sư (không lộ đáp án), tiến độ học sinh (đọc bài không làm tăng mức đạt), dòng thời gian chỉ chứa dữ liệu của chính học sinh, mô phỏng giao thông (không bao giờ hai trục cùng xanh, 5 phút mô phỏng không vượt đỏ/không xung đột, chế độ thủ công, tính xác định).
- `npm run build`: đạt.
- `npm run e2e`: **44/44** bước đạt, 0 lỗi console — Workflow A–D như trước và Workflow E (Student Hub): bài học 5 bước + quan sát trực quan + ghi chú, luyện tập, kiểm tra có giờ, phòng lập trình (lỗi cú pháp → sửa → đạt kiểm thử), Nông trại, Xưởng dự án, Hồ sơ/xem lại quá trình, gia sư, cài đặt; Workflow F (Smart Traffic City 3D): canvas WebGL thật, bấm trúng xe và cột đèn bằng raycast, Start/Pause/Reset, chế độ thủ công.
- `npm run a11y`: 0 vi phạm mức serious/critical trên 33 trang, ở cả giao diện tối và sáng.
- Ảnh chụp màn hình: `docs/screenshots/`.

## Cấu trúc

```
docs/            PRD, sitemap, kiến trúc, data model, design system, kế hoạch, screenshots
supabase/        schema.sql (bản nháp RLS — PLANNED)
src/app/         (public) · teacher/* · student/* · admin · api/ai/[agent]
src/components/  ui (kiểu shadcn), layout (shell, sidebar, role switch), labs (Smart Garden, Web Creator…)
src/lib/         domain types · data (chương trình, lab, seed) · sim (engine) · store (repository + phân quyền)
                 analytics · ai (agents, sanitize) · validation (Zod)
tests/           unit (Vitest) · e2e (Playwright, axe-core)
```

Ghi chú kỹ thuật: Next.js 16.4 (App Router, Turbopack), React 19, Tailwind CSS 4, TypeScript strict. `cacheComponents` được tắt vì trang hub đọc state phía client. Thành phần giao diện được viết theo phong cách shadcn/ui trên Radix (không dùng CLI shadcn).

## Giới hạn đã biết

- Dữ liệu chỉ tồn tại trong một trình duyệt; xóa dữ liệu trang web sẽ mất thay đổi. Không đồng bộ giữa thiết bị/người dùng thật.
- Phân quyền hiện là lọc phía client — **không phải** biện pháp bảo mật; production phải dùng RLS phía server.
- Nội dung chương trình, tên bài, yêu cầu cần đạt là minh họa, cần giáo viên đối chiếu sách thực tế (có màn hình thẩm định trong Admin, kết quả cũng chỉ lưu cục bộ).
- “AI” là luật/template; gợi ý điểm rubric dựa trên test và sự kiện, chỉ để tham khảo.
- Python là tập con (không có import, class, dict, try/except…); Monaco tải từ CDN jsdelivr (tự chuyển sang trình soạn đơn giản nếu bị chặn).
- Gợi ý học tập, luyện tập thích ứng và trợ lý dự án là luật xác định, không phải mô hình AI.
- Chỉ Smart Garden giao được thành nhiệm vụ có chấm điểm; Activity Builder chưa hỗ trợ quiz/dự án độc lập.
- Kiểm thử E2E chạy trên Chromium; chưa kiểm thử Safari/Firefox và trình đọc màn hình thật.

## Lộ trình

1. Supabase: áp dụng & kiểm thử `schema.sql`, Auth, Storage; thay mock repository giữ nguyên chữ ký hành động.
2. AI server-side thật với prompt template có version, structured output, log & hàng đợi duyệt của giáo viên.
3. Pyodide trong Web Worker (timeout, không mạng) cho Code Playground và Smart Coding City.
4. Inside Computer 3D (R3F + GLB có giấy phép rõ ràng), Phaser cho lab 2D/2.5D.
5. Xuất KHBD ra Word; phân tích docx/pdf trong môi trường cô lập.

Chi tiết: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/PLAN.md`.

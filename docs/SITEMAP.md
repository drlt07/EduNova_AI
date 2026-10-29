# Sitemap EduNova AI

Nguyên tắc: **Bài học là trung tâm.** Tin học 10/11/12 → Chủ đề → Bài học → Kiến thức / Mô phỏng / Luyện tập.
Giáo viên giao hoạt động ngay trong bài học; kết quả gắn với đúng bài, hoạt động, lớp và học sinh.
Một bài học hoặc mô phỏng giao được cho nhiều lớp, mỗi lớp có tiến độ và kết quả riêng (không sao chép nội dung).

## Giáo viên — 5 mục chính + Mô phỏng đời sống

| Mục | Route chính | Trang con (cùng mục) | Việc làm ở đây |
|---|---|---|---|
| Hôm nay | `/teacher/dashboard` | — | Tiết sắp dạy, việc cần xử lý (bài cần chấm, em chưa nộp), mở tiếp bài đang dạy |
| Khóa học | `/teacher/sgk` | `/teacher/sgk/[ref]`, `/teacher/courses*` | Chọn lớp → chủ đề → bài; tab Kiến thức · Mô phỏng · Luyện tập · Đã giao; nút "Giao cho lớp" ở từng hoạt động |
| Lớp của tôi | `/teacher/classes` | `/teacher/classes/[id]`, `/teacher/assignments`, `/teacher/assignments/[id]`, `/teacher/assessment`, `/teacher/results`, `/teacher/analytics` | Danh sách lớp, học sinh, bài đã giao, chấm bài, sổ điểm, chi tiết từng em |
| Trợ lý KHBD AI | `/teacher/lesson-planner` | `/teacher/lesson-planner/*` | Soạn, sửa, lưu, xuất kế hoạch bài dạy (độc lập) |
| Thư viện | `/teacher/sims` | `/teacher/bank`, `/teacher/library`, `/teacher/resources`, `/teacher/labs`, `/teacher/activity-builder` | Mô phỏng theo bài, ngân hàng luyện tập, học liệu và tài nguyên tự tạo; xem trước, gắn vào bài học |
| Mô phỏng đời sống | `/teacher/kho` | `/teacher/kho/[slug]` | Kho công khai: Tin học quanh ta (máy tính làm việc thế nào, thường ngày, an toàn, dữ liệu & AI); mở tự do, không tính điểm |

## Học sinh

| Mục | Route chính | Trang con | Việc làm ở đây |
|---|---|---|---|
| Bài của tôi | `/student/missions` (trang đầu) | `/student/missions/[id]` | Hoạt động thầy cô giao: hạn, số lần làm, kết quả |
| Khóa học | `/student/sgk` | `/student/sgk/[ref]`, `/student/courses*` | Khám phá bài đã mở; mỗi bài có Học · Mô phỏng · Luyện tập |
| Luyện tập | `/student/practice` | `/student/practice/[id]`, `/student/code` | Bộ câu hỏi, bài lập trình đã mở |
| Mô phỏng | `/student/games` | `/labs/[slug]` | Mô phỏng được giao theo bài |
| Mô phỏng đời sống | `/student/kho` | `/student/kho/[slug]` | Kho công khai, tự do khám phá |
| Tiến độ | `/student/progress` | `/student/profile` | Kết quả và tiến độ cá nhân |
| AI Gia sư | `/student/tutor` | — | Gợi ý khi gặp khó |

## Đối chiếu menu cũ → vị trí mới (không xóa chức năng)

| Menu / trang cũ | Vị trí mới |
|---|---|
| Khóa học (`/teacher/courses`) | Bài học — khóa học tự soạn vẫn mở được từ trang Bài học (không bắt buộc) |
| Bài tập & Đánh giá → Đã giao (`/teacher/assignments`) | Lớp của tôi → tab Bài đã giao |
| Bài tập & Đánh giá → Chờ chấm (`/teacher/assessment`) | Lớp của tôi → tab Chờ chấm; lối tắt ở Hôm nay |
| Bài tập & Đánh giá → Sổ điểm (`/teacher/results`) | Lớp của tôi → tab Sổ điểm; trong từng lớp ở tab Kết quả |
| Bài tập & Đánh giá → Thư viện bài tập (`/teacher/bank`) | Thư viện → Ngân hàng luyện tập |
| Kết quả học tập (`/teacher/analytics`) | Lớp của tôi → Kết quả của lớp → Báo cáo chi tiết |
| Tình huống mô phỏng (`/teacher/sims`) | Thư viện → Mô phỏng |
| Kho mô phỏng công khai (`/teacher/kho`) | Mục riêng **Mô phỏng đời sống** |
| Thư viện học liệu, Câu hỏi & học liệu, Thiết lập mô phỏng, Thiết kế hoạt động | Thư viện → Học liệu |
| Chuyên đề HSG (`/thuat-toan`) | Thư viện → Học liệu (liên kết) |
| HS: Khóa học của tôi (`/student/courses`) | Bài học |
| HS: Tình huống mô phỏng + Kho mô phỏng | Mô phỏng |
| HS: tab Nhiệm vụ trong bài | Gộp vào tab Mô phỏng / Luyện tập của bài (hoạt động được giao đứng đầu) |

## Luồng giao bài và kết quả

Bài học → chọn mô phỏng / bộ câu hỏi / bài lập trình → **Giao cho lớp** (cả lớp hoặc chọn học sinh; hạn nộp, số lần làm, cách tính điểm)
→ học sinh thấy trong **Bài của tôi** và ngay trong bài → hệ thống lưu bài làm, điểm, lịch sử
→ giáo viên xem ở tab **Đã giao** của bài, hoặc **Lớp của tôi → Bài đã giao → chi tiết** (đã làm / đang làm / chưa làm, câu sai từng em).

## Admin
`/admin` (tài khoản, chương trình, nhật ký) · `/admin/sims` (mô phỏng theo bài) · `/admin/kho` (mục **Mô phỏng đời sống**: ẩn/hiện, chọn nổi bật)

## API (server)
`POST /api/ai/[agent]`, `/api/tutor`, `/api/lab-grade`, `/api/khbd/*` — chọn mô hình bằng `LLM_PROVIDER` (mặc định `mock`).

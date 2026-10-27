# EduNova AI — PRD (Giai đoạn 1)

> Hệ sinh thái dạy và học Tin học THPT (lớp 10, 11, 12) theo Chương trình GDPT 2018, kết hợp phòng thí nghiệm tương tác và các trợ lý AI có giám sát của giáo viên.

## 1. Vấn đề
- Giáo viên soạn KHBD (kế hoạch bài dạy) tách rời với hoạt động thực hành; khó chứng minh mỗi mục tiêu (yêu cầu cần đạt) có hoạt động và minh chứng đánh giá tương ứng.
- Học sinh thiếu môi trường thực hành an toàn, trực quan cho các khái niệm trừu tượng (rẽ nhánh, kiểm thử, phần cứng, mạng, CSDL).
- Dữ liệu học tập (lần chạy, lỗi, điểm rubric) không quay lại để cải tiến KHBD.

## 2. Mục tiêu sản phẩm
Một quy trình liên thông, kiểm chứng được:

```
KHBD → Activity Builder → Thí nghiệm (Lab) → Bài nộp (kèm sự kiện) → Rubric → Báo cáo → Cải tiến KHBD
```

Mọi hoạt động map theo chuỗi: `grade → textbook → topic → lesson → learning objectives → activities → assessment evidence`.

## 3. Người dùng & quyền
| Vai trò | Quyền chính |
|---|---|
| Visitor | Xem trang public: khám phá, chương trình, thư viện lab |
| Teacher | Soạn KHBD, cấu hình lab, giao nhiệm vụ cho **lớp của mình**, chấm/duyệt rubric, xem phân tích |
| Student | Học, làm nhiệm vụ của **lớp mình được ghi danh**, nộp bài, xem kết quả của **chính mình** |
| Admin | Quản lý nội dung (trạng thái lab, thẩm định chương trình), tài khoản, audit log |

Giai đoạn 1: **demo role switch** (không có mật khẩu). Production: Supabase Auth + RLS phía server (xem `supabase/schema.sql`, bản nháp).

## 4. Phạm vi chương trình
- GDPT 2018 – Tin học THPT, các chủ đề A–G; phân biệt nội dung **chung**, định hướng **ICT** và **CS**.
- 3 bộ sách: Kết nối tri thức với cuộc sống, Cánh Diều, Chân trời sáng tạo.
- Dữ liệu bài học trong seed là **minh họa**, mọi bản ghi có `curriculumVerified: false` cho tới khi giáo viên/admin thẩm định với yêu cầu cần đạt và sách thực tế. Tên/thứ tự bài **không** được khẳng định là đúng sách.

## 5. Phân loại trạng thái chức năng (bắt buộc hiển thị)
- **REAL** – chạy thật bằng logic trong app (ví dụ: mô phỏng Smart Garden, kiểm thử luật, chấm tự động test case, lưu sự kiện, rubric, analytics tính từ dữ liệu trong store, iframe sandbox HTML/CSS).
- **DEMO** – luồng hoạt động nhưng dữ liệu/phản hồi là mẫu (mock repository lưu localStorage, phản hồi "AI" dạng template luật, demo login).
- **PLANNED** – chưa xây (Python thật bằng Pyodide Worker, 3D GLB, Supabase, xuất Word, parse docx/pdf, LLM thật).

## 6. Yêu cầu chức năng chính (giai đoạn 1)
1. Public: trang chủ, khám phá có lọc, cây chương trình, thư viện lab có lọc, chi tiết lab, giới thiệu, đăng nhập/đăng ký (demo).
2. Teacher Hub: dashboard, Trợ lý KHBD (CRUD + phiên bản + kiểm tra liên kết mục tiêu–đánh giá), Activity Builder 5 bước có validation, Virtual Lab Studio, Học liệu (mẫu + duyệt), Lớp học, Giao nhiệm vụ, Chấm & Rubric, Phân tích + gợi ý cải tiến KHBD, Thư viện chia sẻ, Cài đặt.
3. Student Hub: dashboard, lộ trình học, phòng thí nghiệm, Code Playground (kiểm tra điều kiện bằng parser an toàn, **không** chạy Python), nhiệm vụ (start/pause/submit/results), AI Mentor (template, nhãn DEMO), bản đồ năng lực, portfolio, thành tích (không bảng xếp hạng công khai).
4. Smart Garden Lab chạy thật: `pump = humidity < threshold AND hasWater` (threshold mặc định 40), lưu sự kiện `run/input/output/pass/timestamp/attemptId`.

## 7. Yêu cầu phi chức năng
- TypeScript strict, lint/typecheck/build pass, unit test cho engine, validation, phân quyền dữ liệu, analytics.
- Accessibility: điều hướng bàn phím, focus ring rõ, nhãn form, `prefers-reduced-motion`, tương phản tốt ở dark/light.
- Bảo mật: không chạy mã người dùng không cô lập; parser biểu thức không dùng `eval`; iframe `sandbox` không cho script; không có API key ở client; tài liệu tải lên coi là dữ liệu không tin cậy (chống prompt injection).
- Không dùng số liệu giả làm chứng cứ triển khai: mọi số liệu đều tính từ dữ liệu seed được dán nhãn "dữ liệu demo".

## 8. Tiêu chí nghiệm thu (Workflow)
- **A.** Teacher demo login → tạo KHBD Tin 10 (rẽ nhánh if) → chọn Smart Garden → cấu hình → publish cho 10A1.
- **B.** Student demo login → thấy nhiệm vụ → đổi độ ẩm/nước → chạy, kiểm thử → nộp.
- **C.** Teacher xem bài nộp với sự kiện → chỉnh điểm rubric → lưu đánh giá → analytics cập nhật.
- **D.** Search/filter thật; loading/empty/error states; responsive; bàn phím; không nút chết; lint/typecheck/build pass.
- **E.** Gắn nhãn REAL/DEMO/PLANNED rõ ràng.

## 9. Ngoài phạm vi giai đoạn 1
Supabase thật, LLM thật, Pyodide, Phaser/R3F, xuất Word, parse docx/pdf, thông báo email, đa trường.

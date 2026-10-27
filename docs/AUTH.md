# Đăng nhập và phân quyền (Supabase)

EduNova chạy ở một trong hai chế độ, tự chọn theo biến môi trường:

| Chế độ | Khi nào | Đăng nhập | Dữ liệu |
|---|---|---|---|
| **Dùng thử** | Không có `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (kể cả bản demo một file) | Chọn tài khoản mẫu, không mật khẩu | localStorage của trình duyệt |
| **Thật** | Có đủ hai biến trên | Email + mật khẩu (Supabase Auth) | Supabase PostgreSQL, bảo vệ bằng RLS |

> Giai đoạn hiện tại: đăng nhập, hồ sơ và vai trò đã chạy thật. Các chức năng (khóa học, bài tập…) vẫn đọc/ghi kho dữ liệu trên trình duyệt; bước tiếp theo là chuyển từng phần sang bảng Supabase đã có sẵn trong migration.

## Ba lớp bảo vệ

1. **Xác thực — bạn là ai.** Supabase Auth lưu mật khẩu đã băm (bcrypt); EduNova không bao giờ thấy mật khẩu gốc. Phiên nằm trong cookie, `src/proxy.ts` làm mới phiên và xác minh với máy chủ Auth ở mỗi request (`getUser()`).
2. **Vai trò — bạn được làm gì.** `profiles.role` ∈ `student | teacher | admin`.
   - Ai đăng ký cũng là **học sinh**.
   - Email thuộc **tên miền trường** (bảng `school_domains`) **và đã xác nhận** → tự thành **giáo viên**. Đổi sang email ngoài trường thì mất quyền giáo viên.
   - Người dùng chỉ sửa được `full_name`, `school`; không tự đổi vai trò (đã thu hồi quyền UPDATE cột `role`).
   - Quản trị viên đổi vai trò bằng `select set_user_role(<id>, 'teacher')`.
3. **Phân quyền theo dòng (RLS).** Mọi bảng bật RLS; cơ sở dữ liệu tự lọc theo `auth.uid()`, kể cả khi gọi API trực tiếp. `proxy.ts` chỉ là lớp tiện lợi (chuyển hướng), không phải lớp bảo mật chính.

| Dữ liệu | Học sinh | Giáo viên | Quản trị |
|---|---|---|---|
| Hồ sơ | Của mình; giáo viên lớp mình | Của mình; học sinh lớp mình dạy | Tất cả |
| Lớp, ghi danh | Lớp mình học (vào lớp bằng `join_class(mã mời)`) | Toàn quyền lớp mình dạy | Xem tất cả |
| Hoạt động, rubric, cấu hình mô phỏng | Chỉ những gì được giao cho lớp mình | Của mình; xem bản đồng nghiệp chia sẻ | — |
| Nhiệm vụ | Của lớp mình | Tạo/sửa cho lớp mình dạy | — |
| Bài nộp | Của mình; nộp/sửa khi nhiệm vụ còn mở và chưa chấm | Xem và đổi trạng thái bài lớp mình; **không sửa được nội dung bài** | — |
| Điểm | Của mình, sau khi giáo viên chốt (`final`) | Chấm bài lớp mình | — |
| Khóa học, tiến độ | Khóa đã phát hành cho lớp mình; tiến độ của mình | Khóa của mình và tiến độ học sinh trong đó | — |
| AI Gia sư | Sự kiện của mình | Chỉ số liệu tổng hợp `tutor_class_summary(lớp)`, nhóm < 2 học sinh bị ẩn | — |
| Chương trình, SGK, kho mô phỏng | Đọc | Đọc | Sửa |
| Lịch sử AI, nhật ký | Của mình (AI) | Của mình (AI) | Tất cả |

Khách chưa đăng nhập (`anon`) không đọc được bảng nào.

Kiểm chứng: `tests/db/rls.test.ts` chạy chính file migration trên PostgreSQL (PGlite) với `auth.users`/`auth.uid()` giả lập, đóng vai từng người dùng — 22 tình huống (nâng quyền, đọc chéo lớp, sửa bài sau khi chấm, giáo viên sửa bài học sinh…). Chạy cùng `npm test`.

## Cài đặt

1. Tạo project trên [supabase.com](https://supabase.com).
2. Chạy migration: `supabase/migrations/20261027000000_init.sql` (SQL Editor, hoặc `supabase db push` với Supabase CLI).
3. **Authentication → Sign In / Providers → Email**: bật Email, **bật "Confirm email"** (bắt buộc: nếu tắt, ai cũng có thể khai email trường để nhận quyền giáo viên). Đặt độ dài mật khẩu tối thiểu 8.
4. **Authentication → URL Configuration**: *Site URL* = địa chỉ triển khai (vd `https://edunova.vercel.app`); *Redirect URLs* thêm `https://<tên-miền>/auth/callback` (và `http://localhost:3000/auth/callback` khi phát triển).
5. Thêm tên miền email trường (SQL Editor):
   ```sql
   insert into school_domains (domain, school_name) values ('thpt-abc.edu.vn', 'THPT ABC');
   ```
   Tài khoản đã xác nhận thuộc tên miền này được nâng thành giáo viên ngay.
6. Tạo quản trị viên đầu tiên: đăng ký bình thường, rồi trong SQL Editor:
   ```sql
   update profiles set role = 'admin' where email = 'ban@truong.edu.vn';
   ```
7. Đặt biến môi trường (Vercel → Settings → Environment Variables, hoặc `.env` khi chạy máy):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Không cần và **không được** đặt service_role key phía client.

## Luồng người dùng

- **Đăng ký** `/register` → thư xác nhận → `/auth/callback` → vào khu vực theo vai trò.
- **Đăng nhập** `/login` → email + mật khẩu → quay lại trang đang mở (chỉ đường dẫn nội bộ hợp lệ) hoặc trang chủ của vai trò.
- **Quên mật khẩu** `/forgot-password` → thư → `/auth/callback?next=/reset-password` → đặt mật khẩu mới. Trang không tiết lộ email có tồn tại hay không.
- **Học sinh vào lớp**: hàm `join_class(mã mời)` đã có trong cơ sở dữ liệu; màn hình nhập mã cho học sinh làm cùng bước chuyển dữ liệu lớp học sang Supabase.
- **Đăng xuất**: xóa phiên Supabase (cookie) và phiên trên trình duyệt.

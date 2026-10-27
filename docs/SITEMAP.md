# Sitemap

## Public
| Route | Nội dung |
|---|---|
| `/` | Navbar, hero + preview lab, 3 giá trị, Tin 10/11/12, featured labs, workflow KHBD→Lab, CTA, FAQ, footer |
| `/explore` | Lọc lớp, bộ sách, chủ đề, định hướng; tìm bài học & lab |
| `/curriculum` | Cây kiến thức Tin 10–12: chủ đề → bài → yêu cầu cần đạt (minh họa, chưa thẩm định) |
| `/labs` | Thư viện lab: tìm kiếm, lọc lớp/trạng thái/tag |
| `/labs/[slug]` | Mô tả, mục tiêu, preview, bài tập mẫu, đặc tả kỹ thuật, quyền truy cập |
| `/about`, `/login`, `/register` | Giới thiệu, đăng nhập demo theo vai trò, đăng ký (form validate, chưa tạo tài khoản thật) |

## Teacher Hub (`/teacher/*`)
dashboard · lesson-planner · lesson-planner/[id] · activity-builder · labs · resources · classes · assignments · assessment · analytics · library · settings

## Student Hub (`/student/*`)
dashboard · learning · labs · labs/[slug] · code · missions · missions/[id] · mentor · learning-map · portfolio · achievements · settings

## Admin
`/admin` – tài khoản, trạng thái lab, thẩm định chương trình, audit log

## API (server)
`POST /api/ai/[agent]` – 5 vai trò agent, đầu ra có cấu trúc (Zod), **giai đoạn 1 trả về template có nhãn `demo: true`**.

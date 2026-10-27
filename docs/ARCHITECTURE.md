# Kiến trúc

## Tổng quan
```
Next.js App Router (TypeScript strict)
├── app/(public)        Trang public (Server Components + client islands)
├── app/teacher|student|admin   Hub theo vai trò (client, guard theo demo session)
├── app/api/ai/[agent]  Route handler server: agent template + Zod structured output
├── lib/domain          Kiểu dữ liệu (khớp DATA_MODEL.md)
├── lib/data            Seed tĩnh: chương trình, lab templates, người dùng, lớp
├── lib/store           Mock repository (Zustand + persist localStorage) + selectors phân quyền
├── lib/sim             Engine mô phỏng thuần TS (Smart Garden, parser biểu thức an toàn, binary, kiểm tra GLB)
├── lib/ai              Định nghĩa agent, schema đầu ra, sanitize tài liệu, template demo
├── lib/analytics       Tính mastery / completion / error patterns / gợi ý cải tiến KHBD
└── components          UI primitives (phong cách shadcn/ui), layout, labs
```

## Quyết định chính
| Chủ đề | Quyết định giai đoạn 1 | Giai đoạn tích hợp |
|---|---|---|
| Dữ liệu | Mock repository trong trình duyệt (localStorage), seed nhất quán, nút "Khôi phục dữ liệu demo" | Supabase PostgreSQL; repository interface giữ nguyên chữ ký |
| Auth | Không có biến môi trường Supabase: chọn tài khoản mẫu. Có: Supabase Auth (email + mật khẩu), `src/proxy.ts` chặn ở máy chủ | Xem `docs/AUTH.md` |
| Phân quyền dữ liệu | Selector `scoped.ts` lọc theo owner/enrollment (mô phỏng RLS) + unit test | RLS trong `supabase/migrations/` (đã kiểm thử: `tests/db/rls.test.ts`); không tin client |
| Mô phỏng 2D | SVG + React + engine TS thuần, deterministic | Phaser cho lab 2D/2.5D phức tạp |
| 3D | Chưa có; trang lab hiển thị checklist mesh bắt buộc và báo thiếu asset | React Three Fiber + GLB (mesh `Case`, `Motherboard`, `CPU`, ...) |
| Python | **Không chạy Python.** Code Playground trích điều kiện `if` và đánh giá bằng parser an toàn | Monaco + Pyodide trong Web Worker, timeout, không DOM/network |
| HTML/CSS | iframe `sandbox=""` + `srcdoc` (không script, không same-origin) | CSP bổ sung |
| AI | Route server trả template theo luật, `demo: true`, validate Zod, log `AIInteraction` | LLM qua server, prompt template versioned, structured output, human review |

> Ghi chú Next.js 16: tắt `cacheComponents`/`partialPrefetching` vì phần lớn trang hub là client state; trang public vẫn prerender tĩnh.

## Luồng dữ liệu liên thông
1. `LessonPlan` (mục tiêu `objectiveIds`, hoạt động 4 pha, có thể gắn `labTemplateId`) → `LessonPlanVersion` khi lưu phiên bản.
2. Activity Builder tạo `LabConfiguration` + `Rubric` (tiêu chí map `objectiveId`) + `TeachingActivity` (câu hỏi) + `Assignment` cho từng lớp.
3. Học sinh mở nhiệm vụ → `LabAttempt`; mỗi thao tác ghi `ExperimentEvent` (`run`, `test`, `input_change`, `rule_change`, `reset`, `submit`).
4. Nộp bài → `Submission` (luật, kết quả test tự động, giải thích, câu trả lời) + `PortfolioItem`.
5. Giáo viên chấm → `Assessment` (điểm theo `RubricCriterion`). Gợi ý AI chỉ để tham khảo.
6. Analytics tính từ `Assessment` + `ExperimentEvent` → gợi ý cải tiến → giáo viên duyệt → tạo `LessonPlanVersion` mới.

## Bảo mật
- Parser biểu thức: tokenizer + recursive descent, whitelist định danh (`humidity`, `has_water`), giới hạn độ dài 200 ký tự và độ sâu 20; không `eval`/`Function`.
- Văn bản tải lên/nhập tự do đi qua `sanitizeUntrustedText` (cắt độ dài, gắn cờ mẫu chỉ thị kiểu prompt injection, bọc trong delimiter) trước khi đưa vào prompt.
- API key (giai đoạn sau) chỉ ở biến môi trường server; client chỉ gọi `/api/ai/*`.
- Headers bảo mật cơ bản trong `next.config.ts`.

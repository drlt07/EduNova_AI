# Implementation plan & tiến độ

| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M1 | Khảo sát repo (thư mục trống), PRD, sitemap, design system, kiến trúc, data model, kế hoạch | xem README "Tiến độ" |
| M2 | Scaffold Next.js 16 + Tailwind 4, design tokens, public pages, shell, role-demo, mock repository | |
| M3 | Teacher pages + Activity Builder 5 bước (RHF + Zod) | |
| M4 | Student pages + Smart Garden deterministic simulation | |
| M5 | Tích hợp E2E teacher → student → assessment → analytics → cải tiến KHBD | |
| M6 | QA: unit test, E2E Playwright, screenshot, a11y, README, giới hạn, roadmap | |

## Roadmap sau giai đoạn 1
1. Supabase: schema + RLS, Auth, Storage (asset GLB, file KHBD).
2. AI thật: server-side LLM, prompt templates có version, structured outputs, log & human review.
3. Pyodide Worker cho Python (timeout, không mạng), Monaco đầy đủ.
4. Inside Computer 3D (R3F + GLB), Phaser cho Smart Coding City / Network Journey.
5. Xuất KHBD sang Word; parse docx/pdf (cô lập, sanitize).

# Design system

- Phong cách: premium AI SaaS × phòng thí nghiệm khoa học.
- Màu (dark mặc định): nền `#0B1220`, sidebar `#111D33`, cyan `#22D3EE`, blue `#4F7FFF`, violet `#8B5CF6`, chữ `#F8FAFC`. Light mode có token tương ứng.
- Font: Be Vietnam Pro (hỗ trợ tiếng Việt đầy đủ).
- Bo góc card 16px (`rounded-2xl`), control 10–12px; lưới 8pt.
- Trạng thái: `StatusBadge` REAL (xanh lá) / DEMO (vàng hổ phách) / PLANNED (xám-tím).
- Thành phần: Button, Card, Badge, Input, Textarea, Select (native, truy cập tốt), Tabs/Dialog (Radix), Progress, Skeleton, EmptyState, ErrorState.
- Motion: Motion (framer) với `useReducedMotion`; CSS tôn trọng `prefers-reduced-motion`.
- Focus: vòng `ring-2 ring-cyan` rõ ở mọi phần tử tương tác.

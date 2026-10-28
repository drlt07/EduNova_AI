import type { Grade } from "@/lib/domain/types";
import { bookOf } from "@/lib/sgk/book";
import { cn } from "@/lib/utils";

/** Họa tiết riêng cho mỗi khối: lớp 10 mã lệnh và nhị phân, lớp 11 vi mạch và bảng dữ liệu, lớp 12 mạng và nơ-ron. */
function Motif({ grade, accent }: { grade: Grade; accent: string }) {
  if (grade === 10)
    return (
      <g opacity={0.9}>
        {["if do_am < 40:", "    bom = True", "for i in range(n):", "    tong += i"].map((l, i) => <text key={l} x={22} y={150 + i * 16} fontSize={11} fontFamily="monospace" fill={accent} opacity={0.85 - i * 0.12}>{l}</text>)}
        {Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => <text key={`${r}${c}`} x={118 + c * 11} y={40 + r * 14} fontSize={10} fontFamily="monospace" fill={accent} opacity={((r * 7 + c * 3) % 5) / 7 + 0.12}>{(r + c) % 3 ? 1 : 0}</text>))}
      </g>
    );
  if (grade === 11)
    return (
      <g opacity={0.9}>
        <rect x={120} y={28} width={62} height={62} rx={6} fill="none" stroke={accent} strokeWidth={2} />
        <rect x={136} y={44} width={30} height={30} rx={3} fill={accent} opacity={0.35} />
        {Array.from({ length: 5 }, (_, i) => <g key={i} stroke={accent} strokeWidth={1.5}><line x1={128 + i * 11.5} y1={20} x2={128 + i * 11.5} y2={28} /><line x1={128 + i * 11.5} y1={90} x2={128 + i * 11.5} y2={98} /><line x1={112} y1={36 + i * 11.5} x2={120} y2={36 + i * 11.5} /><line x1={182} y1={36 + i * 11.5} x2={190} y2={36 + i * 11.5} /></g>)}
        {Array.from({ length: 4 }, (_, r) => Array.from({ length: 3 }, (_, c) => <rect key={`${r}${c}`} x={22 + c * 34} y={146 + r * 14} width={32} height={12} fill={accent} opacity={r === 0 ? 0.6 : 0.2} />))}
      </g>
    );
  return (
    <g opacity={0.9}>
      {[[130, 34], [176, 60], [138, 92], [104, 64], [168, 110]].map(([x, y], i, a) => <g key={i}>{a.slice(i + 1).map(([x2, y2], j) => <line key={j} x1={x} y1={y} x2={x2} y2={y2} stroke={accent} strokeWidth={1} opacity={0.5} />)}<circle cx={x} cy={y} r={6} fill={accent} /></g>)}
      {[0, 1, 2].map((col) => Array.from({ length: col === 1 ? 4 : 3 }, (_, r) => <circle key={`${col}${r}`} cx={30 + col * 36} cy={150 + r * 16 + (col === 1 ? -8 : 0)} r={5} fill="none" stroke={accent} strokeWidth={1.5} />))}
    </g>
  );
}

/** Bìa SGK số (thiết kế riêng của EduNova, không phải bìa sách in). */
export function BookCover({ grade, className }: { grade: Grade; className?: string }) {
  const b = bookOf(grade);
  return (
    <svg viewBox="0 0 210 280" className={cn("rounded-r-lg rounded-l-sm shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]", className)} role="img" aria-label={`Bìa ${b.title}`}>
      <rect width={210} height={280} fill={b.cover.bg} />
      <rect width={12} height={280} fill="#000" opacity={0.25} />
      <rect x={12} width={2} height={280} fill="#fff" opacity={0.12} />
      <Motif grade={grade} accent={b.cover.accent} />
      <text x={22} y={30} fontSize={10} letterSpacing={2} fill={b.cover.ink} opacity={0.7}>SÁCH GIÁO KHOA SỐ</text>
      <text x={22} y={58} fontSize={20} fontWeight={800} fill={b.cover.ink}>TIN HỌC</text>
      <text x={20} y={128} fontSize={68} fontWeight={900} fill={b.cover.accent}>{grade}</text>
      <rect x={22} y={236} width={166} height={1} fill={b.cover.ink} opacity={0.25} />
      <text x={22} y={252} fontSize={8.5} fill={b.cover.ink} opacity={0.75}>Theo mục lục Kết nối tri thức</text>
      <text x={22} y={266} fontSize={9} fontWeight={700} fill={b.cover.ink}>EduNova</text>
    </svg>
  );
}

"use client";
/** Cảnh nông trại nhiều luống, có hoạt ảnh nước tưới và cây đung đưa. */
import { cn } from "@/lib/utils";

export interface BedState {
  humidity: number;
  pump: boolean | null;
  error?: boolean;
}

function soil(h: number) {
  const t = Math.max(0, Math.min(100, h)) / 100;
  const m = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${m(184, 72)}, ${m(136, 48)}, ${m(88, 30)})`;
}

export function FarmScene({ beds, hasWater, className }: { beds: BedState[]; hasWater: boolean; className?: string }) {
  const n = Math.max(1, beds.length);
  const w = 640;
  const bedW = (w - 140) / n;
  const label = `Nông trại ${n} luống, bình ${hasWater ? "còn nước" : "hết nước"}. ` + beds.map((b, i) => `Luống ${i + 1}: độ ẩm ${b.error ? "lỗi cảm biến" : b.humidity + "%"}, bơm ${b.pump === null ? "chưa chạy" : b.pump ? "bật" : "tắt"}`).join("; ");
  return (
    <svg viewBox={`0 0 ${w} 300`} role="img" aria-label={label} className={cn("h-auto w-full select-none", className)}>
      <defs>
        <linearGradient id="farm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="farm-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width={w} height="300" rx="16" fill="url(#farm-sky)" />
      <g className="farm-sun" style={{ transformOrigin: "585px 48px" }}>
        <circle cx="585" cy="48" r="22" fill="#fde047" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1="585" y1="14" x2="585" y2="4" stroke="#facc15" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45} 585 48)`} />
        ))}
      </g>
      <path d="M0 120 Q120 90 260 115 T640 105 V300 H0 Z" fill="#86efac" opacity="0.55" />
      {/* bình nước */}
      <g transform="translate(24 120)">
        <rect width="64" height="110" rx="10" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
        {hasWater && <rect x="4" y="30" width="56" height="76" rx="7" fill="url(#farm-water)" className="farm-water-level" />}
        <text x="32" y="-8" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">Bình nước</text>
        {!hasWater && <text x="32" y="64" textAnchor="middle" fontSize="11" fill="#be123c" fontWeight="800">HẾT NƯỚC</text>}
      </g>
      <path d={`M88 210 H${w - 20}`} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
      {beds.map((b, i) => {
        const x = 110 + i * bedW;
        const cx = x + bedW / 2;
        const pumping = b.pump === true && hasWater;
        const dry = b.pump === true && !hasWater;
        const wilted = !b.error && b.humidity < 25 && !pumping;
        const leaf = wilted ? "#ca8a04" : "#16a34a";
        return (
          <g key={i}>
            <rect x={x + 8} y="225" width={bedW - 16} height="60" rx="10" fill={b.error ? "#94a3b8" : soil(b.humidity)} />
            {/* van / bơm của luống */}
            <circle cx={cx} cy="210" r="11" fill={dry ? "#fb7185" : pumping ? "#22d3ee" : "#e2e8f0"} stroke="#334155" strokeWidth="2" />
            <text x={cx} y="214" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">{pumping ? "ON" : dry ? "!" : "OFF"}</text>
            {pumping && [0, 1, 2].map((k) => <circle key={k} cx={cx - 10 + k * 10} cy="232" r="3" fill="#0ea5e9" className="drip" style={{ animationDelay: `${k * 0.2}s` }} />)}
            {/* cây */}
            <g className={wilted ? "" : "farm-sway"} style={{ transformOrigin: `${cx}px 240px` }}>
              <path d={`M${cx} 240 C ${cx} 215, ${cx + (wilted ? 10 : 0)} 195, ${cx + (wilted ? 16 : 0)} 180`} stroke="#15803d" strokeWidth="4" fill="none" strokeLinecap="round" />
              <ellipse cx={cx - 12} cy={wilted ? 214 : 206} rx="13" ry="6" fill={leaf} transform={`rotate(${wilted ? 25 : -25} ${cx - 12} 206)`} />
              <ellipse cx={cx + 12} cy={wilted ? 206 : 196} rx="13" ry="6" fill={leaf} transform={`rotate(${wilted ? 45 : 25} ${cx + 12} 196)`} />
              {!wilted && !b.error && <circle cx={cx} cy="178" r="5" fill="#f472b6" />}
            </g>
            <rect x={cx - 30} y="250" width="60" height="22" rx="6" fill="#0f172a" opacity="0.85" />
            <text x={cx} y="265" textAnchor="middle" fontSize="12" fontWeight="700" fill={b.error ? "#fda4af" : "#67e8f9"}>{b.error ? "LỖI" : `${b.humidity}%`}</text>
            {n > 1 && <text x={cx} y="160" textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="600">Luống {i + 1}</text>}
          </g>
        );
      })}
    </svg>
  );
}

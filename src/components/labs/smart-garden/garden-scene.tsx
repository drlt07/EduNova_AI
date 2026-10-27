"use client";
import type { PlantState } from "@/lib/sim/smart-garden";

interface Props {
  humidity: number;
  hasWater: boolean;
  pump: boolean | null;
  plant: PlantState | null;
  threshold: number;
}

function soilColor(h: number) {
  // khô: nâu nhạt → ẩm: nâu đậm
  const t = h / 100;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(176, 70)}, ${mix(130, 46)}, ${mix(84, 30)})`;
}

export function GardenScene({ humidity, hasWater, pump, plant, threshold }: Props) {
  const pumping = pump === true && hasWater;
  const dryRun = pump === true && !hasWater;
  const state: PlantState = plant ?? (humidity < Math.min(25, threshold) ? "thirsty" : "healthy");
  const leaf = state === "thirsty" ? "#C9A227" : state === "overwatered" ? "#7FA650" : "#22C55E";
  const droop = state === "thirsty" ? 18 : 0;
  const label = `Mô phỏng vườn: độ ẩm ${humidity}%, ngưỡng ${threshold}%, bình ${hasWater ? "còn nước" : "hết nước"}, máy bơm ${pump === null ? "chưa chạy" : pump ? "đang bật" : "tắt"}, cây ${{ healthy: "khỏe", thirsty: "đang héo", overwatered: "bị úng", "pump-dry": "chưa được tưới, bơm chạy khô" }[state]}.`;
  const tankLevel = hasWater ? 62 : 0;
  const sensorY = 196;

  return (
    <svg viewBox="0 0 560 320" role="img" aria-label={label} className="h-auto w-full select-none">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E2A47" />
          <stop offset="1" stopColor="#123A5C" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="560" height="320" rx="16" fill="url(#sky)" />
      {/* lưới kỹ thuật */}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={i} x1={i * 44} y1="0" x2={i * 44} y2="200" stroke="#ffffff" strokeOpacity="0.04" />
      ))}
      {/* đất */}
      <path d="M0 210 Q140 196 280 206 T560 204 V320 H0 Z" fill={soilColor(humidity)} />
      <path d="M0 210 Q140 196 280 206 T560 204" stroke="#000" strokeOpacity="0.2" fill="none" />
      {state === "overwatered" && <ellipse cx="300" cy="222" rx="70" ry="8" fill="#60A5FA" opacity="0.55" />}

      {/* bình nước */}
      <g transform="translate(40 92)">
        <rect x="0" y="0" width="70" height="108" rx="10" fill="#0B1220" stroke="#64748B" strokeWidth="2" />
        <rect x="4" y={104 - tankLevel * 1.6} width="62" height={tankLevel * 1.6} rx="6" fill="url(#water)" opacity="0.9" />
        <text x="35" y="-8" textAnchor="middle" fontSize="12" fill="#CBD5E1" fontWeight="600">Bình nước</text>
        {!hasWater && (
          <text x="35" y="60" textAnchor="middle" fontSize="12" fill="#FB7185" fontWeight="700">HẾT NƯỚC</text>
        )}
      </g>

      {/* ống từ bình tới bơm */}
      <path d="M110 186 H160" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
      {pumping && <path d="M110 186 H160" stroke="#38BDF8" strokeWidth="4" className="water-flow" />}

      {/* máy bơm */}
      <g transform="translate(160 160)">
        <rect width="64" height="48" rx="10" fill="#1E293B" stroke={dryRun ? "#FB7185" : pumping ? "#22D3EE" : "#64748B"} strokeWidth="2" />
        <circle cx="48" cy="14" r="6" fill={dryRun ? "#FB7185" : pumping ? "#34D399" : "#475569"} />
        {pumping && <circle cx="48" cy="14" r="14" fill="url(#glow)" />}
        <text x="22" y="34" textAnchor="middle" fontSize="11" fill="#E2E8F0" fontWeight="700">BƠM</text>
        <text x="32" y="64" textAnchor="middle" fontSize="11" fill={pump ? (dryRun ? "#FB7185" : "#34D399") : "#94A3B8"} fontWeight="600">
          {pump === null ? "chờ chạy" : pump ? (dryRun ? "chạy khô!" : "BẬT") : "TẮT"}
        </text>
      </g>

      {/* ống lên vòi phun */}
      <path d="M224 176 H262 V96 H300" stroke="#475569" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {pumping && <path d="M224 176 H262 V96 H300" stroke="#38BDF8" strokeWidth="4" fill="none" className="water-flow" />}
      <rect x="296" y="88" width="30" height="14" rx="4" fill="#334155" />
      {pumping &&
        [0, 1, 2, 3].map((i) => (
          <circle key={i} cx={304 + i * 7} cy={110} r="2.6" fill="#7DD3FC" className="drip" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}

      {/* cây */}
      <g transform="translate(312 206)">
        <path d={`M0 0 C 2 -30, ${-2 + droop / 3} -52, ${droop / 2} -74`} stroke="#15803D" strokeWidth="5" fill="none" strokeLinecap="round" />
        <g transform={`translate(${droop / 4} -38) rotate(${-30 + droop})`}>
          <ellipse rx="22" ry="9" cx="-18" fill={leaf} />
        </g>
        <g transform={`translate(${droop / 4} -50) rotate(${30 + droop})`}>
          <ellipse rx="22" ry="9" cx="18" fill={leaf} />
        </g>
        <g transform={`translate(${droop / 2} -74) rotate(${droop})`}>
          <ellipse rx="12" ry="16" cy="-10" fill={leaf} />
          {state === "healthy" && <circle cy="-24" r="6" fill="#F472B6" />}
        </g>
      </g>

      {/* cảm biến */}
      <g transform={`translate(392 ${sensorY - 70})`}>
        <rect x="0" y="0" width="74" height="34" rx="8" fill="#0B1220" stroke="#22D3EE" strokeOpacity="0.6" />
        <text x="37" y="14" textAnchor="middle" fontSize="9" fill="#94A3B8">CẢM BIẾN</text>
        <text x="37" y="28" textAnchor="middle" fontSize="13" fill="#22D3EE" fontWeight="700">{humidity}%</text>
        <path d="M30 34 V 92 M44 34 V 92" stroke="#94A3B8" strokeWidth="3" />
      </g>

      {/* thanh độ ẩm */}
      <g transform="translate(500 40)">
        <text x="14" y="-10" textAnchor="middle" fontSize="10" fill="#CBD5E1">Độ ẩm</text>
        <rect width="28" height="200" rx="8" fill="#0B1220" stroke="#334155" />
        <rect x="3" y={3 + 194 * (1 - humidity / 100)} width="22" height={194 * (humidity / 100)} rx="6" fill={humidity < threshold ? "#F59E0B" : "#22D3EE"} />
        <line x1="-6" x2="34" y1={3 + 194 * (1 - threshold / 100)} y2={3 + 194 * (1 - threshold / 100)} stroke="#F8FAFC" strokeDasharray="3 3" />
        <text x="-8" y={6 + 194 * (1 - threshold / 100)} textAnchor="end" fontSize="10" fill="#F8FAFC">{threshold}%</text>
      </g>
    </svg>
  );
}

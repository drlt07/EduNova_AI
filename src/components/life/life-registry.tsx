"use client";
/** Ảnh bìa (320×180) và thành phần chạy của các mô phỏng Tin học trong đời sống. */
import { QrCodeLab } from "./qr-code";
import { GpsLab } from "./gps";
import { BarcodeLab } from "./barcode";
import { EncryptionLab } from "./encryption";
import { SpamFilterLab } from "./spam-filter";
import { RecommenderLab } from "./recommender";
import { ImageCompressLab } from "./image-compress";

export const LIFE_COMPONENTS: Record<string, () => React.ReactElement> = {
  "qr-code": QrCodeLab, gps: GpsLab, barcode: BarcodeLab, encryption: EncryptionLab, "spam-filter": SpamFilterLab, recommender: RecommenderLab, "image-compress": ImageCompressLab,
};

type P = { className?: string };
const M = "ui-monospace,monospace";
function Svg({ label, bg, className, children }: P & { label: string; bg: string; children: React.ReactNode }) {
  return <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label}><rect width="320" height="180" fill={bg} />{children}</svg>;
}
const ART: Record<string, (p: P) => React.ReactElement> = {
  "qr-code": ({ className }) => (
    <Svg className={className} bg="#eff6ff" label="Mã QR có vết bẩn">
      <rect x="100" y="20" width="140" height="140" rx="10" fill="#fff" />
      {Array.from({ length: 13 * 13 }, (_, i) => { const r = Math.floor(i / 13), c = i % 13; const f = (r < 4 && c < 4) || (r < 4 && c > 8) || (r > 8 && c < 4); const on = f ? !(r % 4 === 1 && c % 4 === 1) && (r % 4 !== 3 && c % 4 !== 3 || false) : (r * 7 + c * 3) % 5 < 2; return on ? <rect key={i} x={110 + c * 9.2} y={30 + r * 9.2} width={9} height={9} fill={f ? "#1d4ed8" : "#0f172a"} /> : null; })}
      <ellipse cx="205" cy="115" rx="26" ry="20" fill="#b45309" opacity="0.8" />
      <rect x="250" y="60" width="52" height="60" rx="10" fill="#0f172a" /><rect x="256" y="68" width="40" height="40" rx="4" fill="#22c55e" opacity="0.8" /><text x="276" y="94" textAnchor="middle" fontSize="16" fill="#fff">✓</text>
    </Svg>
  ),
  gps: ({ className }) => (
    <Svg className={className} bg="#e0f2fe" label="Ba vòng tròn GPS giao nhau">
      <path d="M0 130 Q100 110 170 135 T320 120 V180 H0 Z" fill="#bbf7d0" />
      {[[70, 40, 95, "#2563eb"], [260, 45, 100, "#ea580c"], [170, 170, 70, "#16a34a"]].map(([x, y, r, c]) => <g key={c as string}><circle cx={x as number} cy={y as number} r={r as number} fill="none" stroke={c as string} strokeWidth="2.5" /><rect x={(x as number) - 8} y={(y as number) - 5} width="16" height="10" rx="2" fill={c as string} /></g>)}
      <path d="M165 112 l-7 -16 a8 8 0 1 1 14 0 z" fill="#e11d48" stroke="#fff" strokeWidth="1.5" />
    </Svg>
  ),
  barcode: ({ className }) => (
    <Svg className={className} bg="#fefce8" label="Mã vạch siêu thị">
      <rect x="60" y="30" width="200" height="110" rx="10" fill="#fff" />
      {Array.from({ length: 48 }, (_, i) => ((i * 7) % 5 < 3 ? <rect key={i} x={75 + i * 3.6} y={42} width={(i % 3) + 1} height={72} fill="#0f172a" /> : null))}
      <text x="160" y="132" textAnchor="middle" fontSize="13" fontFamily={M} fill="#0f172a">893500123456<tspan fill="#16a34a" fontWeight="700">2</tspan></text>
      <rect x="40" y="70" width="240" height="3" fill="#ef4444" opacity="0.8" />
    </Svg>
  ),
  encryption: ({ className }) => (
    <Svg className={className} bg="#f5f3ff" label="Tin nhắn được mã hóa">
      <rect x="24" y="50" width="100" height="44" rx="14" fill="#2563eb" /><text x="74" y="77" textAnchor="middle" fontSize="13" fill="#fff">Hẹn 5 giờ</text>
      <rect x="140" y="56" width="40" height="34" rx="6" fill="#f59e0b" /><path d="M148 56 v-8 a12 12 0 0 1 24 0 v8" fill="none" stroke="#f59e0b" strokeWidth="5" />
      <rect x="196" y="50" width="100" height="44" rx="14" fill="#0f172a" /><text x="246" y="77" textAnchor="middle" fontSize="13" fontFamily={M} fill="#86efac">KHQ 5 JLR</text>
      <text x="160" y="140" textAnchor="middle" fontSize="12" fontFamily={M} fill="#6d28d9">A→D · B→E · C→F</text>
    </Svg>
  ),
  "spam-filter": ({ className }) => (
    <Svg className={className} bg="#fff1f2" label="Thư rác bị chặn">
      {[[40, 40, "#22c55e"], [40, 80, "#ef4444"], [40, 120, "#22c55e"]].map(([x, y, c], i) => <g key={i}><rect x={x as number} y={y as number} width="110" height="30" rx="6" fill="#fff" stroke="#e2e8f0" /><circle cx={(x as number) + 14} cy={(y as number) + 15} r="5" fill={c as string} /><rect x={(x as number) + 26} y={(y as number) + 10} width="70" height="4" rx="2" fill="#94a3b8" /><rect x={(x as number) + 26} y={(y as number) + 18} width="45" height="4" rx="2" fill="#cbd5e1" /></g>)}
      <path d="M160 95 h40" stroke="#94a3b8" strokeWidth="3" />
      <rect x="210" y="50" width="80" height="90" rx="12" fill="#fecdd3" /><text x="250" y="102" textAnchor="middle" fontSize="28">🗑️</text><text x="250" y="130" textAnchor="middle" fontSize="11" fill="#9f1239">Thư rác</text>
    </Svg>
  ),
  recommender: ({ className }) => (
    <Svg className={className} bg="#faf5ff" label="Bảng tin gợi ý video">
      {[["#7c3aed", "🎮"], ["#7c3aed", "🎮"], ["#16a34a", "⚽"], ["#7c3aed", "🎮"]].map(([c, e], i) => <g key={i} transform={`translate(${24 + (i % 2) * 140} ${24 + Math.floor(i / 2) * 70})`}><rect width="130" height="58" rx="10" fill={c} opacity={i === 2 ? 0.55 : 0.9} /><text x="65" y="38" textAnchor="middle" fontSize="24">{e}</text></g>)}
      <circle cx="160" cy="90" r="80" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 5" opacity="0.6" />
    </Svg>
  ),
  "image-compress": ({ className }) => (
    <Svg className={className} bg="#ecfeff" label="Ảnh trước và sau khi nén">
      {Array.from({ length: 64 }, (_, i) => { const x = i % 8, y = Math.floor(i / 8); return <rect key={i} x={30 + x * 13} y={35 + y * 13} width="13" height="13" fill={y < 4 ? `rgb(${130 + y * 20},${190 + y * 8},250)` : `rgb(${40 + x * 6},${150 - y * 5},70)`} />; })}
      <path d="M150 90 h30" stroke="#0891b2" strokeWidth="3" /><path d="M176 84 l8 6 -8 6" fill="none" stroke="#0891b2" strokeWidth="3" />
      {Array.from({ length: 16 }, (_, i) => { const x = i % 4, y = Math.floor(i / 4); return <rect key={i} x={196 + x * 26} y={35 + y * 26} width="26" height="26" fill={y < 2 ? "rgb(170,205,250)" : "rgb(60,135,70)"} />; })}
      <text x="82" y="160" textAnchor="middle" fontSize="11" fontFamily={M} fill="#0e7490">2 900 KB</text><text x="248" y="160" textAnchor="middle" fontSize="11" fontFamily={M} fill="#0e7490">180 KB</text>
    </Svg>
  ),
};
export function LifeArt({ slug, className }: { slug: string; className?: string }) {
  const A = ART[slug];
  return A ? <A className={className} /> : <div className={className} />;
}

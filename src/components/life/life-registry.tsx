"use client";
/** Ảnh bìa (320×180) và thành phần chạy của các mô phỏng Tin học trong đời sống. */
import { QrCodeLab } from "./qr-code";
import { GpsLab } from "./gps";
import { BarcodeLab } from "./barcode";
import { EncryptionLab } from "./encryption";
import { SpamFilterLab } from "./spam-filter";
import { RecommenderLab } from "./recommender";
import { ImageCompressLab } from "./image-compress";
import { PasswordLab } from "./password";
import { RgbPixelLab } from "./rgb-pixel";
import { DownloadTimeLab } from "./download-time";
import { StorageUnitsLab } from "./storage-units";
import { PrintQueueLab } from "./print-queue";
import { UndoStackLab } from "./undo-stack";
import { BrowserCacheLab } from "./browser-cache";
import { ElevatorLab } from "./elevator";

export const LIFE_COMPONENTS: Record<string, () => React.ReactElement> = {
  "qr-code": QrCodeLab, gps: GpsLab, barcode: BarcodeLab, encryption: EncryptionLab, "spam-filter": SpamFilterLab, recommender: RecommenderLab, "image-compress": ImageCompressLab, password: PasswordLab, "rgb-pixel": RgbPixelLab, "download-time": DownloadTimeLab, "storage-units": StorageUnitsLab, "print-queue": PrintQueueLab, "undo-stack": UndoStackLab, "browser-cache": BrowserCacheLab, elevator: ElevatorLab,
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
  password: ({ className }) => (
    <Svg className={className} bg="#fef3c7" label="Ổ khóa và mật khẩu">
      <rect x="40" y="62" width="150" height="44" rx="12" fill="#fff" stroke="#f59e0b" strokeWidth="2" />
      <text x="115" y="90" textAnchor="middle" fontSize="16" fontFamily={M} fill="#0f172a">••••••••••</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 39} y="116" width="33" height="8" rx="4" fill={["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][i]} />)}
      <rect x="215" y="72" width="70" height="62" rx="10" fill="#0f172a" /><path d="M230 72 v-14 a20 20 0 0 1 40 0 v14" fill="none" stroke="#0f172a" strokeWidth="8" />
      <circle cx="250" cy="98" r="7" fill="#fbbf24" /><rect x="247" y="100" width="6" height="16" rx="2" fill="#fbbf24" />
      <text x="115" y="48" textAnchor="middle" fontSize="11" fontFamily={M} fill="#92400e">95¹⁶ khả năng</text>
    </Svg>
  ),
  "rgb-pixel": ({ className }) => (
    <Svg className={className} bg="#0f172a" label="Ba đèn đỏ xanh lá xanh dương trộn màu">
      <circle cx="135" cy="75" r="48" fill="#ff2a2a" opacity="0.85" style={{ mixBlendMode: "screen" }} />
      <circle cx="185" cy="75" r="48" fill="#22ff55" opacity="0.85" style={{ mixBlendMode: "screen" }} />
      <circle cx="160" cy="118" r="48" fill="#3a6bff" opacity="0.85" style={{ mixBlendMode: "screen" }} />
      <text x="40" y="160" fontSize="12" fontFamily={M} fill="#94a3b8">#FF8C00</text>
      <text x="280" y="160" textAnchor="end" fontSize="12" fontFamily={M} fill="#94a3b8">24 bit</text>
    </Svg>
  ),
  "download-time": ({ className }) => (
    <Svg className={className} bg="#e0f2fe" label="Gói tin chạy từ máy chủ về máy tính">
      <rect x="30" y="50" width="60" height="80" rx="8" fill="#1e293b" />{[0, 1, 2].map((i) => <rect key={i} x="40" y={60 + i * 22} width="40" height="14" rx="3" fill="#334155" />)}
      <path d="M100 90 H220" stroke="#7dd3fc" strokeWidth="10" strokeLinecap="round" />{[0, 1, 2, 3].map((i) => <circle key={i} cx={115 + i * 30} cy="90" r="6" fill="#0284c7" />)}
      <rect x="228" y="60" width="70" height="50" rx="5" fill="#0f172a" /><rect x="234" y="66" width="58" height="38" rx="3" fill="#f0f9ff" /><rect x="240" y="88" width="46" height="7" rx="3" fill="#bae6fd" /><rect x="240" y="88" width="30" height="7" rx="3" fill="#0284c7" />
      <text x="160" y="150" textAnchor="middle" fontSize="13" fontFamily={M} fill="#0369a1">100 Mbps = 12,5 MB/s</text>
    </Svg>
  ),
  "storage-units": ({ className }) => (
    <Svg className={className} bg="#1e293b" label="Thẻ nhớ đầy dần">
      <path d="M90 30 h120 l20 20 v100 a8 8 0 0 1 -8 8 h-132 a8 8 0 0 1 -8 -8 v-112 a8 8 0 0 1 8 -8z" fill="#334155" />{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={98 + i * 20} y="38" width="12" height="20" rx="2" fill="#fbbf24" />)}
      <text x="100" y="92" fontSize="20" fontWeight="800" fill="#fff">32 GB</text>
      <rect x="96" y="112" width="124" height="20" rx="5" fill="#475569" /><rect x="96" y="112" width="40" height="20" rx="5" fill="#0ea5e9" /><rect x="136" y="112" width="30" height="20" fill="#a855f7" /><rect x="166" y="112" width="34" height="20" fill="#f97316" />
      <text x="250" y="80" fontSize="12" fontFamily={M} fill="#94a3b8">×1024</text><text x="250" y="100" fontSize="12" fontFamily={M} fill="#94a3b8">MB→GB</text>
    </Svg>
  ),
  "print-queue": ({ className }) => (
    <Svg className={className} bg="#eef2ff" label="Máy in và hàng đợi tài liệu">
      <rect x="30" y="60" width="110" height="50" rx="10" fill="#334155" /><rect x="50" y="40" width="70" height="22" rx="3" fill="#e2e8f0" /><rect x="55" y="105" width="60" height="40" rx="2" fill="#fff" stroke="#6366f1" strokeWidth="2" />
      {[["#6366f1", "Minh"], ["#f59e0b", "Lan"], ["#10b981", "Huy"], ["#ec4899", "Vy"]].map(([c, n], i) => <g key={n} transform={`translate(${160 + i * 38} ${70 + (i % 2) * 6})`}><rect width="32" height="40" rx="5" fill={c} /><text x="16" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{n}</text></g>)}
      <text x="230" y="140" textAnchor="middle" fontSize="12" fontFamily={M} fill="#4338ca">vào trước, ra trước</text>
    </Svg>
  ),
  "undo-stack": ({ className }) => (
    <Svg className={className} bg="#f5f3ff" label="Chồng thao tác hoàn tác">
      <rect x="30" y="40" width="150" height="60" rx="10" fill="#fff" stroke="#c4b5fd" /><text x="45" y="77" fontSize="18" fontFamily="serif" fill="#0f172a">Hôm nay em…</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x="210" y={130 - i * 22} width="80" height="18" rx="5" fill={i === 3 ? "#7c3aed" : "#a78bfa"} />)}
      <path d="M200 40 v110 h100 v-110" fill="none" stroke="#cbd5e1" strokeWidth="4" />
      <text x="105" y="135" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily={M} fill="#7c3aed">Ctrl+Z</text>
    </Svg>
  ),
  "browser-cache": ({ className }) => (
    <Svg className={className} bg="#ecfdf5" label="Bộ nhớ đệm giữ các trang vừa mở">
      <rect x="30" y="35" width="260" height="110" rx="12" fill="#fff" stroke="#a7f3d0" /><rect x="30" y="35" width="260" height="22" rx="12" fill="#d1fae5" />{[0, 1, 2].map((i) => <circle key={i} cx={46 + i * 12} cy="46" r="4" fill="#34d399" />)}
      {[["#0ea5e9", "🏫"], ["#f59e0b", "📅"], ["#10b981", "📖"]].map(([c, e], i) => <g key={e} transform={`translate(${56 + i * 72} 74)`}><rect width="60" height="44" rx="8" fill={c} /><text x="30" y="30" textAnchor="middle" fontSize="20">{e}</text></g>)}
      <text x="160" y="25" textAnchor="middle" fontSize="12" fontFamily={M} fill="#047857">0,1 giây thay vì 1,5 giây</text>
    </Svg>
  ),
  elevator: ({ className }) => (
    <Svg className={className} bg="#f1f5f9" label="Thang máy và người chờ ở các tầng">
      <rect x="110" y="10" width="100" height="160" fill="#e2e8f0" />{[0, 1, 2, 3, 4].map((i) => <line key={i} x1="110" x2="210" y1={42 + i * 32} y2={42 + i * 32} stroke="#94a3b8" />)}
      <rect x="140" y="76" width="40" height="30" rx="4" fill="#2563eb" /><rect x="145" y="81" width="13" height="20" fill="#93c5fd" /><rect x="162" y="81" width="13" height="20" fill="#93c5fd" />
      {[20, 116, 148].map((y) => <text key={y} x="226" y={y + 16} fontSize="16">🙋</text>)}
      <path d="M80 30 v120" stroke="#f59e0b" strokeWidth="4" /><text x="40" y="95" fontSize="12" fontFamily={M} fill="#b45309">↑↓</text>
    </Svg>
  ),
};
export function LifeArt({ slug, className }: { slug: string; className?: string }) {
  const A = ART[slug];
  return A ? <A className={className} /> : <div className={className} />;
}

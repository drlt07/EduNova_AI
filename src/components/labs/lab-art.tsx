import { ComputerArt, FarmArt, NetworkArt, TrafficArt } from "@/components/landing/sim-art";
import { PHET_ART } from "@/components/phet/phet-art";

/**
 * Ảnh xem trước cho thẻ trong Kho mô phỏng. Cùng phong cách với sim-art (SVG 320×180, vẽ bằng code),
 * mỗi hình vẽ đúng cảnh chính của mô phỏng tương ứng.
 */
type ArtProps = { className?: string };
const MONO = "ui-monospace,monospace";

function Svg({ label, bg, className, children }: ArtProps & { label: string; bg: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label}>
      <rect width="320" height="180" fill={bg} />
      {children}
    </svg>
  );
}

function BinaryArt({ className }: ArtProps) {
  const bits = [1, 0, 1, 1, 0, 0, 1, 0];
  return (
    <Svg className={className} bg="#cffafe" label="Dãy bóng đèn 8 bit và giá trị thập phân">
      {bits.map((b, i) => (
        <g key={i} transform={`translate(${34 + i * 34} 52)`}>
          <circle r="13" fill={b ? "#facc15" : "#334155"} className={b && i === 3 ? "sim-blink" : undefined} />
          {b === 1 && <circle r="19" fill="#facc15" opacity="0.25" />}
          <text y="38" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily={MONO} fill="#0f172a">{b}</text>
          <text y="54" textAnchor="middle" fontSize="8.5" fontFamily={MONO} fill="#0e7490">{2 ** (7 - i)}</text>
        </g>
      ))}
      <rect x="86" y="128" width="148" height="34" rx="8" fill="#0b1220" />
      <text x="160" y="150" textAnchor="middle" fontSize="13" fontFamily={MONO} fill="#67e8f9">10110010₂ = 178</text>
    </Svg>
  );
}

function DebugArt({ className }: ArtProps) {
  const lines = ["s = 0", "for i in range(1, n):", "    s = s + i", "print(s)"];
  return (
    <Svg className={className} bg="#fef3c7" label="Đoạn code có dòng lỗi và kính lúp">
      <rect x="22" y="22" width="206" height="136" rx="10" fill="#0b1220" />
      {lines.map((l, i) => (
        <g key={i}>
          {i === 1 && <rect x="22" y={46 + i * 26} width="206" height="22" fill="#ef4444" opacity="0.28" />}
          <text x="34" y={61 + i * 26} fontSize="9" fontFamily={MONO} fill="#64748b">{i + 1}</text>
          <text x="50" y={61 + i * 26} fontSize="11" fontFamily={MONO} fill="#e2e8f0" xmlSpace="preserve">{l}</text>
        </g>
      ))}
      <g className="sim-blink">
        <circle cx="244" cy="82" r="30" fill="#fff" opacity="0.5" stroke="#b45309" strokeWidth="7" />
        <path d="M265 104 L296 136" stroke="#b45309" strokeWidth="11" strokeLinecap="round" />
      </g>
      <rect x="236" y="140" width="72" height="22" rx="6" fill="#ef4444" />
      <text x="272" y="155" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">Lỗi dòng 2</text>
    </Svg>
  );
}

function SafetyArt({ className }: ArtProps) {
  return (
    <Svg className={className} bg="#ffe4e6" label="Hộp thư có thư lừa đảo và tấm khiên bảo vệ">
      <rect x="26" y="26" width="170" height="128" rx="10" fill="#fff" />
      <rect x="26" y="26" width="170" height="22" rx="10" fill="#fda4af" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(38 ${60 + i * 30})`}>
          <rect width="146" height="22" rx="5" fill={i === 1 ? "#fee2e2" : "#f1f5f9"} stroke={i === 1 ? "#ef4444" : "none"} />
          <circle cx="12" cy="11" r="6" fill={i === 1 ? "#ef4444" : "#94a3b8"} />
          <rect x="24" y="6" width={i === 1 ? 70 : 90} height="4" rx="2" fill="#475569" />
          <rect x="24" y="13" width="60" height="3" rx="1.5" fill="#cbd5e1" />
          {i === 1 && <text x="134" y="15" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ef4444" className="sim-blink">!</text>}
        </g>
      ))}
      <path d="M252 34 L292 48 V88 C292 116 272 134 252 146 C232 134 212 116 212 88 V48Z" fill="#e11d48" />
      <path d="M236 88 L249 101 L271 77" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OsArt({ className }: ArtProps) {
  const procs = [["chrome", 62, "#3b82f6"], ["python", 38, "#22c55e"], ["nhac.mp3", 18, "#a855f7"]] as const;
  return (
    <Svg className={className} bg="#dbeafe" label="Cửa sổ quản lí tiến trình và thư mục">
      <rect x="20" y="20" width="190" height="140" rx="10" fill="#fff" />
      <rect x="20" y="20" width="190" height="20" rx="10" fill="#1e3a8a" />
      <text x="32" y="34" fontSize="9.5" fontWeight="600" fill="#fff">Tiến trình · CPU</text>
      {procs.map(([n, p, c], i) => (
        <g key={n} transform={`translate(32 ${56 + i * 32})`}>
          <text y="0" fontSize="10" fontFamily={MONO} fill="#0f172a">{n}</text>
          <rect y="6" width="150" height="9" rx="4.5" fill="#e2e8f0" />
          <rect y="6" width={p * 1.5} height="9" rx="4.5" fill={c} className={i === 0 ? "sim-blink" : undefined} />
          <text x="166" y="14" textAnchor="end" fontSize="9" fontFamily={MONO} fill="#475569">{p}%</text>
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(230 ${30 + i * 46})`}>
          <path d="M0 6 H22 L28 12 H66 V38 H0Z" fill="#fbbf24" />
          <rect y="12" width="66" height="26" rx="3" fill="#f59e0b" />
        </g>
      ))}
    </Svg>
  );
}

function DatabaseArt({ className }: ArtProps) {
  return (
    <Svg className={className} bg="#cffafe" label="Hai bảng dữ liệu nối với nhau bằng khóa">
      {[{ x: 20, t: "HOC_SINH", c: ["ma_hs 🔑", "ho_ten", "ma_lop"] }, { x: 186, t: "LOP", c: ["ma_lop 🔑", "ten_lop", "gvcn"] }].map((tb) => (
        <g key={tb.t} transform={`translate(${tb.x} 30)`}>
          <rect width="114" height="120" rx="8" fill="#fff" />
          <rect width="114" height="24" rx="8" fill="#0891b2" />
          <text x="57" y="16" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily={MONO} fill="#fff">{tb.t}</text>
          {tb.c.map((c, i) => (
            <g key={c}>
              <rect x="8" y={32 + i * 28} width="98" height="22" rx="4" fill={c.startsWith("ma_lop") ? "#a5f3fc" : "#f1f5f9"} />
              <text x="14" y={47 + i * 28} fontSize="10" fontFamily={MONO} fill="#0f172a">{c}</text>
            </g>
          ))}
        </g>
      ))}
      <path d="M126 128 C160 128 156 72 194 72" stroke="#0891b2" strokeWidth="3" fill="none" strokeDasharray="6 5" className="sim-flow" />
    </Svg>
  );
}

function SqlArt({ className }: ArtProps) {
  return (
    <Svg className={className} bg="#fef3c7" label="Câu truy vấn SQL và bảng kết quả">
      <rect x="18" y="20" width="284" height="56" rx="10" fill="#0b1220" />
      <text x="32" y="44" fontSize="11.5" fontFamily={MONO} fill="#e2e8f0" xmlSpace="preserve"><tspan fill="#fbbf24">SELECT</tspan> ho_ten, diem <tspan fill="#fbbf24">FROM</tspan> KQ</text>
      <text x="32" y="62" fontSize="11.5" fontFamily={MONO} fill="#e2e8f0" xmlSpace="preserve"><tspan fill="#fbbf24">WHERE</tspan> diem &gt;= 8<tspan className="sim-blink">▍</tspan></text>
      <rect x="18" y="88" width="284" height="74" rx="10" fill="#fff" />
      {[["Lan", "9.0"], ["Minh", "8.5"], ["Hà", "8.0"]].map(([n, d], i) => (
        <g key={n} transform={`translate(30 ${100 + i * 20})`}>
          <rect width="260" height="16" rx="4" fill={i % 2 ? "#fffbeb" : "#fef3c7"} />
          <text x="10" y="12" fontSize="10.5" fontFamily={MONO} fill="#0f172a">{n}</text>
          <text x="250" y="12" textAnchor="end" fontSize="10.5" fontFamily={MONO} fill="#b45309">{d}</text>
        </g>
      ))}
    </Svg>
  );
}

function AiArt({ className }: ArtProps) {
  const pts: [number, number, number][] = [[40, 50, 0], [62, 70, 0], [48, 92, 0], [80, 56, 0], [70, 110, 1], [104, 128, 1], [120, 100, 1], [96, 146, 1]];
  return (
    <Svg className={className} bg="#ede9fe" label="Dữ liệu được phân thành hai nhóm và mạng nơ-ron">
      <path d="M20 132 L150 60" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="6 5" className="sim-flow" />
      {pts.map(([x, y, g], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill={g ? "#f472b6" : "#38bdf8"} />
      ))}
      {[[0, [44, 90, 136]], [1, [58, 90, 122]], [2, [90]]].map(([col, ys]) =>
        (ys as number[]).map((y) => <circle key={`${col}-${y}`} cx={200 + (col as number) * 46} cy={y} r="11" fill="#7c3aed" />),
      )}
      {[44, 90, 136].flatMap((a) => [58, 90, 122].map((b) => <path key={`${a}${b}`} d={`M211 ${a} L235 ${b}`} stroke="#a78bfa" strokeWidth="1.5" />))}
      {[58, 90, 122].map((b) => <path key={b} d={`M257 ${b} L281 90`} stroke="#a78bfa" strokeWidth="1.5" />)}
      <circle cx="292" cy="90" r="11" fill="#facc15" className="sim-blink" />
    </Svg>
  );
}

function WebArt({ className }: ArtProps) {
  return (
    <Svg className={className} bg="#cffafe" label="Mã HTML bên trái và trang web hiển thị bên phải">
      <rect x="14" y="20" width="140" height="140" rx="10" fill="#0b1220" />
      {[["<h1>", "Lớp 10A"], ["<p>", "Xin chào"], ["<img>", ""], ["<button>", "Gửi"]].map(([t, v], i) => (
        <text key={t} x="26" y={46 + i * 28} fontSize="10.5" fontFamily={MONO} fill="#e2e8f0" xmlSpace="preserve">
          <tspan fill="#f472b6">{t}</tspan>{v}
        </text>
      ))}
      <rect x="166" y="20" width="140" height="140" rx="10" fill="#fff" />
      <rect x="166" y="20" width="140" height="16" rx="8" fill="#e2e8f0" />
      {["#f87171", "#fbbf24", "#4ade80"].map((c, i) => <circle key={c} cx={176 + i * 9} cy="28" r="3" fill={c} />)}
      <text x="178" y="56" fontSize="14" fontWeight="800" fill="#0f172a">Lớp 10A</text>
      <rect x="178" y="64" width="90" height="4" rx="2" fill="#94a3b8" />
      <rect x="178" y="76" width="116" height="44" rx="6" fill="#67e8f9" />
      <path d="M186 114 L206 92 L222 108 L234 98 L286 114Z" fill="#0891b2" />
      <rect x="178" y="130" width="50" height="18" rx="6" fill="#4f7fff" className="sim-blink" />
      <text x="203" y="143" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">Gửi</text>
    </Svg>
  );
}

function CitizenArt({ className }: ArtProps) {
  const people = [[70, "#f472b6"], [160, "#38bdf8"], [250, "#facc15"]] as const;
  return (
    <Svg className={className} bg="#ffe4e6" label="Ba người dùng kết nối và cân nhắc lựa chọn">
      <path d="M70 70 L160 50 L250 70" stroke="#fb7185" strokeWidth="2.5" fill="none" strokeDasharray="6 5" className="sim-flow" />
      {people.map(([x, c]) => (
        <g key={x} transform={`translate(${x} ${x === 160 ? 50 : 70})`}>
          <circle r="22" fill="#fff" />
          <circle cy="-5" r="8" fill={c} />
          <path d="M-13 15 C-13 3 13 3 13 15" fill={c} />
        </g>
      ))}
      {/* cán cân */}
      <path d="M160 108 V164 M136 164 H184" stroke="#be123c" strokeWidth="5" strokeLinecap="round" />
      <path d="M104 114 L216 102" stroke="#be123c" strokeWidth="4" strokeLinecap="round" />
      <path d="M90 114 L104 142 L118 114Z M202 102 L216 130 L230 102Z" fill="#fda4af" />
      <text x="104" y="136" textAnchor="middle" fontSize="11" fontWeight="800" fill="#be123c">✓</text>
      <text x="216" y="124" textAnchor="middle" fontSize="11" fontWeight="800" fill="#be123c">?</text>
    </Svg>
  );
}

const ART: Record<string, React.ComponentType<ArtProps>> = {
  "smart-garden": FarmArt,
  "binary-logic": BinaryArt,
  "smart-coding-city": TrafficArt,
  "debug-detective": DebugArt,
  "digital-safety": SafetyArt,
  "inside-computer-3d": ComputerArt,
  "os-explorer": OsArt,
  "database-city": DatabaseArt,
  "sql-detective": SqlArt,
  "ai-discovery": AiArt,
  "network-journey": NetworkArt,
  "web-creator": WebArt,
  "digital-citizen": CitizenArt,
  ...PHET_ART,
};

export function LabArt({ slug, className }: { slug: string; className?: string }) {
  const Art = ART[slug];
  return Art ? <Art className={className} /> : null;
}

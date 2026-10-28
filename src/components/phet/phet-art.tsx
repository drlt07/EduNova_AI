/** Ảnh thẻ (320×180) cho các mô phỏng kiểu PhET trong thư viện tình huống mô phỏng. */
type P = { className?: string };
function Svg({ label, bg, className, children }: P & { label: string; bg: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label}>
      <rect width="320" height="180" fill={bg} />
      {children}
    </svg>
  );
}
const M = "ui-monospace,monospace";

function BinaryControlArt({ className }: P) {
  const bits = [1, 0, 1, 1, 0, 0, 1, 0];
  return (
    <Svg className={className} bg="#0f172a" label="Bảng công tắc 8 bit">
      {bits.map((b, i) => (
        <g key={i} transform={`translate(${36 + i * 35} 48)`}>
          <circle r="12" fill={b ? "#fde047" : "#334155"} />{b === 1 && <circle r="20" fill="#fde047" opacity="0.2" />}
          <rect x="-9" y="24" width="18" height="34" rx="4" fill={b ? "#10b981" : "#475569"} /><rect x="-6" y={b ? 27 : 42} width="12" height="12" rx="2" fill="#fff" />
          <text y="78" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily={M} fill="#fff">{b}</text>
        </g>
      ))}
      <text x="160" y="160" textAnchor="middle" fontSize="15" fontFamily={M} fill="#67e8f9">10110010₂ = 178</text>
    </Svg>
  );
}
function SmartHomeArt({ className }: P) {
  return (
    <Svg className={className} bg="#1e293b" label="Ngôi nhà thông minh ban đêm">
      <circle cx="270" cy="34" r="16" fill="#f1f5f9" /><circle cx="278" cy="28" r="15" fill="#1e293b" />
      <rect y="140" width="320" height="40" fill="#14532d" />
      <path d="M90 82 L160 34 L230 82 Z" fill="#b91c1c" /><rect x="100" y="82" width="120" height="58" fill="#fde68a" />
      <rect x="112" y="94" width="28" height="22" fill="#fef08a" /><rect x="180" y="94" width="28" height="22" fill="#fef08a" />
      <rect x="148" y="104" width="24" height="36" fill="#92400e" /><circle cx="160" cy="96" r="5" fill="#fde047" /><circle cx="160" cy="96" r="22" fill="#fde047" opacity="0.25" />
      <rect x="22" y="22" width="92" height="40" rx="8" fill="#0f172a" stroke="#a78bfa" /><text x="68" y="47" textAnchor="middle" fontSize="12" fontFamily={M} fill="#c4b5fd">toi and nguoi</text>
    </Svg>
  );
}
function DigitalCameraArt({ className }: P) {
  const n = 10;
  return (
    <Svg className={className} bg="#e0f2fe" label="Ảnh số vỡ thành điểm ảnh">
      {Array.from({ length: n * 6 }, (_, k) => { const x = k % n, y = Math.floor(k / n); const sky = y < 3; const sun = x > 6 && y < 2; return <rect key={k} x={30 + x * 16} y={20 + y * 16} width="16" height="16" fill={sun ? "#fbbf24" : sky ? ["#7dd3fc", "#93c5fd", "#bae6fd"][(x + y) % 3] : y < 5 ? ["#65a30d", "#4d7c0f"][(x + y) % 2] : "#2563eb"} stroke="#0f172a" strokeOpacity="0.15" />; })}
      <rect x="210" y="40" width="86" height="58" rx="10" fill="#334155" /><circle cx="253" cy="69" r="18" fill="#0f172a" stroke="#94a3b8" strokeWidth="4" /><rect x="222" y="32" width="22" height="10" rx="3" fill="#334155" />
      <text x="110" y="150" textAnchor="middle" fontSize="13" fontFamily={M} fill="#0369a1">10 × 6 × 24 bit</text>
      <path d="M200 140 q12 -20 24 0 t24 0 t24 0 t24 0" stroke="#f97316" strokeWidth="3" fill="none" />
    </Svg>
  );
}
function RobotFactoryArt({ className }: P) {
  return (
    <Svg className={className} bg="#f1f5f9" label="Cánh tay robot đặt hộp trên băng chuyền">
      <rect x="10" y="118" width="300" height="22" rx="11" fill="#334155" />
      {[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={28 + i * 54} y="90" width="30" height="28" rx="4" fill="#fbbf24" stroke="#b45309" strokeWidth="2" /><text x={43 + i * 54} y="109" textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350f">{i * 2}</text></g>)}
      <rect x="252" y="10" width="8" height="56" fill="#64748b" /><rect x="236" y="62" width="40" height="12" rx="3" fill="#2563eb" /><path d="M240 74 l6 14 M272 74 l-6 14" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <text x="20" y="166" fontSize="13" fontFamily={M} fill="#1d4ed8">for i in range(0, 10, 2):</text>
    </Svg>
  );
}
function MazeRobotArt({ className }: P) {
  const rows = ["#########", "#G......#", "#######.#", "#S......#", "#########"];
  return (
    <Svg className={className} bg="#e2e8f0" label="Robot trong mê cung">
      {rows.map((r, y) => r.split("").map((c, x) => <rect key={`${x}${y}`} x={24 + x * 30} y={14 + y * 30} width="30" height="30" fill={c === "#" ? "#334155" : (x + y) % 2 ? "#f8fafc" : "#e2e8f0"} />))}
      <rect x="62" y="52" width="16" height="16" rx="3" fill="#10b981" />
      <g transform="translate(69 119)"><rect x="-11" y="-10" width="22" height="20" rx="5" fill="#2563eb" /><path d="M11 -5 L17 0 L11 5 Z" fill="#fbbf24" /></g>
      <path d="M84 119 H234 V59 H84" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 5" fill="none" />
      <text x="24" y="172" fontSize="12" fontFamily={M} fill="#1e293b">while not o_dich():</text>
    </Svg>
  );
}
function SoftwareArt({ className }: P) {
  return (
    <Svg className={className} bg="#f8fafc" label="Bản đồ phần mềm">
      <rect x="20" y="16" width="140" height="74" fill="#d1fae5" /><rect x="160" y="16" width="140" height="74" fill="#e0f2fe" /><rect x="20" y="90" width="140" height="74" fill="#fef3c7" /><rect x="160" y="90" width="140" height="74" fill="#ede9fe" />
      {[["LibreOffice", 40, 44], ["GIMP", 90, 70], ["Google Docs", 196, 120], ["Canva", 230, 146], ["Photoshop", 50, 132]].map(([t, x, y]) => <g key={t as string}><rect x={(x as number) - 6} y={(y as number) - 14} width={(t as string).length * 7 + 12} height="20" rx="6" fill="#fff" stroke="#cbd5e1" /><text x={x as number} y={(y as number) + 1} fontSize="11" fontWeight="700" fill="#0f172a">{t}</text></g>)}
      <text x="26" y="30" fontSize="10" fontWeight="800" fill="#047857">NGUỒN MỞ</text><text x="234" y="30" fontSize="10" fontWeight="800" fill="#0369a1">INTERNET</text>
    </Svg>
  );
}
function DeviceArt({ className }: P) {
  return (
    <Svg className={className} bg="#0f172a" label="Mặt sau máy tính và các cổng">
      <rect x="30" y="50" width="260" height="80" rx="10" fill="#1f2937" />
      <rect x="50" y="72" width="26" height="11" fill="#1e40af" /><rect x="50" y="94" width="26" height="11" fill="#1e40af" />
      <rect x="96" y="80" width="20" height="10" rx="3" fill="#94a3b8" /><rect x="134" y="76" width="36" height="15" rx="3" fill="#475569" stroke="#94a3b8" />
      <rect x="190" y="70" width="26" height="24" fill="#a16207" /><circle cx="244" cy="78" r="7" fill="#16a34a" /><circle cx="244" cy="102" r="7" fill="#db2777" />
      <path d="M152 91 C152 140 120 150 90 160" stroke="#64748b" strokeWidth="6" fill="none" /><rect x="60" y="150" width="34" height="22" rx="3" fill="#e2e8f0" />
      <text x="160" y="34" textAnchor="middle" fontSize="13" fill="#cbd5e1">USB · HDMI · LAN · 3,5 mm</text>
    </Svg>
  );
}
function CloudArt({ className }: P) {
  return (
    <Svg className={className} bg="#e0f2fe" label="Đám mây đồng bộ thiết bị">
      <path d="M100 80 a30 30 0 0 1 24 -46 a42 42 0 0 1 76 0 a30 30 0 0 1 36 46 Z" fill="#fff" stroke="#38bdf8" strokeWidth="3" />
      <rect x="146" y="44" width="34" height="28" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
      {[[50, 140], [160, 150], [270, 140]].map(([x, y], i) => <g key={i}><line x1="163" y1="82" x2={x} y2={y - 16} stroke="#22c55e" strokeWidth="3" /><rect x={x - 26} y={y - 16} width="52" height="32" rx="6" fill="#fff" stroke="#94a3b8" /><text x={x} y={y + 5} textAnchor="middle" fontSize="16">{["💻", "📱", "🖥️"][i]}</text></g>)}
    </Svg>
  );
}
function NetworkBuilderArt({ className }: P) {
  return (
    <Svg className={className} bg="#f5f3ff" label="Sơ đồ mạng trường học">
      {[60, 160, 260].map((x, i) => <g key={x}><line x1={x} y1="62" x2="160" y2="118" stroke="#22c55e" strokeWidth="3" /><rect x={x - 32} y="40" width="64" height="24" rx="6" fill={["#2563eb", "#0891b2", "#2563eb"][i]} /><text x={x} y="56" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{["Switch", "Wi-Fi AP", "Switch"][i]}</text>{[0, 1, 2].map((k) => <rect key={k} x={x - 26 + k * 18} y="14" width="14" height="10" rx="2" fill="#475569" />)}</g>)}
      <rect x="126" y="112" width="68" height="26" rx="6" fill="#7c3aed" /><text x="160" y="129" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Router</text>
      <line x1="194" y1="125" x2="240" y2="152" stroke="#22c55e" strokeWidth="3" /><rect x="236" y="144" width="56" height="22" rx="6" fill="#ea580c" /><text x="264" y="159" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">Modem</text>
    </Svg>
  );
}
function CssBoxArt({ className }: P) {
  return (
    <Svg className={className} bg="#fff7ed" label="Mô hình hộp CSS">
      <rect x="40" y="20" width="240" height="140" fill="#fed7aa" /><rect x="62" y="38" width="196" height="104" fill="#f59e0b" /><rect x="70" y="46" width="180" height="88" fill="#bbf7d0" /><rect x="96" y="66" width="128" height="48" fill="#93c5fd" />
      <text x="160" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e3a8a">content</text>
      <text x="46" y="34" fontSize="10" fill="#9a3412">margin</text><text x="74" y="59" fontSize="10" fill="#166534">padding</text><text x="196" y="35" fontSize="10" fill="#78350f">border</text>
    </Svg>
  );
}
function WebNavArt({ className }: P) {
  return (
    <Svg className={className} bg="#fff1f2" label="Sơ đồ liên kết các trang web">
      {[[160, 34, "index"], [70, 92, "gioi-thieu"], [250, 92, "lien-he"], [120, 150, "10a1"], [210, 150, "10a2"]].map(([x, y, t]) => <g key={t as string}><rect x={(x as number) - 40} y={(y as number) - 14} width="80" height="28" rx="8" fill="#fff" stroke="#94a3b8" /><text x={x as number} y={(y as number) + 4} textAnchor="middle" fontSize="11" fontFamily={M} fill="#0f172a">{t}.html</text></g>)}
      <path d="M140 48 L90 78 M180 48 L230 78 M150 48 L124 136 M160 150 L170 150" stroke="#64748b" strokeWidth="2" />
      <path d="M200 136 L170 48" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 4" /><circle cx="186" cy="92" r="9" fill="#ef4444" /><text x="186" y="96" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">404</text>
    </Svg>
  );
}

function InfoProcessorArt({ className }: P) {
  return (
    <Svg className={className} bg="#0f172a" label="Bốn bước xử lí thông tin">
      {["Thu nhận", "Lưu trữ", "Xử lí", "Xuất"].map((t, i) => <g key={t} transform={`translate(${22 + i * 75} 62)`}><rect width="62" height="54" rx="12" fill={i === 3 ? "#f59e0b" : "#0e7490"} /><text x="31" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{t}</text>{i < 3 && <path d="M64 27 L74 27" stroke="#67e8f9" strokeWidth="3" />}</g>)}
      <text x="160" y="40" textAnchor="middle" fontSize="12" fontFamily={M} fill="#94a3b8">31°C · 85% · mây 70%</text>
      <text x="160" y="150" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fde68a">“Chiều nay có thể mưa”</text>
    </Svg>
  );
}
function TextEncodingArt({ className }: P) {
  const cs: [string, string][] = [["T", "54"], ["i", "69"], ["n", "6E"], ["ệ", "E1 BB 87"]];
  return (
    <Svg className={className} bg="#f5f3ff" label="Kí tự thành mã và byte">
      {cs.map(([c, h], i) => <g key={c} transform={`translate(${24 + i * 72} 40)`}><rect width="60" height="96" rx="10" fill="#fff" stroke="#a78bfa" strokeWidth="2" /><text x="30" y="40" textAnchor="middle" fontSize="28" fontWeight="800" fill="#1e1b4b">{c}</text><text x="30" y="70" textAnchor="middle" fontSize="9" fontFamily={M} fill="#7c3aed">{h}</text><text x="30" y="86" textAnchor="middle" fontSize="9" fill="#64748b">{h.split(" ").length} byte</text></g>)}
      <text x="160" y="160" textAnchor="middle" fontSize="12" fontFamily={M} fill="#6d28d9">UTF-8</text>
    </Svg>
  );
}
function VariableBoxesArt({ className }: P) {
  return (
    <Svg className={className} bg="#0b1220" label="Hộp biến">
      <text x="20" y="34" fontSize="13" fontFamily={M} fill="#e2e8f0">a = 5</text><text x="20" y="54" fontSize="13" fontFamily={M} fill="#e2e8f0">b = a</text><text x="20" y="74" fontSize="13" fontFamily={M} fill="#67e8f9">a = a + 3</text>
      {[["a", "8", true], ["b", "5", false]].map(([n, v, hi], i) => <g key={n as string} transform={`translate(${150 + i * 82} 54)`}><rect x="12" y="-18" width="40" height="18" rx="4" fill="#334155" /><text x="32" y="-5" textAnchor="middle" fontSize="12" fontFamily={M} fontWeight="700" fill="#fff">{n}</text><rect width="64" height="56" rx="10" fill="#fff" stroke={hi ? "#fbbf24" : "#cbd5e1"} strokeWidth="4" /><text x="32" y="37" textAnchor="middle" fontSize="24" fontFamily={M} fontWeight="800" fill="#0f172a">{v}</text></g>)}
    </Svg>
  );
}
function ListArt({ className }: P) {
  return (
    <Svg className={className} bg="#1e293b" label="Đoàn toa danh sách">
      <rect x="14" y="72" width="34" height="50" rx="12" fill="#f43f5e" />
      {["Toán", "Văn", "Tin", "Anh"].map((t, i) => <g key={t} transform={`translate(${54 + i * 64} 72)`}><text x="28" y="-8" textAnchor="middle" fontSize="12" fontFamily={M} fontWeight="700" fill="#67e8f9">{i}</text><rect width="58" height="46" rx="8" fill={i === 2 ? "#fcd34d" : "#3b82f6"} /><text x="29" y="29" textAnchor="middle" fontSize="13" fontWeight="700" fill={i === 2 ? "#0f172a" : "#fff"}>{t}</text><circle cx="14" cy="54" r="5" fill="#64748b" /><circle cx="44" cy="54" r="5" fill="#64748b" /><text x="28" y="76" textAnchor="middle" fontSize="10" fontFamily={M} fill="#f9a8d4">{i - 4}</text></g>)}
    </Svg>
  );
}
function StringArt({ className }: P) {
  return (
    <Svg className={className} bg="#0f172a" label="Cắt xâu kí tự">
      {[..."PYTHON"].map((c, i) => <g key={i} transform={`translate(${42 + i * 40} 60)`}><text x="17" y="-8" textAnchor="middle" fontSize="11" fontFamily={M} fill="#67e8f9">{i}</text><rect width="34" height="40" rx="6" fill={i >= 1 && i < 4 ? "#fcd34d" : "#1e293b"} stroke={i === 4 ? "#fb7185" : "#475569"} strokeDasharray={i === 4 ? "4 3" : undefined} strokeWidth="2" /><text x="17" y="27" textAnchor="middle" fontSize="18" fontFamily={M} fontWeight="800" fill={i >= 1 && i < 4 ? "#0f172a" : "#e2e8f0"}>{c}</text></g>)}
      <text x="160" y="150" textAnchor="middle" fontSize="14" fontFamily={M} fill="#86efac">{"s[1:4] → 'YTH'"}</text>
    </Svg>
  );
}
function FunctionArt({ className }: P) {
  return (
    <Svg className={className} bg="#0b1220" label="Cỗ máy hàm">
      <circle cx="140" cy="22" r="12" fill="#fcd34d" /><circle cx="180" cy="22" r="12" fill="#fcd34d" /><text x="140" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">3</text><text x="180" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">5</text>
      <rect x="90" y="44" width="140" height="74" rx="16" fill="#334155" stroke="#64748b" strokeWidth="3" /><text x="160" y="72" textAnchor="middle" fontSize="12" fontFamily={M} fill="#67e8f9">def tong(a, b):</text><text x="160" y="94" textAnchor="middle" fontSize="12" fontFamily={M} fill="#e2e8f0">return a + b</text>
      <rect x="130" y="132" width="60" height="34" rx="10" fill="#065f46" stroke="#34d399" strokeWidth="3" /><text x="160" y="155" textAnchor="middle" fontSize="16" fontFamily={M} fontWeight="800" fill="#fff">8</text>
    </Svg>
  );
}

export const PHET_ART: Record<string, React.ComponentType<P>> = {
  "binary-control": BinaryControlArt,
  "smart-home": SmartHomeArt,
  "digital-camera": DigitalCameraArt,
  "robot-factory": RobotFactoryArt,
  "maze-robot": MazeRobotArt,
  "software-ecosystem": SoftwareArt,
  "device-connection": DeviceArt,
  "cloud-sharing": CloudArt,
  "network-builder": NetworkBuilderArt,
  "css-box": CssBoxArt,
  "web-navigation": WebNavArt,
  "info-processor": InfoProcessorArt,
  "text-encoding": TextEncodingArt,
  "variable-boxes": VariableBoxesArt,
  "list-lab": ListArt,
  "string-lab": StringArt,
  "function-machine": FunctionArt,
};

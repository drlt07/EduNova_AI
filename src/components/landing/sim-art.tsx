/**
 * Minh họa SVG cho thẻ mô phỏng ở trang chủ. Vẽ bằng code (không tải ảnh) để nhẹ và rõ ở cả giao diện sáng/tối;
 * mỗi hình mô tả đúng cảnh trong mô phỏng tương ứng, không vẽ chức năng chưa có.
 */
type ArtProps = { className?: string };

export function TrafficArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="Giao lộ có đèn tín hiệu và ô tô">
      <rect width="320" height="180" fill="#cfe9ff" />
      <rect y="120" width="320" height="60" fill="#9cc98a" />
      <path d="M0 120 L320 120 L320 180 L0 180Z" fill="#8fbf7c" />
      {/* đường */}
      <path d="M-20 150 L340 90 L340 120 L-20 180Z" fill="#475569" />
      <path d="M130 60 L190 60 L230 180 L150 180Z" fill="#475569" />
      <path d="M-20 165 L340 105" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 8" />
      <path d="M160 60 L190 180" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 8" />
      {/* nhà & cây */}
      <rect x="24" y="62" width="44" height="52" rx="4" fill="#fde68a" />
      <rect x="24" y="54" width="44" height="10" rx="3" fill="#f59e0b" />
      <rect x="236" y="40" width="54" height="60" rx="4" fill="#c7d2fe" />
      <rect x="236" y="32" width="54" height="10" rx="3" fill="#6366f1" />
      {[34, 50].map((x) => <rect key={x} x={x} y="74" width="10" height="10" rx="2" fill="#fff" opacity="0.8" />)}
      {[246, 262, 278].map((x) => <rect key={x} x={x} y="52" width="8" height="8" rx="2" fill="#fff" opacity="0.8" />)}
      <circle cx="96" cy="96" r="12" fill="#22c55e" />
      <circle cx="214" cy="94" r="10" fill="#16a34a" />
      {/* đèn tín hiệu */}
      <rect x="118" y="70" width="3" height="40" fill="#1e293b" />
      <rect x="112" y="52" width="15" height="34" rx="4" fill="#0f172a" />
      <circle cx="119.5" cy="60" r="4" fill="#ff3b30" className="sim-blink" />
      <circle cx="119.5" cy="69" r="4" fill="#3f3f46" />
      <circle cx="119.5" cy="78" r="4" fill="#3f3f46" />
      {/* xe */}
      <g className="sim-drive">
        <rect x="40" y="140" width="34" height="16" rx="5" fill="#ef4444" transform="rotate(-9 57 148)" />
        <rect x="47" y="136" width="18" height="9" rx="3" fill="#fecaca" transform="rotate(-9 56 140)" />
      </g>
      <rect x="168" y="120" width="16" height="30" rx="5" fill="#3b82f6" transform="rotate(-18 176 135)" />
      <rect x="255" y="102" width="32" height="15" rx="5" fill="#f59e0b" transform="rotate(-9 271 110)" />
    </svg>
  );
}

export function FarmArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="Luống cây, cảm biến độ ẩm và máy bơm">
      <rect width="320" height="180" fill="#e0f2fe" />
      <circle cx="270" cy="34" r="16" fill="#fcd34d" />
      <rect y="112" width="320" height="68" fill="#a16207" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${70 + i * 70} 0)`}>
          <rect x="-22" y="112" width="44" height="10" rx="5" fill="#854d0e" />
          <path d="M0 112 V82" stroke="#15803d" strokeWidth="4" />
          <ellipse cx="-11" cy="88" rx="12" ry="6" fill="#22c55e" transform="rotate(-25 -11 88)" />
          <ellipse cx="11" cy="80" rx="12" ry="6" fill="#16a34a" transform="rotate(25 11 80)" />
        </g>
      ))}
      {/* bình nước + ống + bơm */}
      <rect x="14" y="48" width="30" height="58" rx="5" fill="#0f172a" />
      <rect x="18" y="66" width="22" height="36" rx="3" fill="#38bdf8" />
      <path d="M44 96 H250" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 5" className="sim-flow" />
      {/* cảm biến */}
      <rect x="252" y="76" width="44" height="22" rx="5" fill="#0f172a" />
      <text x="274" y="91" textAnchor="middle" fontSize="11" fontFamily="ui-monospace,monospace" fill="#67e8f9">32%</text>
      <path d="M266 98 V124 M282 98 V124" stroke="#94a3b8" strokeWidth="2" />
      <rect x="20" y="134" width="120" height="28" rx="6" fill="#0b1220" opacity="0.85" />
      <text x="30" y="152" fontSize="10.5" fontFamily="ui-monospace,monospace" fill="#e2e8f0" xmlSpace="preserve"><tspan fill="#c4b5fd">if</tspan> do_am &lt; 40:</text>
    </svg>
  );
}

export function ComputerArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="Linh kiện bên trong máy tính">
      <rect width="320" height="180" fill="#ede9fe" />
      <rect x="70" y="20" width="180" height="140" rx="10" fill="#1e1b4b" />
      <rect x="82" y="32" width="156" height="116" rx="6" fill="#312e81" />
      {/* bo mạch, CPU, RAM, ổ cứng, nguồn */}
      <rect x="92" y="42" width="100" height="70" rx="4" fill="#065f46" />
      <rect x="120" y="58" width="30" height="30" rx="3" fill="#cbd5e1" />
      <rect x="126" y="64" width="18" height="18" rx="2" fill="#64748b" />
      {[0, 1, 2].map((i) => <rect key={i} x={162 + i * 8} y="50" width="4" height="50" rx="1" fill="#a78bfa" />)}
      <rect x="198" y="42" width="30" height="40" rx="3" fill="#94a3b8" />
      <rect x="92" y="118" width="70" height="22" rx="3" fill="#475569" />
      <rect x="170" y="118" width="58" height="22" rx="3" fill="#0f172a" />
      <circle cx="199" cy="129" r="7" fill="#334155" />
    </svg>
  );
}

export function NetworkArt({ className }: ArtProps) {
  const nodes = [
    [60, 50], [60, 130], [160, 90], [260, 50], [260, 130],
  ] as const;
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="Các thiết bị mạng nối với nhau">
      <rect width="320" height="180" fill="#ecfeff" />
      {[[0, 2], [1, 2], [2, 3], [2, 4]].map(([a, b]) => (
        <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#0891b2" strokeWidth="3" strokeDasharray={b === 4 ? "4 6" : undefined} />
      ))}
      {nodes.map(([x, y], i) =>
        i === 2 ? (
          <g key={i}>
            <rect x={x - 22} y={y - 14} width="44" height="28" rx="6" fill="#0e7490" />
            {[0, 1, 2, 3].map((k) => <circle key={k} cx={x - 12 + k * 8} cy={y + 4} r="2" fill="#a5f3fc" />)}
          </g>
        ) : (
          <g key={i}>
            <rect x={x - 18} y={y - 14} width="36" height="24" rx="3" fill="#164e63" />
            <rect x={x - 14} y={y - 10} width="28" height="16" rx="2" fill="#67e8f9" />
            <rect x={x - 6} y={y + 10} width="12" height="4" fill="#164e63" />
          </g>
        ),
      )}
      <circle cx="232" cy="118" r="7" fill="#ef4444" />
      <path d="M229 115 L235 121 M235 115 L229 121" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

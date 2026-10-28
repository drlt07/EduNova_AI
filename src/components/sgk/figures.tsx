import type { FigureId } from "@/lib/sgk/types";

const S = { stroke: "var(--fg)", strokeOpacity: 0.55, strokeWidth: 1.5, fill: "none" } as const;
const box = (x: number, y: number, w: number, h: number, fill: string, label: string, sub?: string) => (
  <g key={`${x}-${y}-${label}`}>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} fillOpacity={0.18} stroke={fill} strokeWidth={1.5} />
    <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 5)} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--fg)">{label}</text>
    {sub && <text x={x + w / 2} y={y + h / 2 + 15} textAnchor="middle" fontSize={11} fill="var(--muted)">{sub}</text>}
  </g>
);
const arrow = (x1: number, y1: number, x2: number, y2: number, k: string) => (
  <g key={k}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} {...S} markerEnd="url(#fig-arrow)" />
  </g>
);
const C = { cyan: "var(--cyan)", blue: "var(--blue)", violet: "var(--violet)", green: "var(--success)", amber: "var(--warning)", red: "var(--danger)" };

function Body({ id }: { id: FigureId }) {
  switch (id) {
    case "ipo":
      return <>{box(20, 60, 130, 60, C.cyan, "Nhập", "bàn phím, cảm biến")}{box(215, 60, 130, 60, C.blue, "Xử lí", "CPU + chương trình")}{box(410, 60, 130, 60, C.violet, "Xuất", "màn hình, loa, bơm")}{box(215, 150, 130, 44, C.amber, "Lưu trữ")}{arrow(150, 90, 213, 90, "a")}{arrow(345, 90, 408, 90, "b")}{arrow(280, 120, 280, 148, "c")}</>;
    case "binary-place":
      return <>{[16, 8, 4, 2, 1].map((v, i) => <g key={v}>{box(40 + i * 100, 40, 80, 50, [1, 0, 1, 1, 0][i] ? C.cyan : C.blue, String([1, 0, 1, 1, 0][i]), `giá trị ${v}`)}</g>)}<text x={280} y={140} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">10110₂ = 16 + 4 + 2 = 22</text></>;
    case "logic-gates":
      return <>{[["AND", C.cyan, "1 khi cả hai là 1"], ["OR", C.blue, "1 khi ít nhất một là 1"], ["NOT", C.violet, "đảo 0 ↔ 1"]].map(([l, c, d], i) => <g key={l}>{box(30 + i * 180, 50, 150, 70, c, l, d)}</g>)}</>;
    case "if-flow":
      return <><polygon points="280,20 380,70 280,120 180,70" fill={C.amber} fillOpacity={0.18} stroke={C.amber} strokeWidth={1.5} /><text x={280} y={75} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--fg)">do_am &lt; 40 ?</text>{box(40, 150, 150, 46, C.green, "Bật bơm", "nhánh if")}{box(370, 150, 150, 46, C.red, "Tắt bơm", "nhánh else")}{arrow(200, 80, 130, 148, "a")}{arrow(360, 80, 440, 148, "b")}<text x={140} y={110} fontSize={12} fill="var(--success-fg)" fontWeight={700}>Đúng</text><text x={410} y={110} fontSize={12} fill="var(--danger-fg)" fontWeight={700}>Sai</text></>;
    case "loop-flow":
      return <>{box(40, 70, 140, 50, C.cyan, "i = 1, 2, …, n")}{box(240, 70, 160, 50, C.blue, "khối lệnh lặp", "tong = tong + i")}{box(450, 70, 90, 50, C.violet, "hết", "in kết quả")}{arrow(180, 95, 238, 95, "a")}<path d="M320 120 Q320 165 110 165 Q60 165 90 122" {...S} markerEnd="url(#fig-arrow)" /><text x={210} y={182} fontSize={11} fill="var(--muted)">lặp lại với giá trị tiếp theo</text>{arrow(400, 95, 448, 95, "b")}</>;
    case "function-box":
      return <>{box(30, 70, 120, 50, C.cyan, "r = 2", "tham số")}{box(210, 50, 160, 90, C.blue, "dien_tich_tron", "3.14 * r * r")}{box(430, 70, 110, 50, C.green, "12.56", "return")}{arrow(150, 95, 208, 95, "a")}{arrow(370, 95, 428, 95, "b")}</>;
    case "bug-kinds":
      return <>{box(20, 60, 160, 70, C.red, "Lỗi cú pháp", "không chạy được")}{box(200, 60, 160, 70, C.amber, "Lỗi khi chạy", "dừng giữa chừng")}{box(380, 60, 160, 70, C.violet, "Lỗi logic", "chạy hết, sai kết quả")}</>;
    case "computer-parts":
      return <><rect x={20} y={20} width={520} height={170} rx={14} fill={C.green} fillOpacity={0.08} stroke={C.green} strokeWidth={1.5} /><text x={36} y={42} fontSize={12} fill="var(--muted)">Bo mạch chủ</text>{box(50, 60, 110, 60, C.cyan, "CPU", "xử lí")}{box(200, 60, 110, 60, C.blue, "RAM", "đang dùng")}{box(350, 60, 160, 60, C.violet, "SSD / HDD", "lưu lâu dài")}{box(200, 140, 110, 40, C.amber, "Nguồn")}{arrow(160, 90, 198, 90, "a")}{arrow(310, 90, 348, 90, "b")}</>;
    case "os-layers":
      return <>{box(80, 20, 400, 44, C.cyan, "Người dùng")}{box(80, 72, 400, 44, C.blue, "Phần mềm ứng dụng", "trình duyệt, Word, game")}{box(80, 124, 400, 44, C.violet, "Hệ điều hành", "tệp · bộ nhớ · tiến trình · thiết bị")}{box(80, 176, 400, 30, C.amber, "Phần cứng")}</>;
    case "db-table":
      return <>{["MaHS 🔑", "HoTen", "Lop"].map((h, i) => <g key={h}><rect x={60 + i * 150} y={30} width={150} height={34} fill={i === 0 ? C.amber : C.blue} fillOpacity={0.25} stroke="var(--line)" /><text x={135 + i * 150} y={52} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--fg)">{h}</text></g>)}{[["HS07", "Nguyễn Văn An", "11A2"], ["HS12", "Nguyễn Văn An", "11A5"], ["HS15", "Trần Thu Hà", "11A2"]].map((r, j) => r.map((c, i) => <g key={`${j}${i}`}><rect x={60 + i * 150} y={64 + j * 32} width={150} height={32} fill="var(--surface)" stroke="var(--line)" /><text x={135 + i * 150} y={85 + j * 32} textAnchor="middle" fontSize={12} fill="var(--fg)">{c}</text></g>))}<text x={60} y={185} fontSize={11} fill="var(--muted)">Hai bạn trùng tên vẫn phân biệt được nhờ khóa chính MaHS.</text></>;
    case "lan":
      return <>{[0, 1, 2, 3].map((i) => <g key={i}>{box(20 + i * 110, 140, 90, 44, C.cyan, `Máy ${i + 1}`)}{arrow(65 + i * 110, 138, 250, 98, `l${i}`)}</g>)}{box(200, 60, 110, 38, C.blue, "Switch")}{box(370, 60, 100, 38, C.violet, "Router")}{box(370, 10, 160, 36, C.amber, "Internet")}{arrow(310, 79, 368, 79, "r")}{arrow(430, 58, 440, 48, "i")}</>;
    case "packet-layers":
      return <>{[0, 1, 2].map((i) => <g key={i}><rect x={40 + i * 170} y={60} width={150} height={60} rx={8} fill={C.blue} fillOpacity={0.15} stroke={C.blue} /><rect x={40 + i * 170} y={60} width={150} height={20} rx={8} fill={C.amber} fillOpacity={0.35} /><text x={115 + i * 170} y={75} textAnchor="middle" fontSize={10} fill="var(--fg)">IP nguồn → IP đích</text><text x={115 + i * 170} y={103} textAnchor="middle" fontSize={12} fill="var(--fg)">gói {i + 1}/3</text></g>)}<text x={280} y={150} textAnchor="middle" fontSize={12} fill="var(--muted)">TCP ghép lại đúng thứ tự ở máy nhận</text></>;
    case "ai-learn":
      return <>{box(20, 60, 150, 70, C.cyan, "Dữ liệu có nhãn", "ảnh xoài + chín/xanh")}{box(215, 60, 130, 70, C.blue, "Huấn luyện", "tìm quy luật")}{box(390, 60, 150, 70, C.violet, "Mô hình", "dự đoán ảnh mới")}{arrow(170, 95, 213, 95, "a")}{arrow(345, 95, 388, 95, "b")}</>;
    case "html-tree":
      return <>{box(230, 10, 100, 34, C.violet, "html")}{box(110, 70, 100, 34, C.blue, "head")}{box(350, 70, 100, 34, C.blue, "body")}{box(110, 130, 100, 34, C.cyan, "title")}{["h1", "p", "a"].map((t, i) => <g key={t}>{box(280 + i * 80, 130, 64, 34, C.cyan, t)}{arrow(400, 104, 312 + i * 80, 128, `b${t}`)}</g>)}{arrow(280, 44, 160, 68, "h")}{arrow(280, 44, 400, 68, "bo")}{arrow(160, 104, 160, 128, "t")}</>;
    case "css-rule":
      return <><rect x={40} y={50} width={480} height={80} rx={12} fill="#0b1220" /><text x={60} y={98} fontSize={18} fontFamily="monospace" fill="#67e8f9">h1</text><text x={95} y={98} fontSize={18} fontFamily="monospace" fill="#e2e8f0">{"{ "}</text><text x={125} y={98} fontSize={18} fontFamily="monospace" fill="#fbbf24">color</text><text x={185} y={98} fontSize={18} fontFamily="monospace" fill="#e2e8f0">:</text><text x={200} y={98} fontSize={18} fontFamily="monospace" fill="#86efac">#0e7490</text><text x={290} y={98} fontSize={18} fontFamily="monospace" fill="#e2e8f0">{"; }"}</text><text x={60} y={160} fontSize={12} fill="var(--cyan-fg)">bộ chọn</text><text x={150} y={160} fontSize={12} fill="var(--warning-fg)">thuộc tính</text><text x={210} y={40} fontSize={12} fill="var(--success-fg)">giá trị</text></>;
    case "variable-box":
      return <>{[["diem", "8", C.cyan], ["ten", "'Lan'", C.violet], ["dtb", "7.5", C.blue]].map(([n, v, c], i) => <g key={n}><rect x={50 + i * 170} y={60} width={130} height={80} rx={10} fill={c} fillOpacity={0.15} stroke={c} strokeWidth={1.5} /><text x={115 + i * 170} y={50} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--fg)">{n}</text><text x={115 + i * 170} y={108} textAnchor="middle" fontSize={20} fontFamily="monospace" fill="var(--fg)">{v}</text></g>)}</>;
  }
}

/** Hình minh họa trong SGK số, có chú thích. */
export function Figure({ id, caption }: { id: FigureId; caption: string }) {
  return (
    <figure className="my-4 overflow-hidden rounded-2xl border border-line bg-surface-2/40 p-3">
      <svg viewBox="0 0 560 210" className="w-full" role="img" aria-label={caption}>
        <defs><marker id="fig-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--fg)" fillOpacity={0.55} /></marker></defs>
        <Body id={id} />
      </svg>
      <figcaption className="mt-1 text-center text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

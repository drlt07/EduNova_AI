"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Droplets } from "lucide-react";
import { runPython } from "@/lib/py/interpreter";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/form";

const OPS = ["<", "<="] as const;

/** Quan sát trực quan câu lệnh if: kết quả lấy từ việc chạy chương trình thật bằng trình thông dịch. */
export function IfVisualizer() {
  const [humidity, setHumidity] = useState(35);
  const [hasWater, setHasWater] = useState(true);
  const [op, setOp] = useState<(typeof OPS)[number]>("<");
  const code = `if humidity ${op} 40 and has_water:\n    pump_on()\nelse:\n    pump_off()`;
  const r = runPython(code, { globals: { humidity: { k: "int", v: humidity }, has_water: hasWater }, hooks: ["pump_on", "pump_off"], trace: true });
  const on = r.events.some((e) => e.name === "pump_on");
  const executed = new Set(r.trace.map((t) => t.line));
  const c1 = op === "<" ? humidity < 40 : humidity <= 40;
  const lines = code.split("\n");
  return (
    <div className="grid gap-5 rounded-2xl border border-line bg-surface-2 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-4">
        <div>
          <Label htmlFor="viz-h">Độ ẩm đất: <b className="font-mono">{humidity}%</b></Label>
          <input id="viz-h" type="range" min={0} max={100} value={humidity} onChange={(e) => setHumidity(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-fg"><input type="checkbox" checked={hasWater} onChange={(e) => setHasWater(e.target.checked)} className="accent-[var(--cyan)]" /> Bình còn nước (has_water)</label>
          <div role="group" aria-label="Phép so sánh" className="flex gap-1">
            {OPS.map((o) => <button key={o} type="button" aria-pressed={op === o} onClick={() => setOp(o)} className={cn("rounded-lg border px-2.5 py-1 font-mono", op === o ? "border-cyan/60 bg-cyan/10 text-fg" : "border-line text-muted")}>{o}</button>)}
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-[#0B1220] py-2 font-mono text-[13px] leading-7 text-slate-200" aria-label="Chương trình đang chạy">
          {lines.map((l, i) => (
            <motion.div key={i} animate={{ backgroundColor: executed.has(i + 1) ? "rgba(34,211,238,0.18)" : "rgba(0,0,0,0)", opacity: executed.has(i + 1) ? 1 : 0.45 }} className="px-3">
              <span className="mr-3 inline-block w-4 text-right text-slate-500">{i + 1}</span>{l}
            </motion.div>
          ))}
        </pre>
        <ol className="space-y-1 text-sm" aria-live="polite">
          <li className="text-fg">humidity {op} 40 → <b className={c1 ? "text-success-fg" : "text-danger-fg"}>{String(c1 ? "True" : "False")}</b></li>
          <li className="text-fg">has_water → <b className={hasWater ? "text-success-fg" : "text-danger-fg"}>{hasWater ? "True" : "False"}</b></li>
          <li className="text-fg">Cả điều kiện (and) → <b className={on ? "text-success-fg" : "text-danger-fg"}>{on ? "True" : "False"}</b>, chạy nhánh <b>{on ? "if" : "else"}</b></li>
        </ol>
        {humidity === 40 && <p className="rounded-lg bg-warning/15 p-2 text-sm text-fg">Đây là giá trị biên! Thử đổi giữa &lt; và &lt;= để thấy kết quả khác nhau.</p>}
      </div>
      <div className="flex flex-col items-center justify-center gap-3" aria-hidden>
        <svg viewBox="0 0 160 160" className="w-full max-w-[200px]">
          <rect x="10" y="110" width="140" height="40" rx="8" fill={humidity < 40 ? "#a16207" : "#4d7c0f"} opacity={0.8} />
          {[40, 80, 120].map((x) => (
            <motion.g key={x} animate={{ rotate: humidity < 25 ? 18 : 0 }} style={{ originX: `${x}px`, originY: "110px" }}>
              <line x1={x} y1="110" x2={x} y2="78" stroke="#16a34a" strokeWidth="4" />
              <ellipse cx={x - 8} cy="84" rx="9" ry="5" fill="#22c55e" />
              <ellipse cx={x + 8} cy="78" rx="9" ry="5" fill="#22c55e" />
            </motion.g>
          ))}
          <rect x="112" y="18" width="34" height="46" rx="6" fill="none" stroke="#64748b" strokeWidth="3" />
          <motion.rect x="115" width="28" rx="4" fill="#38bdf8" animate={{ y: hasWater ? 30 : 58, height: hasWater ? 31 : 3 }} />
          {on && [0, 1, 2, 3].map((i) => (
            <motion.circle key={i} cx={60 + i * 12} r="3" fill="#38bdf8" initial={{ cy: 30, opacity: 1 }} animate={{ cy: 105, opacity: 0 }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }} />
          ))}
          <rect x="40" y="20" width="70" height="8" rx="4" fill="#94a3b8" />
        </svg>
        <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", on ? "bg-cyan/15 text-cyan-fg" : "bg-surface text-muted")}><Droplets className="size-4" /> Bơm {on ? "BẬT" : "TẮT"}</span>
      </div>
    </div>
  );
}

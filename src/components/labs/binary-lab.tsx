"use client";
import { useState } from "react";
import { applyGate, bitsToNumber, numberToBits, type Gate } from "@/lib/sim/binary";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/form";

const GATES: Gate[] = ["AND", "OR", "XOR", "NAND", "NOR"];

export function BinaryLab() {
  const [bits, setBits] = useState<boolean[]>(numberToBits(42));
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const value = bitsToNumber(bits);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="bin-h">
        <h3 id="bin-h" className="font-semibold text-fg">8 bit = 1 byte</h3>
        <p className="text-sm text-muted">Nhấn vào từng bit để bật/tắt.</p>
        <div className="mt-4 grid grid-cols-8 gap-1.5">
          {bits.map((bit, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={bit}
              aria-label={`Bit giá trị ${2 ** (7 - i)}: ${bit ? 1 : 0}`}
              onClick={() => setBits((bs) => bs.map((x, j) => (j === i ? !x : x)))}
              className={cn("flex aspect-square flex-col items-center justify-center rounded-xl border font-mono text-lg font-bold transition-colors", bit ? "border-cyan bg-cyan/15 text-cyan-fg shadow-[0_0_18px_-6px_var(--cyan)]" : "border-line bg-surface-2 text-muted")}
            >
              {bit ? 1 : 0}
              <span className="text-[10px] font-normal text-muted">{2 ** (7 - i)}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="dec">Thập phân</Label>
            <Input id="dec" type="number" min={0} max={255} value={value} onChange={(e) => setBits(numberToBits(Number(e.target.value)))} />
          </div>
          <p className="pb-2 font-mono text-sm text-muted">= {bits.map((x) => (x ? 1 : 0)).join("")}₂</p>
        </div>
        <p className="mt-2 text-xs text-muted">{bits.map((x, i) => (x ? 2 ** (7 - i) : null)).filter((x) => x !== null).join(" + ") || "0"} = {value}</p>
      </section>
      <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="gate-h">
        <h3 id="gate-h" className="font-semibold text-fg">Cổng logic</h3>
        <div className="mt-3 flex gap-3">
          {[["A", a, setA], ["B", b, setB]].map(([name, val, set]) => (
            <button key={name as string} type="button" aria-pressed={val as boolean} onClick={() => (set as (v: boolean) => void)(!(val as boolean))} className={cn("rounded-xl border px-4 py-2 font-mono font-semibold", val ? "border-cyan bg-cyan/15 text-cyan-fg" : "border-line bg-surface-2 text-muted")}>
              {name as string} = {val ? 1 : 0}
            </button>
          ))}
        </div>
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">Kết quả các cổng logic với A và B hiện tại</caption>
          <tbody>
            {GATES.map((g) => {
              const out = applyGate(g, a, b);
              return (
                <tr key={g} className="border-t border-line">
                  <th scope="row" className="py-2 text-left font-mono font-semibold text-fg">{g}</th>
                  <td className="py-2 text-right">
                    <span className={cn("rounded-lg px-2 py-0.5 font-mono font-bold", out ? "bg-success/15 text-success-fg" : "bg-surface-2 text-muted")}>{out ? 1 : 0}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

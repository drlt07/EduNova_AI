"use client";
import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Circle, Hand, MousePointerClick, Pause, Play, RotateCcw, Rotate3d, TrafficCone, Zap } from "lucide-react";
import { PHASE_LABEL, lightFor, remaining, requestSwitch, setMode, tickController, type ControlMode, type LightColor } from "@/lib/traffic/traffic-controller";
import { APPROACH_LABEL, AXIS_OF, STATUS_LABEL, createSimulation, snapshot, type Approach, type SimSnapshot, type SimulationState } from "@/lib/traffic/simulation-state";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scene3D } from "./scene-3d";

const LIGHT_CLS: Record<LightColor, string> = { red: "bg-[#ff3b30]", yellow: "bg-[#ffcc00]", green: "bg-[#30d158]" };
const LIGHT_VI: Record<LightColor, string> = { red: "Đỏ", yellow: "Vàng", green: "Xanh" };
const DIRS: Approach[] = ["N", "S", "E", "W"];
const SPEEDS = [0.5, 1, 2];

function newSim(mode: ControlMode = "auto", speed = 1) {
  const s = createSimulation();
  setMode(s.controller, mode);
  s.speedFactor = speed;
  return s;
}

/** Smart Traffic City 3D: khu 3D ~70% + bảng điều khiển, nhiệm vụ, trạng thái ~30%. */
export function SmartTrafficCity() {
  const [initial] = useState(() => newSim());
  const sim = useRef<SimulationState>(initial);
  const [snap, setSnap] = useState<SimSnapshot>(() => snapshot(initial, remaining(initial.controller)));
  const [selected, setSelected] = useState<string | null>(null);
  const [clickedCar, setClickedCar] = useState(false);

  const refresh = useCallback(() => setSnap(snapshot(sim.current, remaining(sim.current.controller))), []);
  const start = () => { sim.current.running = true; refresh(); };
  const pause = () => { sim.current.running = false; refresh(); };
  const reset = () => {
    const prev = sim.current;
    sim.current = newSim(prev.controller.mode, prev.speedFactor);
    setSelected(null);
    refresh();
  };
  const switchLight = () => {
    const st = sim.current;
    if (requestSwitch(st.controller)) {
      st.stats.manualSwitches++;
      // áp dụng ngay (kể cả khi đang tạm dừng): xanh → vàng
      for (const ph of tickController(st.controller, 0)) {
        st.log.push({ t: st.time, kind: "phase", text: ph.replace(/_/g, " ") });
        if (ph.endsWith("YELLOW")) st.stats.yellowSeen++;
      }
      refresh();
    }
  };
  const changeMode = (m: ControlMode) => { setMode(sim.current.controller, m); refresh(); };
  const changeSpeed = (f: number) => { sim.current.speedFactor = f; refresh(); };
  const selectCar = useCallback((id: string | null) => {
    setSelected(id);
    if (id) setClickedCar(true);
  }, []);

  const st = snap.stats;
  const canSwitch = snap.phase.endsWith("GREEN");
  const missions = [
    { text: "Bấm Bắt đầu, quan sát một xe dừng trước vạch khi đèn đỏ", done: st.stopsAtRed > 0 },
    { text: "Quan sát đèn vàng: xe còn xa thì dừng, xe quá gần vạch thì đi tiếp", done: st.yellowSeen > 0 },
    { text: "Bấm vào một ô tô trong cảnh 3D để xem trạng thái của xe", done: clickedCar },
    { text: "Chế độ thủ công: tự chuyển đèn cho hướng Đông–Tây đi", done: snap.mode === "manual" && st.manualSwitches > 0 },
    { text: "Cho 12 lượt xe qua giao lộ an toàn (0 vượt đèn đỏ, 0 xung đột)", done: st.passed >= 12 && st.violations === 0 && st.conflicts === 0 },
  ];
  const selectedCar = snap.vehicles.find((v) => v.id === selected);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
      {/* Khu 3D */}
      <section aria-label="Cảnh 3D giao lộ" className="relative h-[min(74vh,760px)] min-h-[420px] overflow-hidden rounded-2xl border border-line bg-[#cfe9ff] shadow-sm">
        <Scene3D sim={sim} phase={snap.phase} selectedCar={selected} onSelectCar={selectCar} onLightClick={switchLight} onTick={refresh} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 font-medium text-slate-700 shadow-sm"><Rotate3d className="size-3.5" aria-hidden /> Kéo để xoay · cuộn để zoom · chuột phải để dời</span>
          <span className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 font-medium text-slate-700 shadow-sm"><MousePointerClick className="size-3.5" aria-hidden /> Bấm xe để xem · bấm cột đèn để chuyển đèn</span>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-[#0B1220]/80 px-3 py-2 text-sm text-white shadow" aria-live="polite">
          <TrafficCone className="size-4 text-amber-300" aria-hidden />
          <span>{PHASE_LABEL[snap.phase]}</span>
          <span className="font-mono text-cyan-200">{Number.isFinite(snap.remaining) ? `${snap.remaining.toFixed(1)}s` : "chờ lệnh"}</span>
          {!snap.running && <Badge tone="warning">Đang dừng</Badge>}
        </div>
        {selectedCar && (
          <div className="absolute right-3 top-3 w-60 rounded-xl bg-white/90 p-3 text-sm text-slate-800 shadow-lg">
            <p className="flex items-center gap-2 font-semibold"><span className="size-3 rounded-full" style={{ background: selectedCar.color }} />{selectedCar.name}</p>
            <p className="text-xs text-slate-600">Đi {APPROACH_LABEL[selectedCar.approach]} · đèn của xe: {LIGHT_VI[lightFor(snap.phase, AXIS_OF[selectedCar.approach])]}</p>
            <p className="mt-1">{STATUS_LABEL[selectedCar.status]}</p>
            <p className="text-xs text-slate-600">Vận tốc {(selectedCar.speed * 5).toFixed(0)} km/h (quy đổi) · chờ {selectedCar.waitTime.toFixed(1)}s</p>
          </div>
        )}
      </section>

      {/* Bảng điều khiển */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 font-semibold text-fg">Điều khiển</h2>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={start} disabled={snap.running} data-testid="traffic-start"><Play className="size-4" /> Bắt đầu</Button>
            <Button variant="secondary" onClick={pause} disabled={!snap.running} data-testid="traffic-pause"><Pause className="size-4" /> Tạm dừng</Button>
            <Button variant="secondary" onClick={reset} data-testid="traffic-reset"><RotateCcw className="size-4" /> Đặt lại</Button>
          </div>
          <Button variant="violet" className="mt-2 w-full" onClick={switchLight} disabled={!canSwitch} data-testid="traffic-switch">
            <Zap className="size-4" /> Chuyển đèn sang {snap.phase.startsWith("NS") ? "Đông–Tây" : "Bắc–Nam"}
          </Button>
          <p className="mt-1 text-xs text-muted">{canSwitch ? "Đèn sẽ qua vàng rồi đỏ toàn phần trước khi hướng kia được xanh." : "Đang chuyển pha — chờ tới khi có hướng xanh."}</p>
          <div className="mt-3 space-y-3 text-sm">
            <div role="group" aria-label="Chế độ đèn">
              <p className="mb-1 text-xs text-muted">Chế độ đèn</p>
              <div className="flex gap-1">
                {(["auto", "manual"] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={snap.mode === m} onClick={() => changeMode(m)} data-testid={`traffic-mode-${m}`} className={cn("flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium", snap.mode === m ? "border-cyan/60 bg-cyan/10 text-fg" : "border-line text-muted hover:text-fg")}>
                    {m === "auto" ? "Tự động theo chu kỳ" : <span className="inline-flex items-center gap-1"><Hand className="size-3" aria-hidden /> Thủ công</span>}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-label="Tốc độ mô phỏng">
              <p className="mb-1 text-xs text-muted">Tốc độ</p>
              <div className="flex gap-1">
                {SPEEDS.map((f) => (
                  <button key={f} type="button" aria-pressed={snap.speedFactor === f} onClick={() => changeSpeed(f)} className={cn("flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs", snap.speedFactor === f ? "border-cyan/60 bg-cyan/10 text-fg" : "border-line text-muted hover:text-fg")}>{f}×</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 font-semibold text-fg">Trạng thái</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm" aria-label="Đèn từng hướng">
            {DIRS.map((d) => {
              const c = lightFor(snap.phase, AXIS_OF[d]);
              return (
                <li key={d} className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5" data-testid={`light-${d}`} data-color={c}>
                  <span className={cn("size-3 rounded-full ring-2 ring-black/10", LIGHT_CLS[c])} aria-hidden />
                  <span className="text-fg">Xe {APPROACH_LABEL[d].replace("từ phía ", "")}: <b>{LIGHT_VI[c]}</b></span>
                </li>
              );
            })}
          </ul>
          <ul className="mt-3 space-y-1.5 text-sm" aria-label="Các xe">
            {snap.vehicles.map((v) => (
              <li key={v.id}>
                <button type="button" onClick={() => selectCar(selected === v.id ? null : v.id)} aria-pressed={selected === v.id} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left", selected === v.id ? "bg-cyan/10" : "hover:bg-surface-2")}>
                  <span className="size-3 shrink-0 rounded-full" style={{ background: v.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-fg">{v.name}</span>
                  <span className={cn("text-xs", v.status === "waiting" ? "text-danger-fg" : v.status === "braking" ? "text-warning-fg" : "text-muted")}>{STATUS_LABEL[v.status]}</span>
                </button>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
            {([["Qua giao lộ", st.passed], ["Dừng đèn đỏ", st.stopsAtRed], ["Vượt đỏ", st.violations], ["Xung đột", st.conflicts]] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface-2 p-1.5">
                <dd className={cn("text-lg font-bold", (k === "Vượt đỏ" || k === "Xung đột") && v > 0 ? "text-danger-fg" : "text-fg")} data-testid={`stat-${k}`}>{v}</dd>
                <dt className="text-[11px] leading-tight text-muted">{k}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-2 font-semibold text-fg">Nhiệm vụ quan sát</h2>
          <ol className="space-y-1.5 text-sm">
            {missions.map((m) => (
              <li key={m.text} className="flex gap-2">
                {m.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" aria-label="đã xong" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />}
                <span className={m.done ? "text-muted line-through" : "text-fg"}>{m.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-2 font-semibold text-fg">Luật xe đang dùng</h2>
          <pre tabIndex={0} className="overflow-x-auto rounded-xl bg-[#0B1220] p-3 font-mono text-[12px] leading-5 text-slate-200">{`if den == "xanh":
    di_tiep()
elif den == "vang" and gan_vach:
    di_tiep()   # quá gần để dừng an toàn
else:
    dung_truoc_vach()`}</pre>
          <p className="mt-2 text-xs text-muted">Sắp có: trình soạn Python để em tự viết if/else điều khiển đèn và xe. Hiện luật trên được cài sẵn trong mô phỏng.</p>
        </div>

        {snap.log.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-2 font-semibold text-fg">Nhật ký</h2>
            <ul className="space-y-1 text-xs">
              {snap.log.map((e, i) => (
                <li key={`${e.t}-${i}`} className={cn(e.kind === "violation" || e.kind === "conflict" ? "text-danger-fg" : "text-muted")}><span className="font-mono">{e.t.toFixed(1)}s</span> {e.text}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

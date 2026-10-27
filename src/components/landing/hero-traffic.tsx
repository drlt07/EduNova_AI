"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { TrafficCone } from "lucide-react";
import dynamic from "next/dynamic";
import { PHASE_LABEL, setMode, type PhaseName } from "@/lib/traffic/traffic-controller";
import { createSimulation, type SimulationState } from "@/lib/traffic/simulation-state";
import { TrafficArt } from "./sim-art";

const Scene3D = dynamic(() => import("@/components/traffic3d/scene-3d").then((m) => m.Scene3D), {
  ssr: false,
  loading: () => <TrafficArt className="h-full w-full object-cover" />,
});

const DESKTOP = "(min-width: 1024px)";
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

function newSim() {
  const s = createSimulation();
  setMode(s.controller, "auto");
  s.running = true;
  return s;
}

/**
 * Cảnh giao lộ 3D thu nhỏ cho Hero, chạy đúng engine của Smart Traffic City (xe dừng đèn đỏ, đèn tự chuyển).
 * Chỉ dựng WebGL trên màn hình rộng; điện thoại và chế độ giảm chuyển động dùng hình minh họa tĩnh.
 */
export function HeroTraffic() {
  const desktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => false);
  const reduced = useReducedMotion();
  const [initial] = useState(newSim);
  const sim = useRef<SimulationState>(initial);
  const [phase, setPhase] = useState<PhaseName>(initial.controller.phase);
  const box = useRef<HTMLDivElement>(null);

  // Dừng mô phỏng khi Hero cuộn khỏi màn hình để không tốn CPU/GPU.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      sim.current.running = e.isIntersecting && !reduced;
    });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, desktop]);

  const onTick = useCallback(() => setPhase(sim.current.controller.phase), []);
  const noop = useCallback(() => {}, []);
  const live = desktop && !reduced;

  return (
    <div ref={box} className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#cfe9ff]">
      {live ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Scene3D sim={sim} phase={phase} selectedCar={null} onSelectCar={noop} onLightClick={noop} onTick={onTick} preview />
        </div>
      ) : (
        <TrafficArt className="h-full w-full" />
      )}
      {live && (
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-[#0B1220]/80 px-3 py-1.5 text-xs text-white shadow">
          <TrafficCone className="size-3.5 text-amber-300" aria-hidden />
          <span>{PHASE_LABEL[phase]}</span>
        </div>
      )}
    </div>
  );
}

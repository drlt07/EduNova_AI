"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { lightFor } from "@/lib/traffic/traffic-controller";
import { CARS, ROAD_HALF, STOP_LINE, stepSimulation, type SimulationState } from "@/lib/traffic/simulation-state";
import { CityProps } from "./city-props";
import { TrafficLight } from "./traffic-light";
import { Vehicle } from "./vehicle";
import type { PhaseName } from "@/lib/traffic/traffic-controller";

const FIXED_DT = 1 / 120;

/** Vị trí cột đèn cho từng hướng xe tới: đứng bên phải làn, trước vạch dừng, tay đòn vươn ra trên làn. */
const LIGHTS = [
  { id: "N", label: "Đèn hướng Bắc", axis: "NS", pos: [-(ROAD_HALF + 1.2), 0.26, -(STOP_LINE + 1)], rot: 0 },
  { id: "S", label: "Đèn hướng Nam", axis: "NS", pos: [ROAD_HALF + 1.2, 0.26, STOP_LINE + 1], rot: Math.PI },
  { id: "E", label: "Đèn hướng Đông", axis: "EW", pos: [STOP_LINE + 1, 0.26, -(ROAD_HALF + 1.2)], rot: -Math.PI / 2 },
  { id: "W", label: "Đèn hướng Tây", axis: "EW", pos: [-(STOP_LINE + 1), 0.26, ROAD_HALF + 1.2], rot: Math.PI / 2 },
] as const;

/** Chạy mô phỏng với bước thời gian cố định, độc lập tốc độ khung hình. */
function SimDriver({ sim, onTick }: { sim: React.RefObject<SimulationState>; onTick: () => void }) {
  const acc = useRef(0);
  const sinceUi = useRef(0);
  useFrame((_, delta) => {
    const st = sim.current;
    if (!st.running) return;
    acc.current += Math.min(delta, 0.1) * st.speedFactor;
    let n = 0;
    while (acc.current >= FIXED_DT && n++ < 60) {
      stepSimulation(st, FIXED_DT);
      acc.current -= FIXED_DT;
    }
    sinceUi.current += delta;
    if (sinceUi.current > 0.15) {
      sinceUi.current = 0;
      onTick();
    }
  });
  return null;
}

export interface Scene3DProps {
  sim: React.RefObject<SimulationState>;
  phase: PhaseName;
  selectedCar: string | null;
  onSelectCar: (id: string | null) => void;
  onLightClick: () => void;
  onTick: () => void;
}

/** Canvas WebGL của React Three Fiber: camera isometric (orthographic) xoay/zoom được, ánh sáng ban ngày, bóng đổ mềm. */
export function Scene3D({ sim, phase, selectedCar, onSelectCar, onLightClick, onTick }: Scene3DProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelectCar(null)}
      fallback={<div className="grid h-full place-items-center p-6 text-center text-sm text-white">Trình duyệt này không hỗ trợ WebGL nên không hiển thị được cảnh 3D. Hãy thử Chrome, Edge hoặc Firefox bản mới và bật tăng tốc phần cứng.</div>}
    >
      <color attach="background" args={["#cfe9ff"]} />
      <OrthographicCamera makeDefault position={[46, 44, 46]} zoom={15} near={-200} far={400} />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.08}
        minZoom={6}
        maxZoom={45}
        minPolarAngle={0.25}
        maxPolarAngle={1.25}
        enablePan
        screenSpacePanning={false}
      />
      <hemisphereLight args={["#e0f2ff", "#7c9a5a", 1.1]} />
      <directionalLight
        castShadow
        position={[28, 46, 18]}
        intensity={2.4}
        color="#fff4e0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={6}
      />
      <ambientLight intensity={0.25} />
      <CityProps />
      {LIGHTS.map((l) => (
        <TrafficLight key={l.id} label={l.label} position={l.pos as unknown as [number, number, number]} rotationY={l.rot} color={lightFor(phase, l.axis)} onSelect={onLightClick} />
      ))}
      {CARS.map((v) => (
        <Vehicle key={v.id} sim={sim} id={v.id} color={v.color} selected={selectedCar === v.id} onSelect={onSelectCar} />
      ))}
      <SimDriver sim={sim} onTick={onTick} />
    </Canvas>
  );
}

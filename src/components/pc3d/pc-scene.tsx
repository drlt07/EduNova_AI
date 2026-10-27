"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PARTS, type DataNode, type PartId, type SlotId } from "@/lib/sim/pc-build";

type V3 = [number, number, number];

/** Vị trí khi đã lắp (trong thùng máy) và vị trí khe tương ứng. */
const INSTALLED: Record<PartId, V3> = {
  psu: [-0.85, -2.05, -0.3],
  motherboard: [0.1, 0.5, -1.1],
  cpu: [-0.4, 1.25, -1.02],
  cooler: [-0.4, 1.25, -0.72],
  ram: [0.75, 1.15, -0.85],
  ssd: [-0.25, 0.3, -1.03],
  gpu: [-0.05, -0.55, -0.58],
};
const SLOT_POS: Record<SlotId, { pos: V3; size: V3 }> = {
  standoffs: { pos: [0.1, 0.5, -1.12], size: [3.5, 4.1, 0.05] },
  socket: { pos: [-0.4, 1.25, -1.0], size: [0.8, 0.8, 0.08] },
  "cooler-mount": { pos: [-0.4, 1.25, -0.72], size: [1.0, 1.0, 0.55] },
  dimm: { pos: [0.75, 1.15, -0.98], size: [0.32, 1.75, 0.12] },
  m2: { pos: [-0.25, 0.3, -1.0], size: [1.05, 0.3, 0.08] },
  pcie: { pos: [-0.05, -0.55, -0.98], size: [2.9, 0.22, 0.1] },
  "psu-bay": { pos: [-0.85, -2.05, -0.3], size: [2.1, 0.95, 1.6] },
};
/** Bàn linh kiện bên phải thùng máy (thu nhỏ khi chưa lắp). */
const TRAY: Record<PartId, V3> = {
  motherboard: [3.7, 1.7, 0.4],
  psu: [5.5, 1.7, 0.4],
  cpu: [3.7, 0.4, 0.4],
  cooler: [5.5, 0.4, 0.4],
  ram: [3.7, -0.9, 0.4],
  ssd: [5.5, -0.9, 0.4],
  gpu: [4.6, -2.2, 0.4],
};
const MONITOR: V3 = [-4.3, 0.6, -0.4];
export const NODE_POS: Record<DataNode, V3> = { ssd: INSTALLED.ssd, ram: INSTALLED.ram, cpu: INSTALLED.cpu, gpu: INSTALLED.gpu, monitor: MONITOR };

const PART_NAME = Object.fromEntries(PARTS.map((p) => [p.id, p.name])) as Record<PartId, string>;

function Fan({ radius, spinning, color = "#334155" }: { radius: number; spinning: boolean; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (spinning && ref.current) ref.current.rotation.z += d * 14;
  });
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[radius, radius, 0.04, 28]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <group ref={ref} position={[0, 0, 0.03]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]} position={[0, 0, 0]}>
            <boxGeometry args={[radius * 0.28, radius * 0.95, 0.02]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Hình khối từng linh kiện, gốc tọa độ ở tâm. */
function PartModel({ id, booted }: { id: PartId; booted: boolean }) {
  switch (id) {
    case "motherboard":
      return (
        <group>
          <mesh><boxGeometry args={[3.4, 4.0, 0.06]} /><meshStandardMaterial color="#14532d" roughness={0.7} /></mesh>
          {/* đường mạch, chip cầu nối, cổng I/O */}
          {[-1.2, -0.7, 0.2, 1.3].map((y) => <mesh key={y} position={[0.2, y, 0.035]}><boxGeometry args={[2.6, 0.02, 0.005]} /><meshStandardMaterial color="#86efac" emissive="#22c55e" emissiveIntensity={booted ? 0.6 : 0.05} /></mesh>)}
          <mesh position={[0.9, -1.3, 0.06]}><boxGeometry args={[0.5, 0.5, 0.06]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[-1.55, 1.2, 0.12]}><boxGeometry args={[0.25, 1.3, 0.2]} /><meshStandardMaterial color="#64748b" metalness={0.6} /></mesh>
          {/* khe trên bo: socket, 2 khe RAM, PCIe, M.2 */}
          <mesh position={[-0.5, 0.75, 0.05]}><boxGeometry args={[0.75, 0.75, 0.04]} /><meshStandardMaterial color="#cbd5e1" metalness={0.5} /></mesh>
          {[0.55, 0.75].map((x) => <mesh key={x} position={[x, 0.65, 0.06]}><boxGeometry args={[0.07, 1.7, 0.08]} /><meshStandardMaterial color="#0f172a" /></mesh>)}
          <mesh position={[-0.15, -1.05, 0.06]}><boxGeometry args={[2.8, 0.12, 0.08]} /><meshStandardMaterial color="#0f172a" /></mesh>
          <mesh position={[-0.35, -0.2, 0.045]}><boxGeometry args={[1.0, 0.12, 0.03]} /><meshStandardMaterial color="#334155" /></mesh>
          <mesh position={[1.45, 1.7, 0.06]}><boxGeometry args={[0.12, 0.12, 0.05]} /><meshStandardMaterial color={booted ? "#22c55e" : "#14532d"} emissive={booted ? "#22c55e" : "#000"} emissiveIntensity={2} /></mesh>
        </group>
      );
    case "cpu":
      return (
        <group>
          <mesh><boxGeometry args={[0.6, 0.6, 0.06]} /><meshStandardMaterial color="#166534" /></mesh>
          <mesh position={[0, 0, 0.045]}><boxGeometry args={[0.46, 0.46, 0.04]} /><meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.25} /></mesh>
        </group>
      );
    case "cooler":
      return (
        <group>
          {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, -0.4 + i * 0.115, -0.05]}><boxGeometry args={[0.9, 0.04, 0.4]} /><meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} /></mesh>)}
          <group position={[0, 0, 0.18]}><Fan radius={0.42} spinning={booted} /></group>
        </group>
      );
    case "ram":
      return (
        <group>
          <mesh><boxGeometry args={[0.06, 1.6, 0.36]} /><meshStandardMaterial color="#047857" /></mesh>
          {[-0.55, -0.2, 0.15, 0.5].map((y) => <mesh key={y} position={[0.04, y, 0.02]}><boxGeometry args={[0.03, 0.25, 0.22]} /><meshStandardMaterial color="#111827" /></mesh>)}
          <mesh position={[0, 0, -0.17]}><boxGeometry args={[0.065, 1.55, 0.03]} /><meshStandardMaterial color="#facc15" metalness={0.9} /></mesh>
        </group>
      );
    case "ssd":
      return (
        <group>
          <mesh><boxGeometry args={[0.9, 0.2, 0.03]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
          {[-0.2, 0.15].map((x) => <mesh key={x} position={[x, 0, 0.025]}><boxGeometry args={[0.24, 0.14, 0.02]} /><meshStandardMaterial color="#111827" /></mesh>)}
          <mesh position={[0.4, 0, 0.02]}><boxGeometry args={[0.06, 0.18, 0.015]} /><meshStandardMaterial color="#facc15" metalness={0.9} /></mesh>
        </group>
      );
    case "gpu":
      return (
        <group>
          <RoundedBox args={[2.8, 0.32, 1.0]} radius={0.04}><meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.5} /></RoundedBox>
          {[-0.65, 0.65].map((x) => <group key={x} position={[x, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}><Fan radius={0.4} spinning={booted} color="#475569" /></group>)}
          <mesh position={[0, 0.17, 0]}><boxGeometry args={[2.6, 0.02, 0.6]} /><meshStandardMaterial color="#4f7fff" emissive="#4f7fff" emissiveIntensity={booted ? 1.2 : 0.1} /></mesh>
          <mesh position={[-1.4, 0, -0.1]}><boxGeometry args={[0.04, 0.55, 1.1]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
        </group>
      );
    case "psu":
      return (
        <group>
          <RoundedBox args={[2.0, 0.9, 1.5]} radius={0.05}><meshStandardMaterial color="#111827" roughness={0.6} /></RoundedBox>
          <group position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}><Fan radius={0.36} spinning={booted} /></group>
          <mesh position={[0.6, 0, 0.76]}><boxGeometry args={[0.5, 0.25, 0.02]} /><meshStandardMaterial color="#facc15" /></mesh>
        </group>
      );
  }
}

/** Một linh kiện: trượt mượt giữa bàn và vị trí lắp, phóng to khi lắp, sáng viền khi được chọn. */
function Part({ id, installed, selected, booted, onClick }: { id: PartId; installed: boolean; selected: boolean; booted: boolean; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const target = useMemo(() => new THREE.Vector3(...(installed ? INSTALLED[id] : TRAY[id])), [installed, id]);
  const scale = installed ? 1 : id === "motherboard" ? 0.38 : id === "psu" || id === "gpu" ? 0.55 : 1.1;
  useFrame((_, d) => {
    const g = ref.current;
    if (!g) return;
    g.position.lerp(target, Math.min(1, d * 6));
    const s = THREE.MathUtils.lerp(g.scale.x, scale * (selected ? 1.12 : 1), Math.min(1, d * 6));
    g.scale.setScalar(s);
    if (!installed) g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, selected ? Math.sin(performance.now() / 400) * 0.25 : -0.35, Math.min(1, d * 4));
    else g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, 0, Math.min(1, d * 6));
  });
  return (
    <group
      ref={ref}
      position={TRAY[id]}
      scale={scale}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
    >
      <PartModel id={id} booted={booted && installed} />
      {(hover || selected) && (
        <Html center distanceFactor={9} position={[0, id === "motherboard" ? 2.4 : id === "psu" ? 0.9 : 0.75, 0.3]} style={{ pointerEvents: "none" }}>
          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold shadow ${selected ? "bg-[#22d3ee] text-[#04111f]" : "bg-white/95 text-slate-900"}`}>{PART_NAME[id]}</span>
        </Html>
      )}
    </group>
  );
}

/** Khe đang mời lắp: hộp phát sáng nhấp nháy, bấm để đặt linh kiện đang chọn. */
function SlotMarker({ id, onClick }: { id: SlotId; onClick: () => void }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  const [hover, setHover] = useState(false);
  useFrame(() => {
    if (ref.current) ref.current.opacity = hover ? 0.55 : 0.22 + Math.sin(performance.now() / 260) * 0.1;
  });
  const s = SLOT_POS[id];
  return (
    <mesh
      position={s.pos}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
    >
      <boxGeometry args={s.size} />
      <meshStandardMaterial ref={ref} color={hover ? "#22d3ee" : "#38bdf8"} emissive="#22d3ee" emissiveIntensity={0.8} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

function CaseShell() {
  const metal = <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.55} />;
  return (
    <group>
      <mesh position={[0, 0, -1.25]} receiveShadow><boxGeometry args={[4.6, 5.4, 0.08]} /><meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.7} /></mesh>
      <mesh position={[0, 2.7, 0]}><boxGeometry args={[4.6, 0.08, 2.5]} />{metal}</mesh>
      <mesh position={[0, -2.7, 0]}><boxGeometry args={[4.6, 0.08, 2.5]} />{metal}</mesh>
      <mesh position={[-2.3, 0, 0]}><boxGeometry args={[0.08, 5.4, 2.5]} />{metal}</mesh>
      <mesh position={[2.3, 0, 0]}><boxGeometry args={[0.08, 5.4, 2.5]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      {/* chân đế bo mạch */}
      {[[-1.4, 2.2], [1.6, 2.2], [-1.4, -1.2], [1.6, -1.2]].map(([x, y]) => <mesh key={`${x}${y}`} position={[x, y, -1.18]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.08, 10]} /><meshStandardMaterial color="#facc15" metalness={0.8} /></mesh>)}
    </group>
  );
}

function Monitor({ screen, booted, onClick, highlight }: { screen: string; booted: boolean; onClick?: () => void; highlight: boolean }) {
  return (
    <group position={MONITOR} onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}>
      <RoundedBox args={[2.9, 1.85, 0.12]} radius={0.06}><meshStandardMaterial color="#0f172a" /></RoundedBox>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[2.7, 1.65]} />
        <meshStandardMaterial color={booted ? "#1d4ed8" : screen ? "#111827" : "#020617"} emissive={booted ? "#3b82f6" : highlight ? "#22d3ee" : "#000"} emissiveIntensity={booted ? 0.5 : highlight ? 0.25 : 0} />
      </mesh>
      <mesh position={[0, -1.15, -0.1]}><boxGeometry args={[0.2, 0.5, 0.1]} /><meshStandardMaterial color="#1e293b" /></mesh>
      <mesh position={[0, -1.4, -0.1]}><boxGeometry args={[1.1, 0.06, 0.6]} /><meshStandardMaterial color="#1e293b" /></mesh>
      {screen && (
        <Html center transform distanceFactor={4} position={[0, 0, 0.08]} style={{ pointerEvents: "none" }}>
          <div className="w-[260px] text-center font-mono text-[15px] font-semibold text-white">{screen}</div>
        </Html>
      )}
    </group>
  );
}

/** Gói dữ liệu phát sáng chạy theo đường đã chọn. */
function DataPulse({ points }: { points: V3[] }) {
  const ref = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => (points.length > 1 ? new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2] + 0.5)), false, "catmullrom", 0.1) : null), [points]);
  useFrame(() => {
    if (!curve || !ref.current) return;
    const t = (performance.now() / 2600) % 1;
    ref.current.position.copy(curve.getPoint(t));
  });
  if (!curve) return null;
  return (
    <>
      <Line points={curve.getPoints(80)} color="#22d3ee" lineWidth={3} dashed dashSize={0.18} gapSize={0.1} />
      <mesh ref={ref}><sphereGeometry args={[0.16, 20, 20]} /><meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={3} /></mesh>
    </>
  );
}

export interface PcSceneProps {
  placed: PartId[];
  selected: PartId | null;
  /** Các khe đang mời lắp (khi có linh kiện được chọn) */
  slots: SlotId[];
  booted: boolean;
  screen: string;
  dataPath: DataNode[];
  /** Nhiệm vụ đường đi dữ liệu: bấm vào linh kiện/màn hình để chọn bước */
  pickingData: boolean;
  onPickPart: (id: PartId) => void;
  onPickSlot: (id: SlotId) => void;
  onPickNode: (id: DataNode) => void;
}

export function PcScene(p: PcSceneProps) {
  const ids = PARTS.map((x) => x.id);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.8, 2.6, 14.5], fov: 42 }}
      fallback={<div className="grid h-full place-items-center p-6 text-center text-sm text-white">Trình duyệt không hỗ trợ WebGL nên không hiển thị được cảnh 3D. Bạn vẫn làm nhiệm vụ được bằng các nút trong bảng bên cạnh.</div>}
    >
      <color attach="background" args={["#e0ecff"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 8, 10]} intensity={1.3} />
      <directionalLight position={[-8, 4, 6]} intensity={0.4} color="#c7d2fe" />
      <OrbitControls makeDefault target={[0.4, -0.2, 0]} enableDamping minDistance={5} maxDistance={22} minPolarAngle={0.5} maxPolarAngle={2.0} minAzimuthAngle={-1.1} maxAzimuthAngle={1.1} />
      <mesh position={[1, -2.9, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 14]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      <mesh position={[4.6, -0.2, -0.2]}><boxGeometry args={[3.6, 5.6, 0.1]} /><meshStandardMaterial color="#f8fafc" transparent opacity={0.6} /></mesh>
      <CaseShell />
      <Monitor screen={p.screen} booted={p.booted} highlight={p.pickingData} onClick={p.pickingData ? () => p.onPickNode("monitor") : undefined} />
      {ids.map((id) => (
        <Part
          key={id}
          id={id}
          installed={p.placed.includes(id)}
          selected={p.selected === id}
          booted={p.booted}
          onClick={() => {
            if (p.pickingData && (id === "ssd" || id === "ram" || id === "cpu" || id === "gpu")) p.onPickNode(id);
            else if (!p.placed.includes(id)) p.onPickPart(id);
          }}
        />
      ))}
      {p.slots.map((s) => <SlotMarker key={s} id={s} onClick={() => p.onPickSlot(s)} />)}
      <DataPulse points={p.dataPath.map((n) => NODE_POS[n])} />
    </Canvas>
  );
}

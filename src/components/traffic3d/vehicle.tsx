"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { vehiclePose, STATUS_LABEL, type SimulationState } from "@/lib/traffic/simulation-state";

const WHEEL_R = 0.42;
const WHEELS: [number, number][] = [[-0.92, 1.05], [0.92, 1.05], [-0.92, -1.05], [0.92, -1.05]];

/**
 * Ô tô low-poly: thân bo góc, cabin kính, 4 bánh, đèn pha và đèn phanh.
 * Vị trí đọc trực tiếp từ SimulationState mỗi khung hình (không render lại React) để chạy mượt.
 * Hệ tọa độ cục bộ: đầu xe hướng +z.
 */
export function Vehicle({ sim, id, color, selected, onSelect }: { sim: React.RefObject<SimulationState>; id: string; color: string; selected: boolean; onSelect: (id: string) => void }) {
  const group = useRef<Group>(null);
  const wheels = useRef<(Mesh | null)[]>([]);
  const brake = useRef<MeshStandardMaterial>(null);
  const ring = useRef<Mesh>(null);
  const info = useRef<HTMLSpanElement>(null);

  useFrame((_, delta) => {
    const v = sim.current.vehicles.find((x) => x.id === id);
    const g = group.current;
    if (!v || !g) return;
    const p = vehiclePose(v);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = p.rotY;
    // ẩn khi xe đang "quay vòng" ở mép bản đồ
    g.visible = Math.abs(p.x) < 41 && Math.abs(p.z) < 41;
    for (const w of wheels.current) if (w) w.rotation.x += (v.speed * delta) / WHEEL_R;
    if (brake.current) brake.current.emissiveIntensity = v.accel < -0.5 || v.speed < 0.05 ? 3 : 0.4;
    if (ring.current) ring.current.rotation.z += delta * 1.5;
    if (info.current) info.current.textContent = `${STATUS_LABEL[v.status]} · ${(v.speed * 3.6 * 1.4).toFixed(0)} km/h`;
  });

  return (
    <group
      ref={group}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = ""; }}
    >
      {/* thân xe */}
      <RoundedBox args={[1.9, 0.75, 3.2]} radius={0.22} smoothness={3} position={[0, 0.72, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </RoundedBox>
      {/* cabin + kính */}
      <RoundedBox args={[1.6, 0.62, 1.7]} radius={0.18} smoothness={3} position={[0, 1.38, -0.2]} castShadow>
        <meshStandardMaterial color="#a5d8ff" roughness={0.08} metalness={0.3} transparent opacity={0.88} />
      </RoundedBox>
      <mesh position={[0, 1.71, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.06, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* bánh xe */}
      {WHEELS.map(([x, z], i) => (
        <mesh key={i} ref={(m) => { wheels.current[i] = m; }} position={[x, WHEEL_R, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.32, 14]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
      ))}
      {/* đèn pha (trước, +z) */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.8, 1.61]}>
          <boxGeometry args={[0.38, 0.18, 0.04]} />
          <meshStandardMaterial color="#fffbe6" emissive="#fff3b0" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
      {/* đèn phanh (sau, −z) */}
      <mesh position={[0, 0.82, -1.61]}>
        <boxGeometry args={[1.5, 0.16, 0.04]} />
        <meshStandardMaterial ref={brake} color="#7f1d1d" emissive="#ff2a2a" emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      {selected && (
        <>
          <mesh ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.1, 2.35, 32, 1, 0, Math.PI * 1.6]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
          <Html position={[0, 2.6, 0]} center distanceFactor={undefined} zIndexRange={[20, 0]}>
            <span ref={info} className="whitespace-nowrap rounded-full bg-[#0B1220]/85 px-2.5 py-1 text-xs font-medium text-white shadow" />
          </Html>
        </>
      )}
    </group>
  );
}

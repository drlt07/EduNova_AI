"use client";
import { useState } from "react";
import type { LightColor } from "@/lib/traffic/traffic-controller";

const BULBS: { color: LightColor; on: string; off: string; y: number }[] = [
  { color: "red", on: "#ff3b30", off: "#3a1414", y: 0.62 },
  { color: "yellow", on: "#ffcc00", off: "#3a3210", y: 0 },
  { color: "green", on: "#30d158", off: "#103a1c", y: -0.62 },
];

/**
 * Cột đèn giao thông 3D. Hệ tọa độ cục bộ: chân cột ở gốc, tay đòn vươn theo +x tới phía trên làn xe,
 * mặt đèn quay về −z (về phía xe đang tới). Bấm vào đèn để yêu cầu chuyển pha.
 */
export function TrafficLight({ position, rotationY, color, onSelect, label }: { position: [number, number, number]; rotationY: number; color: LightColor; onSelect?: () => void; label: string }) {
  const [hover, setHover] = useState(false);
  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      scale={1.2}
      onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      name={label}
    >
      {/* đế + cột */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.42, 0.3, 12]} />
        <meshStandardMaterial color="#4b5563" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 5, 12]} />
        <meshStandardMaterial color={hover ? "#64748b" : "#374151"} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* tay đòn */}
      <mesh position={[1.6, 4.95, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* hộp đèn treo trên làn */}
      <group position={[3, 4.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 2, 0.6]} />
          <meshStandardMaterial color="#1f2937" roughness={0.6} />
        </mesh>
        {BULBS.map((b) => {
          const lit = b.color === color;
          return (
            <group key={b.color} position={[0, b.y, -0.31]}>
              {/* mái che */}
              <mesh position={[0, 0.24, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.27, 0.27, 0.25, 16, 1, true, -Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color="#111827" side={2} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.06, 20]} />
                <meshStandardMaterial color={lit ? b.on : b.off} emissive={lit ? b.on : "#000000"} emissiveIntensity={lit ? 2.6 : 0} toneMapped={!lit} />
              </mesh>
            </group>
          );
        })}
      </group>
      {/* đèn nhỏ ngang tầm mắt trên cột */}
      <group position={[0, 2.4, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.05, 0.3]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        {BULBS.map((b) => (
          <mesh key={b.color} position={[0, b.y * 0.52, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <meshStandardMaterial color={b.color === color ? b.on : b.off} emissive={b.color === color ? b.on : "#000000"} emissiveIntensity={b.color === color ? 2.2 : 0} toneMapped={b.color !== color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

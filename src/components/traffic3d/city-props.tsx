"use client";
/**
 * Cảnh tĩnh của giao lộ: mặt đường, vạch kẻ, vỉa hè, nhà, cây, cột đèn, công viên.
 * Chỉ dùng mesh cơ bản; các vật thể lặp lại (vạch kẻ, cây, cửa sổ, hàng rào) vẽ bằng instancing để chạy mượt.
 */
import { ROAD_HALF, STOP_LINE } from "@/lib/traffic/simulation-state";
import { InstancedBoxes, InstancedTrees, type BoxItem, type TreeItem } from "./instanced";

const MAP = 60; // nửa kích thước bản đồ
const WALK = 3; // bề rộng vỉa hè
const E = ROAD_HALF + WALK; // mép trong của khu đất

// ---------- dữ liệu tĩnh (tính một lần) ----------
const WHITE: BoxItem[] = [];
const YELLOW: BoxItem[] = [];
const WALKS: BoxItem[] = [];
const CURBS: BoxItem[] = [];
{
  for (let d = STOP_LINE + 2; d < MAP; d += 4)
    for (const sg of [1, -1]) {
      YELLOW.push({ p: [0, 0.05, sg * (d + 1)], s: [0.18, 0.02, 2] });
      YELLOW.push({ p: [sg * (d + 1), 0.05, 0], s: [2, 0.02, 0.18] });
    }
  // vạch qua đường (vằn ngựa)
  const cw0 = ROAD_HALF + 0.5;
  const cwLen = STOP_LINE - 0.6 - cw0;
  for (const sg of [1, -1])
    for (const o of [-3.25, -2.25, -1.25, -0.25, 0.75, 1.75, 2.75]) {
      WHITE.push({ p: [o + 0.25, 0.05, sg * (cw0 + cwLen / 2)], s: [0.55, 0.02, cwLen] });
      WHITE.push({ p: [sg * (cw0 + cwLen / 2), 0.05, o + 0.25], s: [cwLen, 0.02, 0.55] });
    }
  // vạch dừng: chỉ trên làn xe đi vào giao lộ
  WHITE.push({ p: [-ROAD_HALF / 2, 0.05, -STOP_LINE - 0.15], s: [ROAD_HALF, 0.02, 0.35] });
  WHITE.push({ p: [ROAD_HALF / 2, 0.05, STOP_LINE + 0.15], s: [ROAD_HALF, 0.02, 0.35] });
  WHITE.push({ p: [STOP_LINE + 0.15, 0.05, -ROAD_HALF / 2], s: [0.35, 0.02, ROAD_HALF] });
  WHITE.push({ p: [-STOP_LINE - 0.15, 0.05, ROAD_HALF / 2], s: [0.35, 0.02, ROAD_HALF] });
  // mép đường liền
  const L = MAP - STOP_LINE;
  for (const o of [ROAD_HALF - 0.25, -ROAD_HALF + 0.25])
    for (const sg of [1, -1]) {
      WHITE.push({ p: [o, 0.05, sg * (STOP_LINE + L / 2)], s: [0.12, 0.02, L] });
      WHITE.push({ p: [sg * (STOP_LINE + L / 2), 0.05, o], s: [L, 0.02, 0.12] });
    }
  // vỉa hè + bó vỉa ở 4 góc
  const a = ROAD_HALF, b = MAP;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    WALKS.push({ p: [sx * (a + WALK / 2), 0.13, sz * (a + (b - a) / 2)], s: [WALK, 0.26, b - a] });
    WALKS.push({ p: [sx * (a + WALK + (b - a - WALK) / 2), 0.13, sz * (a + WALK / 2)], s: [b - a - WALK, 0.26, WALK] });
    CURBS.push({ p: [sx * (a + 0.08), 0.15, sz * (a + (b - a) / 2)], s: [0.16, 0.3, b - a] });
    CURBS.push({ p: [sx * (a + (b - a) / 2), 0.15, sz * (a + 0.08)], s: [b - a, 0.3, 0.16] });
  }
}

interface HouseDef { p: [number, number]; w: number; d: number; h: number; wall: string; roof: string; rot: number }
const HOUSES: HouseDef[] = [
  { p: [-(E + 4), -(E + 4)], w: 5, d: 5, h: 4, wall: "#fde68a", roof: "#dc2626", rot: Math.PI / 4 },
  { p: [-(E + 12), -(E + 4.5)], w: 6, d: 5, h: 6.4, wall: "#bfdbfe", roof: "#1d4ed8", rot: 0 },
  { p: [-(E + 4.5), -(E + 13)], w: 5, d: 6, h: 5, wall: "#fecaca", roof: "#7c2d12", rot: Math.PI / 2 },
  { p: [-(E + 20), -(E + 5)], w: 5, d: 5, h: 3.4, wall: "#e9d5ff", roof: "#6d28d9", rot: 0 },
  { p: [E + 4.5, -(E + 4.5)], w: 6, d: 6, h: 9.6, wall: "#e2e8f0", roof: "#0f766e", rot: -Math.PI / 4 },
  { p: [E + 13, -(E + 4)], w: 5, d: 5, h: 4.8, wall: "#fed7aa", roof: "#b91c1c", rot: 0 },
  { p: [E + 4, -(E + 13)], w: 5, d: 5, h: 3.6, wall: "#bbf7d0", roof: "#15803d", rot: -Math.PI / 2 },
  { p: [-(E + 4), E + 4.5], w: 5, d: 6, h: 5.6, wall: "#fbcfe8", roof: "#9d174d", rot: Math.PI * 0.75 },
  { p: [-(E + 12.5), E + 4], w: 6, d: 5, h: 4, wall: "#fef3c7", roof: "#b45309", rot: Math.PI },
  { p: [-(E + 4), E + 13], w: 5, d: 5, h: 7.2, wall: "#ddd6fe", roof: "#4338ca", rot: Math.PI / 2 },
];
// cửa sổ của mọi nhà (mặt trước +z và hai mặt bên) — một draw call
const WINDOWS: BoxItem[] = [];
const DOORS: BoxItem[] = [];
{
  const place = (h: HouseDef, lx: number, ly: number, lz: number, s: [number, number, number], out: BoxItem[]) => {
    const c = Math.cos(h.rot), sn = Math.sin(h.rot);
    out.push({ p: [h.p[0] + lx * c + lz * sn, ly, h.p[1] - lx * sn + lz * c], s, r: h.rot });
  };
  for (const h of HOUSES) {
    for (let y = 1.4; y < h.h - 0.6; y += 1.6) {
      for (let x = -h.w / 2 + 0.9; x <= h.w / 2 - 0.8; x += 1.5) if (!(y < 2 && Math.abs(x) < 0.8)) place(h, x, y, h.d / 2 + 0.02, [0.7, 0.8, 0.05], WINDOWS);
      for (let z = -h.d / 2 + 1; z <= h.d / 2 - 0.9; z += 1.6) {
        place(h, h.w / 2 + 0.02, y, z, [0.05, 0.8, 0.7], WINDOWS);
        place(h, -h.w / 2 - 0.02, y, z, [0.05, 0.8, 0.7], WINDOWS);
      }
    }
    place(h, 0, 0.75, h.d / 2 + 0.03, [0.9, 1.5, 0.05], DOORS);
  }
}

const PX = E + 2, PZ = E + 2; // góc công viên (Đông–Nam)
const TREES: TreeItem[] = [];
{
  for (const d of [12, 20, 28, 36]) {
    TREES.push({ p: [-(ROAD_HALF + 1.6), -d], s: 0.8, tone: 0 }, { p: [ROAD_HALF + 1.6, d], s: 0.8, tone: 0 }, { p: [d, -(ROAD_HALF + 1.6)], s: 0.8, tone: 0 }, { p: [-d, ROAD_HALF + 1.6], s: 0.8, tone: 0 });
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.25;
    TREES.push({ p: [Math.cos(a) * 54, Math.sin(a) * 54], s: 1.4, tone: (i % 2) as 0 | 1 });
  }
  TREES.push({ p: [PX + 3, PZ + 3], s: 1.2, tone: 1 }, { p: [PX + 4, PZ + 15], s: 1, tone: 1 }, { p: [PX + 15, PZ + 14], s: 1.3, tone: 0 }, { p: [PX + 3, PZ + 9], s: 0.8, tone: 1 });
  TREES.push({ p: [-(E + 20), -(E + 14)], s: 1.1, tone: 0 }, { p: [E + 14, -(E + 13)], s: 1.2, tone: 1 }, { p: [-(E + 13), E + 13], s: 1, tone: 0 });
}
const FENCE: BoxItem[] = [];
for (let d = 0; d <= 18; d += 2) FENCE.push({ p: [PX + d, 0.4, PZ - 0.2], s: [0.12, 0.6, 0.12] }, { p: [PX - 0.2, 0.4, PZ + d], s: [0.12, 0.6, 0.12] });
FENCE.push({ p: [PX + 9, 0.55, PZ - 0.2], s: [18, 0.08, 0.08] }, { p: [PX - 0.2, 0.55, PZ + 9], s: [0.08, 0.08, 18] });

// ---------- thành phần ----------
function House({ h }: { h: HouseDef }) {
  return (
    <group position={[h.p[0], 0, h.p[1]]} rotation={[0, h.rot, 0]}>
      <mesh position={[0, h.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[h.w, h.h, h.d]} />
        <meshStandardMaterial color={h.wall} roughness={0.85} />
      </mesh>
      {/* mái chóp 4 cạnh */}
      <mesh position={[0, h.h + 0.9, 0]} rotation={[0, Math.PI / 4, 0]} scale={[h.w * 0.74, 1, h.d * 0.74]} castShadow>
        <coneGeometry args={[1, 1.8, 4]} />
        <meshStandardMaterial color={h.roof} roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

function StreetLamp({ p, rot }: { p: [number, number]; rot: number }) {
  return (
    <group position={[p[0], 0.26, p[1]]} rotation={[0, rot, 0]}>
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 4.4, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 4.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0.95, 4.25, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.3]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde68a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Park() {
  return (
    <group>
      <mesh position={[PX + 9, 0.06, PZ + 9]} receiveShadow>
        <boxGeometry args={[18, 0.12, 18]} />
        <meshStandardMaterial color="#86efac" roughness={1} />
      </mesh>
      <mesh position={[PX + 9, 0.13, PZ + 9]} receiveShadow>
        <boxGeometry args={[2, 0.04, 18]} />
        <meshStandardMaterial color="#e7d7b5" />
      </mesh>
      <mesh position={[PX + 9, 0.131, PZ + 9]} receiveShadow>
        <boxGeometry args={[18, 0.04, 2]} />
        <meshStandardMaterial color="#e7d7b5" />
      </mesh>
      {/* hồ nước có bờ đá (bờ thấp hơn mặt nước để không bị nhấp nháy) */}
      <mesh position={[PX + 13.5, 0.15, PZ + 4.5]} receiveShadow>
        <cylinderGeometry args={[3, 3.1, 0.18, 28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[PX + 13.5, 0.26, PZ + 4.5]}>
        <cylinderGeometry args={[2.6, 2.6, 0.06, 28]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.2} />
      </mesh>
      {/* ghế đá */}
      {[PX + 7.3, PX + 10.7].map((x) => (
        <group key={x} position={[x, 0, PZ + 13]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.6, 0.12, 0.5]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
          {[-0.6, 0.6].map((o) => (
            <mesh key={o} position={[o, 0.25, 0]}>
              <boxGeometry args={[0.14, 0.5, 0.45]} />
              <meshStandardMaterial color="#64748b" />
            </mesh>
          ))}
        </group>
      ))}
      <InstancedBoxes items={FENCE} color="#f8fafc" />
      {/* bồn hoa */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[PX + 6 + (i % 7) * 0.9, 0.25, PZ + 5.4 + Math.floor(i / 7) * 0.9]}>
          <sphereGeometry args={[0.22, 6, 5]} />
          <meshStandardMaterial color={["#f472b6", "#facc15", "#f87171"][i % 3]} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function CityProps() {
  return (
    <group>
      {/* nền cỏ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[MAP * 2 + 40, MAP * 2 + 40]} />
        <meshStandardMaterial color="#a3d977" roughness={1} />
      </mesh>
      {/* mặt đường */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[ROAD_HALF * 2, 0.04, MAP * 2]} />
        <meshStandardMaterial color="#3f4652" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.021, 0]} receiveShadow>
        <boxGeometry args={[MAP * 2, 0.04, ROAD_HALF * 2]} />
        <meshStandardMaterial color="#3f4652" roughness={0.95} />
      </mesh>
      <InstancedBoxes items={WHITE} color="#f8fafc" />
      <InstancedBoxes items={YELLOW} color="#facc15" />
      <InstancedBoxes items={WALKS} color="#cbd5e1" rough={0.9} />
      <InstancedBoxes items={CURBS} color="#94a3b8" />
      <Park />
      {HOUSES.map((h, i) => <House key={i} h={h} />)}
      <InstancedBoxes items={WINDOWS} color="#e0f2fe" emissive="#7dd3fc" rough={0.2} />
      <InstancedBoxes items={DOORS} color="#7c4a2d" />
      <InstancedTrees items={TREES} />
      {[16, 32].flatMap((d) => [
        <StreetLamp key={`l1${d}`} p={[ROAD_HALF + 0.9, -d]} rot={Math.PI} />,
        <StreetLamp key={`l2${d}`} p={[-(ROAD_HALF + 0.9), d]} rot={0} />,
        <StreetLamp key={`l3${d}`} p={[-d, -(ROAD_HALF + 0.9)]} rot={-Math.PI / 2} />,
        <StreetLamp key={`l4${d}`} p={[d, ROAD_HALF + 0.9]} rot={Math.PI / 2} />,
      ])}
    </group>
  );
}

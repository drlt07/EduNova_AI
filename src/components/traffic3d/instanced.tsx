"use client";
import { useLayoutEffect, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";

export type BoxItem = { p: [number, number, number]; s: [number, number, number]; r?: number };

/** Nhiều hộp cùng màu vẽ trong MỘT draw call (instancing) — dùng cho vạch kẻ, cửa sổ, hàng rào. */
export function InstancedBoxes({ items, color, emissive, cast = false, receive = true, rough = 0.85 }: { items: BoxItem[]; color: string; emissive?: string; cast?: boolean; receive?: boolean; rough?: number }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.scale.set(...it.s);
      o.rotation.set(0, it.r ?? 0, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={rough} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 0.15 : 0} />
    </instancedMesh>
  );
}

export type TreeItem = { p: [number, number]; s: number; tone: 0 | 1 };

/** Rừng cây low-poly: thân + 2 khối tán, mỗi phần một draw call. */
export function InstancedTrees({ items }: { items: TreeItem[] }) {
  const trunk = useRef<InstancedMesh>(null);
  const crownA = useRef<InstancedMesh>(null);
  const crownB = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new Object3D();
    const set = (m: InstancedMesh | null, f: (it: TreeItem) => [number, number, number, number]) => {
      if (!m) return;
      items.forEach((it, i) => {
        const [x, y, z, k] = f(it);
        o.position.set(x, y, z);
        o.scale.setScalar(k);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, it.tone ? GREEN_DARK : GREEN);
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    };
    set(trunk.current, (t) => [t.p[0], 0.8 * t.s, t.p[1], t.s]);
    set(crownA.current, (t) => [t.p[0], 2.2 * t.s, t.p[1], t.s]);
    set(crownB.current, (t) => [t.p[0] + 0.35 * t.s, 2.9 * t.s, t.p[1] + 0.1 * t.s, t.s]);
  }, [items]);
  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, items.length]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 1.6, 6]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={crownA} args={[undefined, undefined, items.length]} castShadow>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={crownB} args={[undefined, undefined, items.length]} castShadow>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
    </group>
  );
}

const GREEN = new Color("#22c55e");
const GREEN_DARK = new Color("#15803d");

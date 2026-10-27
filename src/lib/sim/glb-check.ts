/** Inside Computer 3D (giai đoạn 2): kiểm tra asset GLB có đủ mesh bắt buộc. */
export const REQUIRED_PC_MESHES = ["Case", "Motherboard", "CPU", "RAM", "SSD", "GPU", "PSU", "CPU_Cooler"] as const;

export function checkMeshes(meshNames: readonly string[]): { ok: boolean; missing: string[]; present: string[] } {
  const set = new Set(meshNames);
  const missing = REQUIRED_PC_MESHES.filter((m) => !set.has(m));
  const present = REQUIRED_PC_MESHES.filter((m) => set.has(m));
  return { ok: missing.length === 0, missing, present };
}

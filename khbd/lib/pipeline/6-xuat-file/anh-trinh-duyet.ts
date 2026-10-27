/** SVG → PNG trên trình duyệt (canvas), dùng khi xuất đồ thị app vẽ lại vào file Word. */
import type { HamRaster } from "../5-kiem-tra/doi-chieu-hinh";

export const rasterTrinhDuyet: HamRaster = async (svg, rong, cao, tiLe) => {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const anh = new Image();
    await new Promise((ok, loi) => { anh.onload = ok; anh.onerror = () => loi(new Error("Không vẽ được đồ thị.")); anh.src = url; });
    const c = document.createElement("canvas");
    c.width = Math.round(rong * tiLe);
    c.height = Math.round(cao * tiLe);
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(anh, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob>((ok, loi) => c.toBlob((b) => (b ? ok(b) : loi(new Error("Không vẽ được đồ thị."))), "image/png"));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
};

import { NguonDuLieu } from "@khbd/components/NguonDuLieu";
import { TieuDeTrang } from "@khbd/components/KhungTrang";
import { TraCuuNangLucSo } from "@khbd/components/TraCuuNangLucSo";

export default function TrangTraCuuNangLucSo() {
  return (
    <div>
      <TieuDeTrang tieuDe="Tra cứu năng lực số" moTa="Chỉ báo bậc 5 (lớp 10 – 12) theo Thông tư 02/2025/TT-BGDĐT." />
      <TraCuuNangLucSo />
      <NguonDuLieu />
    </div>
  );
}

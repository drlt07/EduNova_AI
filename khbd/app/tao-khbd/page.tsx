import { TieuDeTrang } from "@khbd/components/KhungTrang";
import { TaoKhbd } from "./TaoKhbd";

export default function TrangTaoKhbd() {
  return (
    <div>
      <TieuDeTrang tieuDe="Tạo KHBD" moTa="Tải giáo án cũ lên, chọn phần cần tích hợp và duyệt kế hoạch trước khi soạn." />
      <TaoKhbd />
    </div>
  );
}

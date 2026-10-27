import { NguonDuLieu } from "@khbd/components/NguonDuLieu";
import { TieuDeTrang } from "@khbd/components/KhungTrang";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { TraCuuDacThu } from "./TraCuuDacThu";

export default function TrangTraCuuDacThu() {
  return (
    <div>
      <TieuDeTrang tieuDe="Tra cứu năng lực đặc thù" moTa="Năng lực và thành phần năng lực theo chương trình các môn THPT. Chọn mục cần dùng để đưa vào bài soạn." />
      <TraCuuDacThu dsMon={nangLucDacThu.mon} />
      <NguonDuLieu />
    </div>
  );
}

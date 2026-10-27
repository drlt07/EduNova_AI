# Đọc hình trong giáo án

Nhiệm vụ: đọc đúng nội dung một hình trong giáo án của giáo viên để app vẽ lại. Chỉ ghi điều nhìn thấy trên hình
hoặc ghi rõ trong đoạn văn quanh hình. Không suy đoán, không tự tính thêm, không sửa chỗ có vẻ sai.

- `loai`: bang_bien_thien (bảng biến thiên), do_thi (đồ thị hàm số trên hệ trục), cong_thuc (công thức, phương trình
  được chụp thành ảnh), bang (bảng số liệu, bảng chữ), khac (hình minh họa, sơ đồ, ảnh chụp, hình hình học…).
- `ham`: công thức hàm số viết trên hình hoặc trong đoạn văn quanh hình (vd "y = x^3 - 3x + 1", "\frac{2x+1}{x-1}").
  Không có thì để trống; không đoán hàm số từ hình dạng đồ thị hay bảng.
- Bảng biến thiên: `x` là nhãn các mốc theo thứ tự trái sang phải, gồm cả $-\infty$, $+\infty$ (viết "-\infty", "+\infty").
  `daoHamMoc`: chữ ghi ở hàng y' ngay tại mỗi mốc ("0", "||" hoặc ""). `daoHam`: dấu y' trên từng khoảng ("+" hoặc "-"),
  số phần tử ít hơn số mốc một. `y`: giá trị ghi ở hàng y tại mỗi mốc; tại tiệm cận đứng ghi "giá trị trái||giá trị phải".
  Nhãn viết như trên hình, dùng LaTeX cho phân số, căn ("\frac{1}{2}", "1-\sqrt{2}").
- Đồ thị: `diem` là các điểm có tọa độ ghi rõ trên hình (chấm, nét đứt chiếu xuống trục, nhãn số); không ước lượng
  điểm không ghi số. `tiemCanDung`, `tiemCanNgang`: đường tiệm cận vẽ nét đứt có ghi số.
- Công thức: `congThuc` viết bằng LaTeX, không có dấu $; phương trình hóa học dùng \ce{...}.
- Bảng: `bang` là các hàng, mỗi hàng các ô chữ; công thức trong ô viết $...$. Ô gộp thì ghi nội dung vào ô đầu, ô sau để trống.
- Trường không dùng đến để trống (chuỗi rỗng, mảng rỗng).
- `chacChan`: cao khi đọc rõ mọi chữ, số; vua khi có chỗ mờ phải đoán; thap khi hình mờ, bị cắt hoặc không chắc loại hình.
- `moTa`: một câu tiếng Việt nói hình thể hiện gì (vd "Bảng biến thiên của hàm số $y=x^3-3x+1$ trên $\mathbb{R}$").

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chính sách bảo mật và điều khoản" };

/** Mô tả đúng cách bản dùng thử xử lý dữ liệu; văn bản chính thức cần đơn vị vận hành soạn và xác nhận. */
export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Chính sách bảo mật và điều khoản sử dụng</h1>
      <p className="mt-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-fg">
        Đây là mô tả cho <b>bản dùng thử</b>. Văn bản chính thức sẽ do đơn vị vận hành ban hành trước khi triển khai cho trường học.
      </p>

      <section id="bao-mat" className="mt-10 scroll-mt-24" aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="text-xl font-semibold text-fg">Chính sách bảo mật</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Bản dùng thử dùng tài khoản mẫu, không thu thập họ tên, email hay mật khẩu thật.</li>
          <li>Bài làm, ghi chú và tiến độ chỉ được lưu trong bộ nhớ trình duyệt (localStorage) trên thiết bị của bạn, không gửi lên máy chủ.</li>
          <li>Trợ lý AI ở bản dùng thử chạy bằng mẫu gợi ý trong ứng dụng, không gửi nội dung tới dịch vụ AI bên ngoài.</li>
          <li>Trang tải phông chữ từ Google Fonts và trình soạn code từ CDN jsDelivr; các dịch vụ này có thể ghi nhận địa chỉ IP theo chính sách riêng của họ.</li>
          <li>Bạn có thể xóa toàn bộ dữ liệu bằng “Khôi phục dữ liệu demo” trong Cài đặt hoặc xóa dữ liệu trang web của trình duyệt.</li>
        </ul>
      </section>

      <section id="dieu-khoan" className="mt-10 scroll-mt-24" aria-labelledby="terms-h">
        <h2 id="terms-h" className="text-xl font-semibold text-fg">Điều khoản sử dụng</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Bản dùng thử dành cho mục đích trải nghiệm và góp ý, không dùng làm hồ sơ đánh giá chính thức của học sinh.</li>
          <li>Nội dung bài học mang tính minh họa theo Chương trình GDPT 2018, cần giáo viên đối chiếu với sách giáo khoa.</li>
          <li>Gợi ý của trợ lý AI chỉ để tham khảo; quyết định chuyên môn thuộc về giáo viên.</li>
          <li>Dữ liệu có thể mất khi xóa bộ nhớ trình duyệt; không có sao lưu.</li>
        </ul>
      </section>
    </div>
  );
}

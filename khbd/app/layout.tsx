import type { Metadata } from "next";
import { KhungTrangApp } from "@khbd/components/KhungTrangApp";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soạn kế hoạch bài dạy THPT",
  description: "Soạn và nâng cấp kế hoạch bài dạy cho giáo viên THPT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <KhungTrangApp>{children}</KhungTrangApp>
      </body>
    </html>
  );
}

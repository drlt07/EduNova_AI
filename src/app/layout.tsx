import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const appFont = Plus_Jakarta_Sans({
  variable: "--font-app",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "EduNova AI — Hệ sinh thái dạy và học Tin học THPT", template: "%s · EduNova AI" },
  description: "Nền tảng dạy và học Tin học 10, 11, 12 (GDPT 2018): kế hoạch bài dạy, phòng thí nghiệm ảo, chấm bài và thống kê học tập.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B1120" },
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${appFont.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Bỏ qua tới nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Play } from "lucide-react";
import { LIFE_GROUPS, LIFE_LABS } from "@/lib/data/life-labs";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { LifeArt } from "@/components/life/life-registry";
import { KhoGallery } from "@/components/life/kho";

export const metadata: Metadata = { title: "Kho mô phỏng" };

const MOSAIC = ["qr-code", "rgb-pixel", "gps", "password"];

/** Kho mô phỏng công khai: Tin học trong đời sống, ai cũng thử được (khách, học sinh, giáo viên). */
export default function LabsPage() {
  return (
    <>
      <PageHero
        eyebrow="Kho mô phỏng"
        icon={FlaskConical}
        title="Tin học quanh em"
        accent="hoạt động thế nào?"
        description="Mã QR, GPS, mật khẩu, màn hình RGB, tin nhắn mã hóa, bộ lọc thư rác, gợi ý video, nén ảnh — tự tay thử để hiểu công nghệ em dùng mỗi ngày. Không cần tài khoản."
        actions={<Button asChild size="lg"><Link href="/kho/password"><Play /> Thử ngay: Mật khẩu mạnh cỡ nào?</Link></Button>}
        stats={[
          { value: LIFE_LABS.length, label: "mô phỏng đời sống" },
          { value: LIFE_GROUPS.length, label: "nhóm chủ đề" },
          { value: "0đ", label: "không cần tài khoản" },
          { value: "2", label: "màn: Khám phá, Thử thách" },
        ]}
        visual={
          <div className="grid grid-cols-2 gap-3">
            {MOSAIC.map((s, i) => (
              <Link key={s} href={`/kho/${s}`} className={`block overflow-hidden rounded-3xl border-4 border-white shadow-xl transition-transform hover:z-10 hover:scale-105 dark:border-slate-800 ${i % 2 ? "translate-y-6 rotate-2" : "-rotate-2"}`} aria-label={LIFE_LABS.find((l) => l.slug === s)?.title}>
                <LifeArt slug={s} className="aspect-[16/11] w-full" />
              </Link>
            ))}
          </div>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <KhoGallery base="/kho" />
      </div>
    </>
  );
}

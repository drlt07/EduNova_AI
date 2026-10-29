import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlaskConical, Play } from "lucide-react";
import { LIFE_GROUPS, LIFE_LABS } from "@/lib/data/life-labs";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { PageHero } from "@/components/layout/page-hero";
import { LifeArt } from "@/components/life/life-registry";
import { LabsClient } from "./labs-client";

export const metadata: Metadata = { title: "Kho mô phỏng" };

/** Kho mô phỏng công khai: Tin học trong đời sống, ai cũng thử được. */
export default function LabsPage() {
  return (
    <>
      <PageHero
        eyebrow="Kho mô phỏng"
        icon={FlaskConical}
        title="Tin học quanh em"
        accent="hoạt động thế nào?"
        description="Mã QR, GPS, mã vạch siêu thị, tin nhắn mã hóa, bộ lọc thư rác, gợi ý video, nén ảnh — mở từng mô phỏng, tự tay thử để hiểu công nghệ em dùng mỗi ngày. Không cần tài khoản."
        actions={<Button asChild size="lg"><Link href="/kho/qr-code"><Play /> Thử mã QR</Link></Button>}
        stats={[
          { value: LIFE_LABS.length, label: "mô phỏng đời sống" },
          { value: LIFE_GROUPS.length, label: "nhóm chủ đề" },
          { value: "0đ", label: "không cần tài khoản" },
          { value: "2", label: "màn: Khám phá, Thử thách" },
        ]}
        visual={<Link href="/kho/gps" className="block overflow-hidden rounded-3xl border border-line bg-surface shadow-xl"><LifeArt slug="gps" className="aspect-[16/9] w-full" /><p className="p-4 text-sm font-semibold text-fg">Định vị GPS bằng ba vệ tinh →</p></Link>}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Suspense fallback={<PageSkeleton />}>
          <LabsClient />
        </Suspense>
      </div>
    </>
  );
}

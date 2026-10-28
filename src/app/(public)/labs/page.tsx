import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlaskConical, Play, Sprout } from "lucide-react";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { PageHero } from "@/components/layout/page-hero";
import { MiniSimPreview } from "@/components/landing/hero-visuals";
import { LabsClient } from "./labs-client";

export const metadata: Metadata = { title: "Tình huống mô phỏng" };

export default function LabsPage() {
  const playable = LAB_TEMPLATES.filter((l) => l.status !== "planned").length;
  const byGrade = (g: 10 | 11 | 12) => LAB_TEMPLATES.filter((l) => l.grades.includes(g)).length;
  return (
    <>
      <PageHero
        eyebrow="Tình huống mô phỏng"
        icon={FlaskConical}
        title="Kiến thức trở nên sống động"
        accent="qua từng mô phỏng"
        description="Thao tác, thử nghiệm và giải quyết tình huống gắn với bài học Tin học 10, 11, 12. Mỗi mô phỏng ghi rõ dùng được hay đang phát triển."
        actions={
          <>
            <Button asChild size="lg"><Link href="/labs/smart-coding-city"><Play /> Chơi Thành phố giao thông</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/labs/smart-garden"><Sprout /> Vườn tưới thông minh</Link></Button>
          </>
        }
        stats={[
          { value: LAB_TEMPLATES.length, label: "mô phỏng trong kho" },
          { value: playable, label: "chơi được ngay" },
          { value: byGrade(10), label: "cho Tin học 10" },
          { value: byGrade(11) + byGrade(12), label: "cho Tin học 11, 12" },
        ]}
        visual={<MiniSimPreview href="/labs/smart-coding-city" />}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 text-xl font-bold text-fg">Tất cả mô phỏng</h2>
        <Suspense fallback={<PageSkeleton />}>
          <LabsClient />
        </Suspense>
      </div>
    </>
  );
}

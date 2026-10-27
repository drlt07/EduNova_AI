"use client";
import { CheckCircle2, PackageX } from "lucide-react";
import { getLabBySlug } from "@/lib/data/labs";
import { checkMeshes } from "@/lib/sim/glb-check";
import { DEFAULT_GARDEN_PARAMS, gardenTestCases } from "@/lib/sim/smart-garden";
import { EmptyState } from "@/components/ui/feedback";
import { SmartGardenLab } from "./smart-garden/smart-garden-lab";
import { BinaryLab } from "./binary-lab";
import { WebCreator } from "./web-creator";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/feedback";

const SmartTrafficCity = dynamic(() => import("@/components/traffic3d/smart-traffic-city").then((m) => m.SmartTrafficCity), { ssr: false, loading: () => <Skeleton className="h-[560px] w-full rounded-2xl" /> });

/** Bản chạy thử công khai: không ghi sự kiện (không có attempt). */
export function LabPreview({ slug, onSaveWeb }: { slug: string; onSaveWeb?: (content: string) => void }) {
  const lab = getLabBySlug(slug);
  if (!lab) return null;
  if (slug === "smart-garden") return <SmartGardenLab params={DEFAULT_GARDEN_PARAMS} testCases={gardenTestCases(DEFAULT_GARDEN_PARAMS.threshold)} mode="explore" />;
  if (slug === "binary-logic") return <BinaryLab />;
  if (slug === "smart-coding-city") return <SmartTrafficCity />;
  if (slug === "web-creator") return <WebCreator onSave={onSaveWeb} />;
  if (slug === "inside-computer-3d") {
    // Không có file GLB trong repo → báo thiếu mesh thay vì dựng giả chức năng.
    const check = checkMeshes([]);
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <PackageX className="size-8 text-warning-fg" aria-hidden />
          <div>
            <p className="font-semibold text-fg">Phòng thí nghiệm này đang được xây dựng</p>
            <p className="text-sm text-muted">Còn thiếu mô hình 3D của {check.missing.length}/{check.missing.length + check.present.length} linh kiện dưới đây.</p>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...check.present.map((m) => [m, true] as const), ...check.missing.map((m) => [m, false] as const)].map(([m, ok]) => (
            <li key={m} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm">
              {ok ? <CheckCircle2 className="size-4 text-success-fg" /> : <PackageX className="size-4 text-danger-fg" aria-label="thiếu" />} {m}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <EmptyState title="Sắp có" description={`"${lab.title}" đang được xây dựng. Bạn có thể xem mục tiêu và bài tập mẫu bên dưới.`} />;
}

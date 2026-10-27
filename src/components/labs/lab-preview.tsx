"use client";
import { getLabBySlug } from "@/lib/data/labs";
import { InsideComputerLab } from "@/components/pc3d/inside-computer-lab";
import { NetworkLab } from "@/components/network/network-lab";
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
  if (slug === "inside-computer-3d") return <InsideComputerLab />;
  if (slug === "network-journey") return <NetworkLab />;
  return <EmptyState title="Sắp có" description={`"${lab.title}" đang được xây dựng. Bạn có thể xem mục tiêu và bài tập mẫu bên dưới.`} />;
}

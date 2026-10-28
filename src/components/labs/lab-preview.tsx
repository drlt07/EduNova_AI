"use client";
import { LabResultScope } from "@/components/sim/lab-result";
import { getLabBySlug } from "@/lib/data/labs";
import { InsideComputerLab } from "@/components/pc3d/inside-computer-lab";
import { NetworkLab } from "@/components/network/network-lab";
import { OsExplorerLab } from "@/components/os/os-explorer-lab";
import { DatabaseCityLab } from "@/components/db/database-city-lab";
import { SqlDetectiveLab } from "@/components/sql/sql-detective-lab";
import { DebugDetectiveLab } from "@/components/debug/debug-detective-lab";
import { DigitalSafetyLab } from "@/components/safety/digital-safety-lab";
import { AiDiscoveryLab } from "@/components/ai/ai-discovery-lab";
import { DigitalCitizenLab } from "@/components/citizen/digital-citizen-lab";
import { DEFAULT_GARDEN_PARAMS, gardenTestCases } from "@/lib/sim/smart-garden";
import { EmptyState } from "@/components/ui/feedback";
import { SmartGardenLab } from "./smart-garden/smart-garden-lab";
import { BinaryLab } from "./binary-lab";
import { WebCreator } from "./web-creator";
import dynamic from "next/dynamic";
import { BinaryControlLab } from "@/components/phet/binary-control";
import { SmartHomeLab } from "@/components/phet/smart-home";
import { DigitalCameraLab } from "@/components/phet/digital-camera";
import { RobotFactoryLab } from "@/components/phet/robot-factory";
import { MazeRobotLab } from "@/components/phet/maze-robot";
import { SoftwareEcosystemLab } from "@/components/phet/software-ecosystem";
import { DeviceConnectionLab } from "@/components/phet/device-connection";
import { CloudSharingLab } from "@/components/phet/cloud-sharing";
import { NetworkBuilderLab } from "@/components/phet/network-builder";
import { CssBoxLab } from "@/components/phet/css-box";
import { WebNavigationLab } from "@/components/phet/web-navigation";

/** Mô phỏng kiểu PhET (màn Khám phá + Thử thách). */
const PHET: Record<string, () => React.ReactElement> = {
  "binary-control": BinaryControlLab,
  "smart-home": SmartHomeLab,
  "digital-camera": DigitalCameraLab,
  "robot-factory": RobotFactoryLab,
  "maze-robot": MazeRobotLab,
  "software-ecosystem": SoftwareEcosystemLab,
  "device-connection": DeviceConnectionLab,
  "cloud-sharing": CloudSharingLab,
  "network-builder": NetworkBuilderLab,
  "css-box": CssBoxLab,
  "web-navigation": WebNavigationLab,
};
import { Skeleton } from "@/components/ui/feedback";

const SmartTrafficCity = dynamic(() => import("@/components/traffic3d/smart-traffic-city").then((m) => m.SmartTrafficCity), { ssr: false, loading: () => <Skeleton className="h-[560px] w-full rounded-2xl" /> });

/** Bản chạy thử công khai: không ghi sự kiện (không có attempt). */
/** Mô phỏng chạy được; các mô phỏng có nhiệm vụ tự chấm điểm khi học sinh làm xong. */
export function LabPreview({ slug, onSaveWeb }: { slug: string; onSaveWeb?: (content: string) => void }) {
  return <LabResultScope slug={slug}><LabBody slug={slug} onSaveWeb={onSaveWeb} /></LabResultScope>;
}

function LabBody({ slug, onSaveWeb }: { slug: string; onSaveWeb?: (content: string) => void }) {
  const lab = getLabBySlug(slug);
  if (!lab) return null;
  if (slug === "smart-garden") return <SmartGardenLab params={DEFAULT_GARDEN_PARAMS} testCases={gardenTestCases(DEFAULT_GARDEN_PARAMS.threshold)} mode="explore" />;
  if (slug === "binary-logic") return <BinaryLab />;
  if (slug === "smart-coding-city") return <SmartTrafficCity />;
  if (slug === "web-creator") return <WebCreator onSave={onSaveWeb} />;
  if (slug === "inside-computer-3d") return <InsideComputerLab />;
  if (slug === "network-journey") return <NetworkLab />;
  if (slug === "os-explorer") return <OsExplorerLab />;
  if (slug === "database-city") return <DatabaseCityLab />;
  if (slug === "sql-detective") return <SqlDetectiveLab />;
  if (slug === "debug-detective") return <DebugDetectiveLab />;
  if (slug === "digital-safety") return <DigitalSafetyLab />;
  if (slug === "ai-discovery") return <AiDiscoveryLab />;
  if (slug === "digital-citizen") return <DigitalCitizenLab />;
  const Phet = PHET[slug];
  if (Phet) return <Phet />;
  return <EmptyState title="Sắp có" description={`"${lab.title}" đang được xây dựng. Bạn có thể xem mục tiêu và bài tập mẫu bên dưới.`} />;
}

"use client";
import { LabResultScope } from "@/components/sim/lab-result";
import { getLabBySlug } from "@/lib/data/labs";
import { InsideComputerLab } from "@/components/pc3d/inside-computer-lab";
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
import { OsCenterLab } from "@/components/phet/os-center";
import { DatabaseCityLab } from "@/components/phet/database-city";
import { SqlDetectiveLab } from "@/components/phet/sql-detective";
import { DebugDetectiveLab } from "@/components/phet/debug-detective";
import { DigitalSafetyLab } from "@/components/phet/digital-safety";
import { AiDiscoveryLab } from "@/components/phet/ai-discovery";
import { DigitalCitizenLab } from "@/components/phet/digital-citizen";
import { NetworkJourneyLab } from "@/components/phet/network-journey";
import { InfoProcessorLab } from "@/components/phet/info-processor";
import { TextEncodingLab } from "@/components/phet/text-encoding";
import { VariableBoxesLab } from "@/components/phet/variable-boxes";
import { ListLab } from "@/components/phet/list-lab";
import { StringLab } from "@/components/phet/string-lab";
import { FunctionMachineLab } from "@/components/phet/function-machine";

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
  "os-explorer": OsCenterLab,
  "database-city": DatabaseCityLab,
  "sql-detective": SqlDetectiveLab,
  "debug-detective": DebugDetectiveLab,
  "digital-safety": DigitalSafetyLab,
  "ai-discovery": AiDiscoveryLab,
  "digital-citizen": DigitalCitizenLab,
  "network-journey": NetworkJourneyLab,
  "info-processor": InfoProcessorLab,
  "text-encoding": TextEncodingLab,
  "variable-boxes": VariableBoxesLab,
  "list-lab": ListLab,
  "string-lab": StringLab,
  "function-machine": FunctionMachineLab,
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
  const Phet = PHET[slug];
  if (Phet) return <Phet />;
  return <EmptyState title="Sắp có" description={`"${lab.title}" đang được xây dựng. Bạn có thể xem mục tiêu và bài tập mẫu bên dưới.`} />;
}

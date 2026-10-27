"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getGame, WORLDS } from "@/lib/data/games";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { LabPreview } from "@/components/labs/lab-preview";
import { SmartFarmGame } from "@/components/student/smart-farm-game";

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();
  const { d, user } = useSessionData();
  const game = getGame(slug);
  if (!game) return <ErrorState page title="Không tìm thấy trò chơi" action={<Button asChild><Link href="/student/games">Về thư viện trò chơi</Link></Button>} />;
  const back = <Button asChild variant="ghost" size="sm" className="mb-3"><Link href="/student/games"><ArrowLeft /> Trò chơi mô phỏng</Link></Button>;
  if (game.slug === "smart-farm")
    return (
      <>
        {back}
        <Suspense fallback={<PageSkeleton />}><SmartFarmGame /></Suspense>
      </>
    );
  return (
    <>
      {back}
      <PageHeader title={game.title} description={`${WORLDS.find((w) => w.id === game.worldId)?.name} · ${game.focus}`} />
      {game.status === "available" && game.labSlug ? (
        <LabPreview slug={game.labSlug} onSaveWeb={(content) => d.savePortfolioVersion({ studentId: user.id, kind: "web", title: "Trang web của em", content, itemId: d.portfolio.find((p) => p.studentId === user.id && p.kind === "web")?.id })} />
      ) : (
        <EmptyState title="Trò chơi đang được xây dựng" description={game.description} />
      )}
    </>
  );
}

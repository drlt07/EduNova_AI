import type { Metadata } from "next";
import { ALGO_IDS, ALGOS, isAlgoId } from "@/lib/data/hsg";
import { AlgoPage } from "@/components/algo/algo-page";

export function generateStaticParams() {
  return ALGO_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/thuat-toan/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: isAlgoId(id) ? `${ALGOS[id].title} · Chuyên đề HSG` : "Không tìm thấy thuật toán" };
}

export default async function Page({ params }: PageProps<"/thuat-toan/[id]">) {
  const { id } = await params;
  return <AlgoPage id={id} />;
}

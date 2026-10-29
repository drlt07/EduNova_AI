"use client";
import { useParams } from "next/navigation";
import { KhoSim } from "@/components/life/kho";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  return <KhoSim slug={slug} base="/student/kho" />;
}

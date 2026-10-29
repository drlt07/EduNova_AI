"use client";
import { useParams } from "next/navigation";
import { KhoSim } from "@/components/life/kho";

/** Một mô phỏng trong Kho mô phỏng công khai. */
export default function KhoSimPage() {
  const { slug } = useParams<{ slug: string }>();
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><KhoSim slug={slug} base="/kho" /></div>;
}

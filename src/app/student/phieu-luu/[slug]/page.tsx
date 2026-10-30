"use client";
import { useParams } from "next/navigation";
import { AdventurePlay } from "@/components/nova/adventures";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  return <AdventurePlay slug={slug} base="/student/phieu-luu" khoBase="/student/kho" />;
}

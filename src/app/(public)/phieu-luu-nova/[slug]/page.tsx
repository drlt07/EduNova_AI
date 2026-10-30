"use client";
import { useParams } from "next/navigation";
import { AdventurePlay } from "@/components/nova/adventures";
import { NOVA_PATH } from "@/lib/data/nova-adventure";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><AdventurePlay slug={slug} base={NOVA_PATH} khoBase="/kho" /></div>;
}

"use client";
import { useParams } from "next/navigation";
import { BookReader } from "@/components/sgk/reader";

export default function Page() {
  const { ref } = useParams<{ ref: string }>();
  return <BookReader key={ref} refId={ref} role="teacher" />;
}

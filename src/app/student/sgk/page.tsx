"use client";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/feedback";
import { SgkLibrary } from "@/components/sgk/library";

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SgkLibrary role="student" />
    </Suspense>
  );
}

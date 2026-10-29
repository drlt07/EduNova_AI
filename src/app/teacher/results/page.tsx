"use client";
import { AssessTabs } from "@/components/teacher/assess-tabs";
import { Gradebook } from "@/components/teacher/gradebook";

/** Sổ điểm của các lớp: bài thuộc khóa học và bài giao độc lập. */
export default function ResultsPage() {
  return (
    <>
      <AssessTabs />
      <Gradebook />
    </>
  );
}

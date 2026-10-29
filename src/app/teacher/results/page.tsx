"use client";
import { ClassesHeader } from "@/components/teacher/assess-tabs";
import { Gradebook } from "@/components/teacher/gradebook";

/** Sổ điểm của các lớp: bài thuộc khóa học và bài giao độc lập. */
export default function ResultsPage() {
  return (
    <>
      <ClassesHeader subtitle="Sổ điểm từng lớp, quy về thang 10" />
      <Gradebook />
    </>
  );
}

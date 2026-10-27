/** Sinh học liệu MẪU từ dữ liệu bài học (template, không phải AI). Luôn ở trạng thái "chờ duyệt". */
import { getLesson, getObjective } from "@/lib/data/curriculum";
import type { ResourceKind } from "@/lib/domain/types";

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  "question-bank": "Ngân hàng câu hỏi",
  flashcards: "Thẻ ghi nhớ",
  diagram: "Sơ đồ tư duy",
  worksheet: "Phiếu học tập",
};

export function generateResourceItems(lessonId: string, kind: ResourceKind): { title: string; items: { front: string; back: string }[] } {
  const l = getLesson(lessonId);
  if (!l) return { title: "", items: [] };
  const objs = l.objectiveIds.map((id) => getObjective(id)!).filter(Boolean);
  const concepts = l.concepts ?? l.keywords.map((k) => ({ term: k, definition: `(Giáo viên bổ sung định nghĩa cho "${k}")` }));
  switch (kind) {
    case "question-bank":
      return {
        title: `Ngân hàng câu hỏi: ${l.title}`,
        items: [
          ...(l.quiz ?? []).map((q) => ({ front: `${q.prompt} (${q.options.join(" / ")})`, back: `${q.options[q.correctIndex]} — ${q.explanation}` })),
          ...objs.map((o) => ({ front: `Câu hỏi mở (${o.id}): Hãy trình bày/vận dụng — ${o.description}`, back: "(Đáp án mẫu do giáo viên bổ sung)" })),
        ],
      };
    case "flashcards":
      return { title: `Thẻ ghi nhớ: ${l.title}`, items: concepts.map((c) => ({ front: c.term, back: c.definition })) };
    case "diagram":
      return { title: `Sơ đồ: ${l.title}`, items: [{ front: l.title, back: "Chủ đề trung tâm" }, ...concepts.map((c) => ({ front: `├─ ${c.term}`, back: c.definition })), ...objs.map((o) => ({ front: `└─ Mục tiêu ${o.id}`, back: o.description }))] };
    case "worksheet":
      return {
        title: `Phiếu học tập: ${l.title}`,
        items: [
          { front: "Nhiệm vụ 1 — Quan sát", back: `Ghi lại 3 điều em quan sát được về: ${l.summary}` },
          ...objs.map((o, i) => ({ front: `Nhiệm vụ ${i + 2} — ${o.level}`, back: o.description })),
          { front: "Tự đánh giá", back: "Em đã đạt mục tiêu nào? Điều gì còn băn khoăn?" },
        ],
      };
  }
}

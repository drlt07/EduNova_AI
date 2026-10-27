/**
 * "Soạn mới" khi giáo viên chưa có KHBD: dựng bản khởi đầu từ dữ liệu bài học EduNova (yêu cầu cần đạt, tóm tắt,
 * thuật ngữ, câu hỏi, bài tập vận dụng), GV sửa từng mục, rồi tạo .docx đúng cấu trúc KHBD (I. Mục tiêu,
 * II. Thiết bị, III. Tiến trình, Hoạt động 1–4) để đưa vào trợ lý như một file tải lên.
 */
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import type { Lesson } from "@/lib/domain/types";
import { getObjective } from "@/lib/data/curriculum";
import { getLessonContent } from "@/lib/data/lesson-content";
import { LAB_TEMPLATES } from "@/lib/data/labs";

export interface StarterActivity {
  title: string;
  /** Mỗi dòng một đoạn */
  body: string;
}

export interface StarterDraft {
  title: string;
  /** Số thứ tự bài trong bộ sách (dòng "BÀI n. TÊN BÀI") */
  order: number;
  grade: number;
  periods: number;
  knowledge: string;
  competencies: string;
  qualities: string;
  equipment: string;
  activities: StarterActivity[];
}

const lines = (...xs: (string | undefined | false)[]) => xs.filter(Boolean).join("\n");

/** Bản khởi đầu: chỉ dùng dữ liệu bài học có sẵn; phần không có dữ liệu ghi câu ngắn để GV thay. */
export function buildStarterDraft(lesson: Lesson, periods: number): StarterDraft {
  const content = getLessonContent(lesson.key);
  const objectives = lesson.objectiveIds.map((id) => getObjective(id)?.description).filter((x): x is string => Boolean(x));
  const lab = LAB_TEMPLATES.find((l) => l.status !== "planned" && l.objectiveIds.some((o) => lesson.objectiveIds.includes(o)));
  const quiz = (lesson.quiz ?? []).slice(0, 4).map((q, i) => `Câu ${i + 1}. ${q.prompt} ${q.options.map((o, k) => `${"ABCD"[k]}. ${o}`).join("  ")}`);
  const exercise = content?.exercises[0];
  return {
    title: lesson.title,
    order: lesson.order,
    grade: lesson.grade,
    periods,
    knowledge: objectives.join("\n") || lesson.summary,
    competencies: lines(
      "Tự chủ và tự học: tự đọc nội dung bài, thử nghiệm và tự kiểm tra kết quả.",
      "Giao tiếp và hợp tác: trao đổi, trình bày cách làm trong nhóm.",
      `Giải quyết vấn đề với sự hỗ trợ của CNTT-TT: vận dụng kiến thức bài "${lesson.title}" để giải quyết tình huống cụ thể.`,
    ),
    qualities: "Chăm chỉ, cẩn thận và trung thực khi thực hành, kiểm tra kết quả.",
    equipment: lines("Máy tính, máy chiếu.", lesson.keywords.includes("python") && "Máy tính học sinh đã cài Python hoặc trình soạn Python trên EduNova.", "Phiếu học tập."),
    activities: [
      { title: "Hoạt động 1: Khởi động", body: lines(content ? `GV nêu tình huống: ${content.warmUp.question}` : `GV nêu một tình huống thực tế gắn với nội dung: ${lesson.summary}`, "HS suy nghĩ, trao đổi cặp đôi và nêu dự đoán.") },
      {
        title: "Hoạt động 2: Hình thành kiến thức mới",
        body: lines(`GV giới thiệu: ${lesson.summary}`, ...(lesson.concepts ?? []).map((c) => `${c.term}: ${c.definition}`), ...(content?.examples.slice(0, 1).map((e) => `Ví dụ: ${e.title}. ${e.explain}`) ?? [])),
      },
      { title: "Hoạt động 3: Luyện tập", body: quiz.length ? quiz.join("\n") : "HS làm bài tập luyện tập theo nội dung vừa học; GV chữa và chốt kiến thức." },
      {
        title: "Hoạt động 4: Vận dụng",
        body: lines(exercise ? `HS thực hiện: ${exercise.task}` : `HS vận dụng kiến thức bài "${lesson.title}" vào một tình huống thực tế.`, lab && `Thực hành trên mô phỏng ${lab.title}: ${lab.sampleTasks[0] ?? lab.tagline}`),
      },
    ],
  };
}

const p = (text: string) => new Paragraph({ children: [new TextRun(text)] });
const bold = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true })] });
const center = (text: string) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true })] });
const bullets = (text: string) => text.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => new Paragraph({ text: s, bullet: { level: 0 } }));
const paras = (text: string) => text.split("\n").map((s) => s.trim()).filter(Boolean).map(p);

/** Tạo .docx từ bản khởi đầu (cùng cấu trúc giáo án mẫu của trợ lý nên bộ phân tích nhận đúng mục và hoạt động). */
export async function starterDocx(d: StarterDraft): Promise<Uint8Array> {
  const children = [
    center("KẾ HOẠCH BÀI DẠY"),
    p(`Môn: Tin học. Lớp: ${d.grade}`),
    center(`BÀI ${d.order}. ${d.title.toUpperCase()}`),
    p(`Thời gian thực hiện: ${d.periods} tiết`),
    bold("I. MỤC TIÊU"),
    bold("1. Kiến thức"),
    ...bullets(d.knowledge),
    bold("2. Năng lực"),
    ...bullets(d.competencies),
    bold("3. Phẩm chất"),
    ...bullets(d.qualities),
    bold("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
    ...bullets(d.equipment),
    bold("III. TIẾN TRÌNH DẠY HỌC"),
    ...d.activities.flatMap((a) => [bold(a.title), ...paras(a.body)]),
  ];
  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
  return new Uint8Array(await blob.arrayBuffer());
}

export function starterFileName(d: StarterDraft) {
  const slug = d.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `KHBD_khoi_dau_Tin_${d.grade}_${slug}.docx`;
}

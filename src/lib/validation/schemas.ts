import { z } from "zod";

const phase = z.enum(["mo-dau", "hinh-thanh", "luyen-tap", "van-dung"]);

export const planActivitySchema = z.object({
  id: z.string(),
  phase,
  title: z.string().trim().min(2, "Đặt tên hoạt động (≥ 2 ký tự)").max(200),
  objectiveIds: z.array(z.string()),
  content: z.string().max(4000),
  product: z.string().max(1000),
  organization: z.string().max(1000),
  labTemplateId: z.string().optional(),
  evidence: z.string().max(1000),
});

export const lessonPlanSchema = z.object({
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự").max(200),
  grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
  textbookId: z.enum(["kntt", "cd", "ctst"]),
  lessonId: z.string().min(1, "Chọn bài học"),
  objectiveIds: z.array(z.string()).min(1, "Chọn ít nhất 1 mục tiêu"),
  durationMinutes: z.number({ message: "Nhập số phút" }).int().min(15, "Tối thiểu 15 phút").max(180, "Tối đa 180 phút"),
  notes: z.string().max(4000),
  status: z.enum(["draft", "published"]),
  visibility: z.enum(["private", "class", "school", "public"]),
  activities: z.array(planActivitySchema),
});
export type LessonPlanForm = z.infer<typeof lessonPlanSchema>;

export const gardenParamsSchema = z.object({
  threshold: z.number({ message: "Nhập ngưỡng" }).int("Ngưỡng phải là số nguyên").min(10, "Ngưỡng tối thiểu 10%").max(90, "Ngưỡng tối đa 90%"),
  requireWater: z.boolean(),
  initialHumidity: z.number({ message: "Nhập độ ẩm" }).int().min(0, "0–100%").max(100, "0–100%"),
  initialHasWater: z.boolean(),
  allowRuleEditor: z.boolean(),
});

const labConfigCore = z.object({
  mode: z.enum(["explore", "challenge", "assessment"]),
  hintMode: z.enum(["off", "guided", "full"]),
  params: gardenParamsSchema,
  testCaseIds: z.array(z.string()).min(3, "Chọn ít nhất 3 trường hợp kiểm tra"),
});

/** Ràng buộc chéo dùng chung cho Lab Studio và Activity Builder. */
function refineLabConfig(v: z.infer<typeof labConfigCore>, ctx: z.RefinementCtx, prefix: (string | number)[] = []) {
  if (v.mode === "assessment" && v.hintMode !== "off")
    ctx.addIssue({ code: "custom", path: [...prefix, "hintMode"], message: "Chế độ Kiểm tra phải chọn \"Không gợi ý\"." });
  if (!v.testCaseIds.includes("tc-equal"))
    ctx.addIssue({ code: "custom", path: [...prefix, "testCaseIds"], message: "Cần có trường hợp \"Bằng ngưỡng\" để kiểm tra giá trị biên." });
  if (v.mode === "challenge" && v.testCaseIds.length < 5)
    ctx.addIssue({ code: "custom", path: [...prefix, "testCaseIds"], message: "Chế độ Thử thách cần ít nhất 5 trường hợp kiểm tra." });
}

export const labConfigSchema = labConfigCore
  .extend({ title: z.string().trim().min(3, "Đặt tên cấu hình").max(120), visibility: z.enum(["private", "class", "school", "public"]) })
  .superRefine((v, ctx) => refineLabConfig(v, ctx));
export type LabConfigForm = z.infer<typeof labConfigSchema>;

const questionSchema = z
  .object({
    id: z.string(),
    kind: z.enum(["mcq", "short"]),
    prompt: z.string().trim().min(5, "Câu hỏi tối thiểu 5 ký tự").max(500),
    options: z.array(z.string().max(200)),
    correctIndex: z.number().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.kind === "mcq") {
      if (q.options.filter((o) => o.trim()).length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "Trắc nghiệm cần ≥ 2 phương án" });
      if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex >= q.options.length || !q.options[q.correctIndex]?.trim())
        ctx.addIssue({ code: "custom", path: ["correctIndex"], message: "Chọn đáp án đúng" });
    }
  });

const criterionSchema = z.object({
  title: z.string().trim().min(3, "Tên tiêu chí ≥ 3 ký tự").max(200),
  objectiveId: z.string().min(1, "Gắn mục tiêu"),
  maxScore: z.number({ message: "Nhập điểm" }).int().min(1, "1–10").max(10, "1–10"),
});

export const activityBuilderSchema = z
  .object({
    // Bước 1
    lessonPlanId: z.string().min(1, "Chọn KHBD"),
    objectiveIds: z.array(z.string()).min(1, "Chọn ít nhất 1 mục tiêu"),
    // Bước 2
    format: z.literal("lab"),
    labTemplateId: z.string().min(1, "Chọn phòng thí nghiệm"),
    // Bước 3
    config: labConfigCore,
    // Bước 4
    title: z.string().trim().min(5, "Tên nhiệm vụ ≥ 5 ký tự").max(150),
    instructions: z.string().trim().min(20, "Hướng dẫn ≥ 20 ký tự").max(3000),
    questions: z.array(questionSchema).min(1, "Cần ít nhất 1 câu hỏi"),
    rubricTitle: z.string().trim().min(3, "Đặt tên bộ tiêu chí chấm").max(150),
    criteria: z.array(criterionSchema).min(2, "Cần ít nhất 2 tiêu chí chấm"),
    // Bước 5
    classIds: z.array(z.string()).min(1, "Chọn ít nhất 1 lớp"),
    dueAt: z.string().min(1, "Chọn hạn nộp"),
  })
  .superRefine((v, ctx) => {
    refineLabConfig(v.config, ctx, ["config"]);
    if (v.labTemplateId && v.labTemplateId !== "lab-smart-garden")
      ctx.addIssue({ code: "custom", path: ["labTemplateId"], message: "Hiện chỉ giao bài được với Vườn tưới thông minh." });
    v.criteria.forEach((c, i) => {
      if (c.objectiveId && !v.objectiveIds.includes(c.objectiveId))
        ctx.addIssue({ code: "custom", path: ["criteria", i, "objectiveId"], message: "Tiêu chí phải gắn với mục tiêu đã chọn ở Bước 1" });
    });
    const uncovered = v.objectiveIds.filter((o) => !v.criteria.some((c) => c.objectiveId === o));
    if (v.criteria.length >= 2 && uncovered.length)
      ctx.addIssue({ code: "custom", path: ["criteria"], message: `Mục tiêu chưa có tiêu chí chấm: ${uncovered.join(", ")}` });
    if (v.dueAt) {
      const t = new Date(v.dueAt).getTime();
      if (Number.isNaN(t)) ctx.addIssue({ code: "custom", path: ["dueAt"], message: "Ngày không hợp lệ" });
      else if (t < Date.now() + 60 * 60 * 1000) ctx.addIssue({ code: "custom", path: ["dueAt"], message: "Hạn nộp phải sau thời điểm hiện tại ít nhất 1 giờ" });
    }
  });
export type ActivityBuilderForm = z.infer<typeof activityBuilderSchema>;

/** Trường thuộc từng bước của wizard. */
export const STEP_FIELDS = [
  ["lessonPlanId", "objectiveIds"],
  ["format", "labTemplateId"],
  ["config"],
  ["title", "instructions", "questions", "rubricTitle", "criteria"],
  ["classIds", "dueAt"],
] as const;

/**
 * Schema riêng cho từng bước: superRefine của Zod chỉ chạy khi phần object phía trước hợp lệ,
 * nên kiểm tra chéo (vd. Đánh giá ⇒ tắt gợi ý) phải được đánh giá độc lập ở bước tương ứng.
 */
const s4Base = z.object({
  objectiveIds: z.array(z.string()),
  title: z.string().trim().min(5, "Tên nhiệm vụ ≥ 5 ký tự").max(150),
  instructions: z.string().trim().min(20, "Hướng dẫn ≥ 20 ký tự").max(3000),
  questions: z.array(questionSchema).min(1, "Cần ít nhất 1 câu hỏi"),
  rubricTitle: z.string().trim().min(3, "Đặt tên bộ tiêu chí chấm").max(150),
  criteria: z.array(criterionSchema).min(2, "Cần ít nhất 2 tiêu chí chấm"),
});
export const STEP_SCHEMAS = [
  z.object({ lessonPlanId: z.string().min(1, "Chọn KHBD"), objectiveIds: z.array(z.string()).min(1, "Chọn ít nhất 1 mục tiêu") }),
  z.object({ format: z.literal("lab"), labTemplateId: z.string().min(1, "Chọn phòng thí nghiệm") }).superRefine((v, ctx) => {
    if (v.labTemplateId !== "lab-smart-garden")
      ctx.addIssue({ code: "custom", path: ["labTemplateId"], message: "Hiện chỉ giao bài được với Vườn tưới thông minh." });
  }),
  z.object({ config: labConfigCore }).superRefine((v, ctx) => refineLabConfig(v.config, ctx, ["config"])),
  s4Base.superRefine((v, ctx) => {
    v.criteria.forEach((c, i) => {
      if (c.objectiveId && !v.objectiveIds.includes(c.objectiveId)) ctx.addIssue({ code: "custom", path: ["criteria", i, "objectiveId"], message: "Tiêu chí phải gắn với mục tiêu đã chọn ở Bước 1" });
    });
    const uncovered = v.objectiveIds.filter((o) => !v.criteria.some((c) => c.objectiveId === o));
    if (uncovered.length) ctx.addIssue({ code: "custom", path: ["criteria"], message: `Mục tiêu chưa có tiêu chí chấm: ${uncovered.join(", ")}` });
  }),
  z.object({ classIds: z.array(z.string()).min(1, "Chọn ít nhất 1 lớp"), dueAt: z.string().min(1, "Chọn hạn nộp") }).superRefine((v, ctx) => {
    const t = new Date(v.dueAt).getTime();
    if (Number.isNaN(t)) ctx.addIssue({ code: "custom", path: ["dueAt"], message: "Ngày không hợp lệ" });
    else if (t < Date.now() + 60 * 60 * 1000) ctx.addIssue({ code: "custom", path: ["dueAt"], message: "Hạn nộp phải sau thời điểm hiện tại ít nhất 1 giờ" });
  }),
] as const;

export const classSchema = z.object({
  name: z.string().trim().min(2, "Tên lớp ≥ 2 ký tự").max(20, "Tối đa 20 ký tự").regex(/^[0-9A-Za-zÀ-ỹ\s-]+$/, "Chỉ dùng chữ, số, dấu gạch"),
  grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
  textbookId: z.enum(["kntt", "cd", "ctst"]),
  pathway: z.enum(["chung", "ICT", "CS"]),
  schoolYear: z.string().regex(/^\d{4}–\d{4}$/, "Dạng 2026–2027"),
});
export type ClassForm = z.infer<typeof classSchema>;

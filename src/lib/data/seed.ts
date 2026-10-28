/**
 * Seed dữ liệu DEMO nhất quán. Các bài nộp mẫu được chấm test tự động bằng chính
 * engine Smart Garden để số liệu analytics phản ánh đúng logic — nhưng đây vẫn là
 * dữ liệu demo, không phải chứng cứ triển khai thật.
 */
import type { LessonLabLink, TeacherQuiz } from "./practice";
import type {
  ActivityDraft,
  Course,
  CourseProgress,
  TutorEvent,
  AIInteraction,
  Assessment,
  Assignment,
  Bookmark,
  CodeWork,
  GameProgress,
  LessonProgress,
  PracticeAttempt,
  StudentProject,
  StudyNote,
  SupportReport,
  UserPrefs,
  AuditEvent,
  ClassRoom,
  CurriculumVerification,
  Enrollment,
  ExperimentEvent,
  LabAttempt,
  LabConfiguration,
  LessonPlan,
  LessonPlanVersion,
  PortfolioItem,
  Resource,
  Rubric,
  Submission,
  TeachingActivity,
  User,
} from "@/lib/domain/types";
import { compileRule, gardenTestCases, runRule, runTests } from "@/lib/sim/smart-garden";
import { SEED_CLASSES, SEED_ENROLLMENTS, SEED_USERS } from "./people";
import { seedCourses } from "./courses-seed";

/** Dữ liệu demo: lượt hỏi AI Gia sư của lớp 10A1 (chỉ dữ liệu tổng hợp, không có nội dung tin nhắn). */
function seedTutorEvents(at: (days: number, hours?: number) => string): TutorEvent[] {
  const rows: [string, TutorEvent["capability"], string, TutorEvent["activity"], string | undefined, string][] = [
    ["s1", "debug", "if", "code", "Sai kiểm thử", "O10-F-02"], ["s2", "debug", "if", "code", "Sai kiểm thử", "O10-F-02"],
    ["s3", "debug", "if", "code", "SyntaxError", "O10-F-02"], ["s4", "guide", "if", "code", undefined, "O10-F-02"],
    ["s5", "debug", "logic", "simulation", "Quên điều kiện hết nước", "O10-F-03"], ["s2", "explain", "logic", "lesson", undefined, "O10-F-03"],
    ["s6", "debug", "test", "simulation", "Sai ở giá trị biên", "O10-F-04"], ["s3", "debug", "test", "simulation", "Sai ở giá trị biên", "O10-F-04"],
    ["s4", "explain", "if", "lesson", undefined, "O10-F-02"], ["s1", "practice", "if", "free", undefined, "O10-F-02"],
    ["s5", "debug", "if", "simulation", "Vượt đèn đỏ", "O10-F-02"], ["s6", "guide", "loop", "code", undefined, "O10-F-05"],
  ];
  return rows.map(([studentId, capability, topic, activity, errorType, objectiveId], i) => ({
    id: `te-seed-${i}`, studentId, at: at(-(i % 6), -i), capability, topic, activity, level: activity === "free" || activity === "lesson" ? "free" : "guided", errorType, objectiveId, source: "rules",
  }));
}

export interface DemoData {
  users: User[];
  classes: ClassRoom[];
  enrollments: Enrollment[];
  lessonPlans: LessonPlan[];
  lessonPlanVersions: LessonPlanVersion[];
  labConfigs: LabConfiguration[];
  rubrics: Rubric[];
  activities: TeachingActivity[];
  activityDrafts: ActivityDraft[];
  assignments: Assignment[];
  attempts: LabAttempt[];
  events: ExperimentEvent[];
  submissions: Submission[];
  assessments: Assessment[];
  resources: Resource[];
  portfolio: PortfolioItem[];
  aiInteractions: AIInteraction[];
  auditLog: AuditEvent[];
  verifications: CurriculumVerification[];
  lessonProgress: LessonProgress[];
  notes: StudyNote[];
  bookmarks: Bookmark[];
  practiceAttempts: PracticeAttempt[];
  codeWorks: CodeWork[];
  gameProgress: GameProgress[];
  projects: StudentProject[];
  reports: SupportReport[];
  prefs: Record<string, UserPrefs>;
  notifRead: Record<string, string[]>;
  courses: Course[];
  courseProgress: CourseProgress[];
  tutorEvents: TutorEvent[];
  teacherQuizzes: TeacherQuiz[];
  lessonLabs: LessonLabLink[];
}

export const SEED_RUBRIC_CRITERIA = (prefix: string) => [
  {
    id: `${prefix}-condition`,
    title: "Viết biểu thức điều kiện đúng",
    objectiveId: "O10-F-02",
    maxScore: 4,
    levels: [
      { score: 1, descriptor: "Điều kiện sai hướng so sánh hoặc lỗi cú pháp" },
      { score: 2, descriptor: "Đúng hướng nhưng sai ngưỡng/biên" },
      { score: 3, descriptor: "Đúng với đa số trường hợp" },
      { score: 4, descriptor: "Đúng mọi trường hợp, viết gọn" },
    ],
  },
  {
    id: `${prefix}-logic`,
    title: "Kết hợp điều kiện bằng toán tử logic",
    objectiveId: "O10-F-03",
    maxScore: 4,
    levels: [
      { score: 1, descriptor: "Không dùng toán tử logic khi cần" },
      { score: 2, descriptor: "Dùng sai and/or" },
      { score: 3, descriptor: "Đúng nhưng chưa giải thích được" },
      { score: 4, descriptor: "Đúng và giải thích được vai trò từng vế" },
    ],
  },
  {
    id: `${prefix}-testing`,
    title: "Kiểm thử với trường hợp biên",
    objectiveId: "O10-F-04",
    maxScore: 4,
    levels: [
      { score: 1, descriptor: "Không kiểm thử" },
      { score: 2, descriptor: "Chỉ thử trường hợp thông thường" },
      { score: 3, descriptor: "Có thử biên nhưng chưa sửa lỗi" },
      { score: 4, descriptor: "Thử đủ biên/hết nước và sửa lỗi phát hiện được" },
    ],
  },
];

export function buildSeed(now: Date = new Date()): DemoData {
  const at = (days: number, hours = 0) => new Date(now.getTime() + days * 86_400_000 + hours * 3_600_000).toISOString();

  const ifPlan: LessonPlan = {
    id: "lp-seed-if1",
    ownerId: "t1",
    title: "Câu lệnh rẽ nhánh if — Tiết 1: Khám phá với Vườn tưới thông minh",
    grade: 10,
    textbookId: "kntt",
    lessonId: "L-10-if-kntt",
    objectiveIds: ["O10-F-02", "O10-F-03", "O10-F-04"],
    durationMinutes: 45,
    status: "published",
    visibility: "school",
    notes: "Lớp 10A1 đã học biến và biểu thức so sánh ở tiết trước.",
    currentVersion: 1,
    createdAt: at(-10),
    updatedAt: at(-6),
    curriculumVerified: false,
    activities: [
      { id: "pa-1", phase: "mo-dau", title: "Tình huống: vườn trường bị héo", objectiveIds: ["O10-F-02"], content: "GV chiếu ảnh vườn trường khô héo cuối tuần; HS đề xuất khi nào cần tưới.", product: "Câu trả lời miệng: điều kiện cần tưới", organization: "Cả lớp, 5 phút", evidence: "Ghi nhận ý kiến trên bảng" },
      { id: "pa-2", phase: "hinh-thanh", title: "Cấu trúc if/else và toán tử logic", objectiveIds: ["O10-F-02", "O10-F-03"], content: "Giới thiệu cú pháp if/else, so sánh <, <=, toán tử and/or qua Vườn tưới thông minh (chế độ Khám phá).", product: "Điều kiện tưới viết bằng Python", organization: "Cặp đôi, 15 phút", labTemplateId: "lab-smart-garden", evidence: "Các lần chạy thử trong phòng thí nghiệm" },
      { id: "pa-3", phase: "luyen-tap", title: "Kiểm thử trường hợp biên", objectiveIds: ["O10-F-04"], content: "HS kiểm thử với 39%, 40%, 41% và trường hợp hết nước, giải thích kết quả.", product: "Bảng kết quả kiểm thử", organization: "Cá nhân, 15 phút", labTemplateId: "lab-smart-garden", evidence: "Kết quả kiểm thử và lời giải thích" },
      { id: "pa-4", phase: "van-dung", title: "Mở rộng: tưới theo giờ", objectiveIds: ["O10-F-03"], content: "Đề xuất thêm điều kiện không tưới buổi trưa.", product: "Đề xuất luật mới", organization: "Nhóm, về nhà", evidence: "Bài viết ngắn nộp portfolio" },
    ],
  };

  const dbPlan: LessonPlan = {
    id: "lp-seed-db",
    ownerId: "t1",
    title: "Cơ sở dữ liệu quan hệ — Khóa chính, khóa ngoài",
    grade: 11,
    textbookId: "kntt",
    lessonId: "L-11-db-kntt",
    objectiveIds: ["O11-F-01"],
    durationMinutes: 45,
    status: "draft",
    visibility: "private",
    notes: "Bản nháp — chưa có hoạt động đánh giá.",
    currentVersion: 1,
    createdAt: at(-3),
    updatedAt: at(-1),
    curriculumVerified: false,
    activities: [
      { id: "pa-db-1", phase: "mo-dau", title: "Sổ mượn sách giấy", objectiveIds: [], content: "Thảo luận khó khăn khi tìm dữ liệu trên sổ giấy.", product: "Danh sách vấn đề", organization: "Cả lớp", evidence: "" },
      { id: "pa-db-2", phase: "hinh-thanh", title: "Bảng và khóa", objectiveIds: ["O11-F-01"], content: "Giới thiệu bảng, bản ghi, khóa chính.", product: "Sơ đồ bảng", organization: "Cặp đôi", evidence: "" },
    ],
  };

  const t2Plan: LessonPlan = {
    id: "lp-seed-t2-bin",
    ownerId: "t2",
    title: "Hệ nhị phân qua trò chơi bật đèn",
    grade: 10,
    textbookId: "ctst",
    lessonId: "L-10-binary-ctst",
    objectiveIds: ["O10-A-01", "O10-A-02"],
    durationMinutes: 45,
    status: "published",
    visibility: "public",
    notes: "Chia sẻ công khai cho tổ Tin.",
    currentVersion: 1,
    createdAt: at(-20),
    updatedAt: at(-20),
    curriculumVerified: false,
    activities: [
      { id: "pa-b-1", phase: "hinh-thanh", title: "8 bóng đèn = 1 byte", objectiveIds: ["O10-A-01"], content: "Dùng phòng thí nghiệm Bit và cổng logic để biểu diễn số.", product: "Bảng chuyển đổi", organization: "Cặp đôi", labTemplateId: "lab-binary-logic", evidence: "Phiếu chuyển đổi" },
      { id: "pa-b-2", phase: "luyen-tap", title: "Bảng chân lý", objectiveIds: ["O10-A-02"], content: "Hoàn thành bảng chân lý AND/OR/XOR.", product: "Bảng chân lý", organization: "Cá nhân", labTemplateId: "lab-binary-logic", evidence: "Phiếu học tập" },
    ],
  };

  const { currentVersion: _v, ...ifSnapshot } = ifPlan;
  void _v;
  const { currentVersion: _v2, ...dbSnapshot } = dbPlan;
  void _v2;
  const lessonPlanVersions: LessonPlanVersion[] = [
    { id: "lpv-seed-1", lessonPlanId: ifPlan.id, version: 1, note: "Bản đầu tiên", authorId: "t1", createdAt: at(-6), snapshot: ifSnapshot },
    { id: "lpv-seed-2", lessonPlanId: dbPlan.id, version: 1, note: "Bản nháp", authorId: "t1", createdAt: at(-1), snapshot: dbSnapshot },
  ];

  const labConfig: LabConfiguration = {
    id: "lc-seed-1",
    ownerId: "t1",
    labTemplateId: "lab-smart-garden",
    title: "Vườn tưới — Khám phá (ngưỡng 40%)",
    mode: "explore",
    hintMode: "guided",
    params: { threshold: 40, requireWater: true, initialHumidity: 55, initialHasWater: true, allowRuleEditor: true },
    testCaseIds: gardenTestCases(40).map((c) => c.id),
    version: 1,
    visibility: "school",
    createdAt: at(-6),
  };

  const rubric: Rubric = { id: "rb-seed-1", ownerId: "t1", title: "Tiêu chí chấm: câu lệnh if — Vườn tưới", criteria: SEED_RUBRIC_CRITERIA("rc-seed") };

  const activity: TeachingActivity = {
    id: "act-seed-1",
    ownerId: "t1",
    lessonPlanId: ifPlan.id,
    objectiveIds: ifPlan.objectiveIds,
    format: "lab",
    title: "Vườn tưới: viết điều kiện tưới cây",
    instructions: "Điều chỉnh độ ẩm và bình nước để quan sát máy bơm. Viết điều kiện sao cho bơm chỉ bật khi đất khô (dưới 40%) và bình còn nước. Kiểm thử trước khi nộp và giải thích kết quả ở trường hợp độ ẩm đúng bằng 40%.",
    labConfigId: labConfig.id,
    rubricId: rubric.id,
    status: "published",
    createdAt: at(-5),
    questions: [
      { id: "aq-seed-1", kind: "mcq", prompt: "Với độ ẩm đúng bằng 40%, máy bơm nên ở trạng thái nào?", options: ["Bật", "Tắt", "Tùy bình nước"], correctIndex: 1 },
      { id: "aq-seed-2", kind: "short", prompt: "Vì sao luật cần kiểm tra has_water?", options: [] },
    ],
  };

  const assignment: Assignment = {
    id: "as-seed-1",
    ownerId: "t1",
    activityId: activity.id,
    classId: "c-10a1",
    title: "Vườn tưới thông minh — Khám phá điều kiện tưới",
    dueAt: at(3),
    hintMode: "guided",
    publishedAt: at(-4),
    status: "open",
  };

  const cases = gardenTestCases(40);
  const params = { threshold: 40, requireWater: true };
  const sampleWork: { studentId: string; rule: string; explanation: string; mcq: string; scores?: [number, number, number]; feedback?: string }[] = [
    { studentId: "s2", rule: "humidity < 40 and has_water", explanation: "Ở 40% thì không nhỏ hơn 40 nên bơm tắt. Phải có nước mới bơm được.", mcq: "Tắt", scores: [4, 4, 4], feedback: "Rất tốt, giải thích biên rõ ràng." },
    { studentId: "s3", rule: "humidity <= 40 and has_water", explanation: "Em nghĩ 40% vẫn là khô.", mcq: "Bật", scores: [3, 4, 2], feedback: "Xem lại test 40% và yêu cầu 'dưới 40%'." },
    { studentId: "s4", rule: "humidity < 40", explanation: "Đất khô thì tưới.", mcq: "Tắt", scores: [3, 1, 2], feedback: "Thiếu kiểm tra bình nước — bơm sẽ chạy khô." },
    { studentId: "s5", rule: "humidity < 40 and has_water", explanation: "Dùng and vì cần cả hai điều kiện.", mcq: "Tắt", scores: [4, 3, 3], feedback: "Đúng; nên thử thêm trường hợp 0% và 100%." },
    { studentId: "s6", rule: "humidity > 40 and has_water", explanation: "Độ ẩm cao thì tưới.", mcq: "Bật", },
    { studentId: "s7", rule: "humidity <= 40", explanation: "Không chắc phần nước.", mcq: "Bật" },
  ];

  const attempts: LabAttempt[] = [];
  const events: ExperimentEvent[] = [];
  const submissions: Submission[] = [];
  const assessments: Assessment[] = [];

  sampleWork.forEach((w, i) => {
    const attemptId = `att-seed-${w.studentId}`;
    const start = -3 + i * 0.2;
    attempts.push({ id: attemptId, studentId: w.studentId, labTemplateId: "lab-smart-garden", assignmentId: assignment.id, labConfigId: labConfig.id, startedAt: at(start), updatedAt: at(start, 1), status: "submitted", draftRule: w.rule });
    const compiled = compileRule(w.rule);
    if (!compiled.ok) throw compiled.error;
    let tick = 0;
    const ev = (type: ExperimentEvent["type"], input: Record<string, unknown>, output: Record<string, unknown>, pass?: boolean) =>
      events.push({ id: `ev-seed-${w.studentId}-${tick}`, attemptId, type, input, output, pass, timestamp: at(start, (tick++ * 2) / 60) });
    const tries: [number, boolean][] = [[55, true], [30, true], [40, true], [25, false]].slice(0, 2 + (i % 3)) as [number, boolean][];
    ev("rule_change", { rule: w.rule }, {});
    for (const [humidity, hasWater] of tries) {
      ev("input_change", { humidity, hasWater }, {});
      const out = runRule(compiled.ast, { humidity, hasWater }, params);
      ev("run", { humidity, hasWater, rule: w.rule }, { pump: out.pump, expected: out.expected, plant: out.plant }, out.pass);
    }
    const results = runTests(compiled.ast, cases, params);
    ev("test", { rule: w.rule, cases: cases.length }, { passed: results.filter((r) => r.pass).length, total: results.length }, results.every((r) => r.pass));
    ev("submit", { rule: w.rule }, {});
    const subId = `sub-seed-${w.studentId}`;
    submissions.push({
      id: subId,
      assignmentId: assignment.id,
      studentId: w.studentId,
      attemptId,
      submittedAt: at(start, 1),
      rule: w.rule,
      explanation: w.explanation,
      answers: [
        { questionId: "aq-seed-1", answer: w.mcq },
        { questionId: "aq-seed-2", answer: w.explanation },
      ],
      testResults: results,
      status: w.scores ? "graded" : "submitted",
    });
    if (w.scores) {
      assessments.push({
        id: `asm-seed-${w.studentId}`,
        submissionId: subId,
        teacherId: "t1",
        rubricId: rubric.id,
        scores: rubric.criteria.map((c, k) => ({ criterionId: c.id, score: w.scores![k], comment: "" })),
        feedback: w.feedback ?? "",
        usedAiSuggestion: false,
        status: "final",
        updatedAt: at(start + 1),
      });
    }
  });

  const resources: Resource[] = [
    {
      id: "res-seed-1",
      ownerId: "t1",
      kind: "question-bank",
      title: "Ngân hàng câu hỏi: rẽ nhánh if",
      lessonId: "L-10-if-kntt",
      items: [
        { front: "humidity = 40 thì humidity < 40 cho kết quả gì?", back: "False" },
        { front: "Toán tử nào đúng khi cả hai vế đúng?", back: "and" },
        { front: "Sửa lỗi: if x = 5:", back: "if x == 5:" },
      ],
      source: "teacher",
      reviewStatus: "approved",
      visibility: "school",
      createdAt: at(-8),
    },
    {
      id: "res-seed-2",
      ownerId: "t1",
      kind: "flashcards",
      title: "Thẻ ghi nhớ: toán tử logic",
      lessonId: "L-10-if-kntt",
      items: [
        { front: "and", back: "True khi cả hai vế True" },
        { front: "or", back: "True khi ít nhất một vế True" },
        { front: "not", back: "Đảo giá trị True/False" },
      ],
      source: "template-demo",
      reviewStatus: "pending",
      visibility: "private",
      createdAt: at(-1),
    },
    {
      id: "res-seed-t2",
      ownerId: "t2",
      kind: "worksheet",
      title: "Phiếu học tập: chuyển đổi nhị phân",
      lessonId: "L-10-binary-ctst",
      items: [
        { front: "Đổi 13 sang nhị phân", back: "1101" },
        { front: "Đổi 10110 sang thập phân", back: "22" },
      ],
      source: "teacher",
      reviewStatus: "approved",
      visibility: "public",
      createdAt: at(-15),
    },
  ];

  const audit: AuditEvent[] = [
    { id: "au-1", actorId: "t1", action: "publish", entity: "Assignment", entityId: assignment.id, summary: "Giao 'Vườn tưới thông minh — Khám phá điều kiện tưới' cho 10A1", at: at(-4) },
    { id: "au-2", actorId: "t1", action: "update", entity: "LessonPlan", entityId: dbPlan.id, summary: "Cập nhật bản nháp KHBD CSDL quan hệ", at: at(-1) },
    { id: "au-3", actorId: "t1", action: "grade", entity: "Assessment", entityId: "asm-seed-s5", summary: "Chấm bài Phan Đức Long", at: at(-1, 2) },
  ];

  return {
    users: SEED_USERS,
    courses: seedCourses(at(-10)),
    courseProgress: [],
    tutorEvents: seedTutorEvents(at),
    teacherQuizzes: [],
    lessonLabs: [],
    classes: SEED_CLASSES,
    enrollments: SEED_ENROLLMENTS,
    lessonPlans: [ifPlan, dbPlan, t2Plan],
    lessonPlanVersions,
    labConfigs: [labConfig],
    rubrics: [rubric],
    activities: [activity],
    activityDrafts: [],
    assignments: [assignment],
    attempts,
    events,
    submissions,
    assessments,
    resources,
    portfolio: [],
    aiInteractions: [],
    auditLog: audit,
    verifications: [],
    // Dữ liệu mẫu cho học sinh demo s1 (đã học 2 bài, làm 1 bộ luyện tập, qua cấp 1 trò chơi)
    lessonProgress: [
      { studentId: "s1", lessonId: "L-10-binary-kntt", sectionsDone: ["muc-tieu", "kien-thuc", "kiem-tra"], confused: [], lastSection: "kiem-tra", quiz: { correct: 2, total: 2, at: at(-6) }, updatedAt: at(-6) },
      { studentId: "s1", lessonId: "L-10-variables-kntt", sectionsDone: ["muc-tieu", "kien-thuc"], confused: [], lastSection: "kien-thuc", updatedAt: at(-5) },
      { studentId: "s1", lessonId: "L-10-if-kntt", sectionsDone: ["muc-tieu", "khoi-dong"], confused: [], lastSection: "kien-thuc", updatedAt: at(-1) },
    ],
    notes: [],
    bookmarks: [],
    practiceAttempts: [
      {
        id: "pa-seed-s1",
        studentId: "s1",
        setId: "binary",
        mode: "practice",
        items: [
          { questionId: "p-bn-1", objectiveId: "O10-A-01", status: "correct", answer: "10" },
          { questionId: "p-bn-2", objectiveId: "O10-A-01", status: "correct", answer: "Đúng" },
          { questionId: "p-bn-3", objectiveId: "O10-A-02", status: "wrong", answer: "OR" },
        ],
        startedAt: at(-6, 1),
        finishedAt: at(-6, 1.2),
      },
    ],
    codeWorks: [],
    gameProgress: [
      { studentId: "s1", gameSlug: "smart-farm", passed: [1], codeByLevel: { 1: "if humidity < 40:\n    pump_on()\nelse:\n    pump_off()\n", 2: "if humidity < 40:\n    pump_on()\nelse:\n    pump_off()\n" }, history: [{ level: 1, at: at(-2), score: 4, total: 4, passed: true }, { level: 2, at: at(-2, 1), score: 3, total: 5, passed: false }], updatedAt: at(-2, 1) },
    ],
    projects: [],
    reports: [],
    prefs: {},
    notifRead: {},
  };
}

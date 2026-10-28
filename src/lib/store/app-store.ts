"use client";

/**
 * Mock repository (DEMO): toàn bộ dữ liệu ghi vào localStorage của trình duyệt.
 * Chữ ký hành động được thiết kế để thay bằng Supabase ở giai đoạn tích hợp.
 */
import type { LabResult } from "@/lib/sim/lab-score";
import type { BookNote } from "@/lib/sgk/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AUTH_MODE } from "@/lib/supabase/config";
import type { TeacherQuiz } from "@/lib/data/practice";
import type {
  ActivityQuestion,
  User,
  Bookmark,
  Course,
  TutorEvent,
  PracticeAttempt,
  StudentProject,
  UserPrefs,
  AgentRole,
  Assessment,
  Assignment,
  ClassRoom,
  ExperimentEvent,
  HintMode,
  LabConfiguration,
  LabMode,
  LessonPlan,
  PortfolioItem,
  Resource,
  RubricCriterion,
  SmartGardenParams,
  TestResult,
  Visibility,
} from "@/lib/domain/types";
import { buildSeed, type DemoData } from "@/lib/data/seed";
import { uid } from "@/lib/utils";
import { scaffoldTopics } from "@/lib/courses/course";

export interface PublishActivityInput {
  ownerId: string;
  lessonPlanId: string;
  objectiveIds: string[];
  labTemplateId: string;
  title: string;
  instructions: string;
  mode: LabMode;
  hintMode: HintMode;
  params: SmartGardenParams;
  testCaseIds: string[];
  questions: ActivityQuestion[];
  rubricTitle: string;
  criteria: Omit<RubricCriterion, "id">[];
  classIds: string[];
  dueAt: string;
  draftId?: string;
}

export interface SubmitInput {
  assignmentId: string;
  attemptId: string;
  studentId: string;
  rule: string;
  explanation: string;
  answers: { questionId: string; answer: string }[];
  testResults: TestResult[];
}

interface Session {
  userId: string | null;
}

interface Actions {
  login: (userId: string) => void;
  logout: () => void;
  /** Đăng nhập thật (Supabase): đưa hồ sơ đã xác thực vào phiên; vai trò lấy từ cơ sở dữ liệu. */
  signInAs: (user: User) => void;
  resetDemo: () => void;
  // Lesson plans
  createLessonPlan: (p: Omit<LessonPlan, "id" | "createdAt" | "updatedAt" | "currentVersion" | "curriculumVerified">) => string;
  updateLessonPlan: (id: string, patch: Partial<LessonPlan>) => void;
  saveLessonPlanVersion: (id: string, note: string, actorId: string) => number;
  restoreLessonPlanVersion: (versionId: string, actorId: string) => void;
  deleteLessonPlan: (id: string, actorId: string) => void;
  // Lab configs
  saveLabConfig: (c: Omit<LabConfiguration, "id" | "createdAt" | "version">) => string;
  setVisibility: (entity: "lessonPlans" | "labConfigs" | "resources", id: string, v: Visibility) => void;
  // Activity builder
  saveActivityDraft: (ownerId: string, step: number, values: unknown, draftId?: string) => string;
  deleteActivityDraft: (id: string) => void;
  publishActivity: (input: PublishActivityInput) => { activityId: string; assignmentIds: string[] };
  // Classes
  createClass: (c: Omit<ClassRoom, "id" | "inviteCode">) => string;
  updateClass: (id: string, patch: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => boolean;
  regenerateInvite: (id: string) => void;
  addStudentToClass: (classId: string, name: string) => void;
  removeEnrollment: (enrollmentId: string) => void;
  // Assignments
  createAssignment: (a: Omit<Assignment, "id" | "publishedAt" | "status">) => string;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  // Attempts & evidence
  startAttempt: (input: { studentId: string; labTemplateId: string; assignmentId?: string; labConfigId?: string }) => string;
  setAttemptStatus: (id: string, status: "in_progress" | "paused") => void;
  setDraftRule: (id: string, rule: string) => void;
  logEvent: (e: Omit<ExperimentEvent, "id" | "timestamp">) => void;
  submit: (input: SubmitInput) => string;
  // Assessment
  saveAssessment: (a: Omit<Assessment, "id" | "updatedAt">) => void;
  // Resources
  addResource: (r: Omit<Resource, "id" | "createdAt">) => string;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  // Portfolio
  savePortfolioVersion: (input: { studentId: string; kind: PortfolioItem["kind"]; title: string; content: string; itemId?: string }) => string;
  // AI & audit
  logAI: (i: { agent: AgentRole; userId: string; contextRef: string; inputSummary: string; output: unknown; flags: string[] }) => string;
  reviewAI: (id: string, decision: "approved" | "rejected") => void;
  verifyLesson: (lessonId: string, verifierId: string, note: string) => void;
  unverifyLesson: (lessonId: string) => void;
  recordAudit: (actorId: string, action: string, entity: string, entityId: string, summary: string) => void;
  // Student Hub
  markSection: (studentId: string, lessonId: string, sectionId: string, done: boolean) => void;
  toggleConfused: (studentId: string, lessonId: string, sectionId: string) => void;
  setLastSection: (studentId: string, lessonId: string, sectionId: string) => void;
  recordLessonQuiz: (studentId: string, lessonId: string, correct: number, total: number) => void;
  addNote: (studentId: string, lessonId: string, text: string) => void;
  deleteNote: (id: string) => void;
  toggleBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => boolean;
  savePracticeAttempt: (a: Omit<PracticeAttempt, "id">) => string;
  /** Lưu (tạo mới nếu chưa có id) bộ câu hỏi của giáo viên cho một bài SGK. */
  saveTeacherQuiz: (q: Omit<TeacherQuiz, "id" | "updatedAt"> & { id?: string }) => string;
  recordLabResult: (r: Omit<LabResult, "id" | "finishedAt">) => void;
  addBookNote: (n: Omit<BookNote, "id" | "at">) => void;
  deleteBookNote: (id: string, userId: string) => void;
  toggleBookPick: (userId: string, key: string) => void;
  markBookRead: (userId: string, ref: string, sectionId: string) => void;
  toggleTaught: (teacherId: string, classId: string, ref: string) => void;
  deleteTeacherQuiz: (id: string, ownerId: string) => void;
  toggleLessonLab: (ownerId: string, sgkRef: string, slug: string) => void;
  saveCode: (studentId: string, exerciseId: string, code: string, versionNote?: string) => void;
  recordCodeRun: (studentId: string, exerciseId: string, code: string, run: { passed: number; total: number; errorType?: string }) => void;
  saveGameCode: (studentId: string, gameSlug: string, level: number, code: string) => void;
  recordGameRun: (studentId: string, gameSlug: string, level: number, code: string, score: number, total: number) => boolean;
  createProject: (p: Omit<StudentProject, "id" | "createdAt" | "updatedAt" | "log">) => string;
  updateProject: (id: string, patch: Partial<StudentProject>, logNote?: string) => void;
  deleteProject: (id: string) => void;
  reportIssue: (userId: string, area: string, text: string) => void;
  setPrefs: (userId: string, prefs: Partial<UserPrefs>) => void;
  markNotifRead: (userId: string, ids: string[]) => void;
  setPortfolioVisibility: (id: string, v: "private" | "teacher" | "class") => void;
  // Khóa học & bài giảng
  createCourse: (c: Pick<Course, "ownerId" | "title" | "description" | "grade" | "textbookId" | "sequential"> & { scaffold: boolean }) => string;
  updateCourse: (id: string, patch: Partial<Omit<Course, "id" | "ownerId" | "createdAt">>) => void;
  deleteCourse: (id: string, actorId: string) => void;
  publishCourse: (id: string, classIds: string[], actorId: string) => void;
  unpublishCourse: (id: string, actorId: string) => void;
  markCourseBlock: (studentId: string, courseId: string, blockId: string, done: boolean, score?: number) => void;
  setCourseLastLesson: (studentId: string, courseId: string, lessonId: string) => void;
  logTutorEvent: (e: Omit<TutorEvent, "id" | "at">) => void;
}

export type AppState = DemoData & Session & Actions;

const now = () => new Date().toISOString();
export const DEFAULT_PREFS: UserPrefs = { fontScale: 1, highContrast: false };

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const audit: Actions["recordAudit"] = (actorId, action, entity, entityId, summary) =>
        set((s) => ({ auditLog: [{ id: uid("au"), actorId, action, entity, entityId, summary, at: now() }, ...s.auditLog].slice(0, 200) }));

      return {
        ...buildSeed(),
        userId: null,
        login: (userId) => set({ userId }),
        logout: () => set({ userId: null }),
        signInAs: (user) => set((s) => ({ users: [...s.users.filter((u) => u.id !== user.id), user], userId: user.id })),
        resetDemo: () => set((s) => ({ ...buildSeed(), userId: s.userId })),

        createLessonPlan: (p) => {
          const id = uid("lp");
          const t = now();
          set((s) => ({ lessonPlans: [{ ...p, id, createdAt: t, updatedAt: t, currentVersion: 0, curriculumVerified: false }, ...s.lessonPlans] }));
          audit(p.ownerId, "create", "LessonPlan", id, `Tạo KHBD "${p.title}"`);
          return id;
        },
        updateLessonPlan: (id, patch) =>
          set((s) => ({ lessonPlans: s.lessonPlans.map((lp) => (lp.id === id ? { ...lp, ...patch, updatedAt: now() } : lp)) })),
        saveLessonPlanVersion: (id, note, actorId) => {
          const lp = get().lessonPlans.find((x) => x.id === id);
          if (!lp) return 0;
          const version = lp.currentVersion + 1;
          const { currentVersion: _cv, ...snapshot } = lp;
          void _cv;
          set((s) => ({
            lessonPlanVersions: [{ id: uid("lpv"), lessonPlanId: id, version, note, authorId: actorId, createdAt: now(), snapshot: structuredClone(snapshot) }, ...s.lessonPlanVersions],
            lessonPlans: s.lessonPlans.map((x) => (x.id === id ? { ...x, currentVersion: version, updatedAt: now() } : x)),
          }));
          audit(actorId, "version", "LessonPlan", id, `Lưu phiên bản v${version}: ${note}`);
          return version;
        },
        restoreLessonPlanVersion: (versionId, actorId) => {
          const v = get().lessonPlanVersions.find((x) => x.id === versionId);
          if (!v) return;
          set((s) => ({
            lessonPlans: s.lessonPlans.map((x) => (x.id === v.lessonPlanId ? { ...structuredClone(v.snapshot), currentVersion: x.currentVersion, updatedAt: now() } : x)),
          }));
          audit(actorId, "restore", "LessonPlan", v.lessonPlanId, `Khôi phục nội dung phiên bản v${v.version}`);
        },
        deleteLessonPlan: (id, actorId) => {
          set((s) => ({ lessonPlans: s.lessonPlans.filter((x) => x.id !== id), lessonPlanVersions: s.lessonPlanVersions.filter((v) => v.lessonPlanId !== id) }));
          audit(actorId, "delete", "LessonPlan", id, "Xóa KHBD");
        },

        saveLabConfig: (c) => {
          const id = uid("lc");
          const siblings = get().labConfigs.filter((x) => x.ownerId === c.ownerId && x.labTemplateId === c.labTemplateId && (c.parentId ? x.id === c.parentId || x.parentId === c.parentId : false));
          const version = siblings.length ? Math.max(...siblings.map((x) => x.version)) + 1 : 1;
          set((s) => ({ labConfigs: [{ ...c, id, version, createdAt: now() }, ...s.labConfigs] }));
          audit(c.ownerId, "create", "LabConfiguration", id, `Lưu cấu hình lab "${c.title}" v${version}`);
          return id;
        },
        setVisibility: (entity, id, v) =>
          set((s) => {
            if (entity === "lessonPlans") return { lessonPlans: s.lessonPlans.map((x) => (x.id === id ? { ...x, visibility: v } : x)) };
            if (entity === "labConfigs") return { labConfigs: s.labConfigs.map((x) => (x.id === id ? { ...x, visibility: v } : x)) };
            return { resources: s.resources.map((x) => (x.id === id ? { ...x, visibility: v } : x)) };
          }),

        saveActivityDraft: (ownerId, step, values, draftId) => {
          const id = draftId ?? uid("draft");
          set((s) => ({
            activityDrafts: [{ id, ownerId, step, values: structuredClone(values), updatedAt: now() }, ...s.activityDrafts.filter((d) => d.id !== id)],
          }));
          return id;
        },
        deleteActivityDraft: (id) => set((s) => ({ activityDrafts: s.activityDrafts.filter((d) => d.id !== id) })),
        publishActivity: (input) => {
          const t = now();
          const labConfigId = uid("lc");
          const rubricId = uid("rb");
          const activityId = uid("act");
          const assignmentIds = input.classIds.map(() => uid("as"));
          const classes = get().classes;
          set((s) => ({
            labConfigs: [
              { id: labConfigId, ownerId: input.ownerId, labTemplateId: input.labTemplateId, title: `${input.title} — cấu hình`, mode: input.mode, hintMode: input.hintMode, params: input.params, testCaseIds: input.testCaseIds, version: 1, visibility: "private", createdAt: t },
              ...s.labConfigs,
            ],
            rubrics: [{ id: rubricId, ownerId: input.ownerId, title: input.rubricTitle, criteria: input.criteria.map((c) => ({ ...c, id: uid("rc") })) }, ...s.rubrics],
            activities: [
              { id: activityId, ownerId: input.ownerId, lessonPlanId: input.lessonPlanId, objectiveIds: input.objectiveIds, format: "lab", title: input.title, instructions: input.instructions, labConfigId, rubricId, questions: input.questions, status: "published", createdAt: t },
              ...s.activities,
            ],
            assignments: [
              ...input.classIds.map((classId, i) => ({ id: assignmentIds[i], ownerId: input.ownerId, activityId, classId, title: input.title, dueAt: input.dueAt, hintMode: input.hintMode, publishedAt: t, status: "open" as const })),
              ...s.assignments,
            ],
            activityDrafts: input.draftId ? s.activityDrafts.filter((d) => d.id !== input.draftId) : s.activityDrafts,
          }));
          audit(input.ownerId, "publish", "Assignment", assignmentIds[0] ?? activityId, `Giao "${input.title}" cho ${input.classIds.map((c) => classes.find((x) => x.id === c)?.name ?? c).join(", ")}`);
          return { activityId, assignmentIds };
        },

        createClass: (c) => {
          const id = uid("c");
          set((s) => ({ classes: [...s.classes, { ...c, id, inviteCode: makeInvite(c.name) }] }));
          audit(c.teacherId, "create", "Class", id, `Tạo lớp ${c.name}`);
          return id;
        },
        updateClass: (id, patch) => set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
        deleteClass: (id) => {
          if (get().assignments.some((a) => a.classId === id)) return false;
          set((s) => ({ classes: s.classes.filter((c) => c.id !== id), enrollments: s.enrollments.filter((e) => e.classId !== id) }));
          return true;
        },
        regenerateInvite: (id) => set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, inviteCode: makeInvite(c.name) } : c)) })),
        addStudentToClass: (classId, name) => {
          const studentId = uid("s");
          set((s) => ({
            users: [...s.users, { id: studentId, role: "student", name, email: `${studentId}@demo.edunova.vn`, hue: Math.floor(Math.random() * 360) }],
            enrollments: [...s.enrollments, { id: uid("en"), classId, studentId, status: "invited" }],
          }));
        },
        removeEnrollment: (enrollmentId) => set((s) => ({ enrollments: s.enrollments.filter((e) => e.id !== enrollmentId) })),

        createAssignment: (a) => {
          const id = uid("as");
          set((s) => ({ assignments: [{ ...a, id, publishedAt: now(), status: "open" }, ...s.assignments] }));
          audit(a.ownerId, "publish", "Assignment", id, `Giao "${a.title}"`);
          return id;
        },
        updateAssignment: (id, patch) => set((s) => ({ assignments: s.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

        startAttempt: ({ studentId, labTemplateId, assignmentId, labConfigId }) => {
          const existing = get().attempts.find(
            (a) => a.studentId === studentId && a.labTemplateId === labTemplateId && a.assignmentId === assignmentId && a.status !== "submitted",
          );
          if (existing) {
            if (existing.status === "paused") get().setAttemptStatus(existing.id, "in_progress");
            return existing.id;
          }
          const id = uid("att");
          const t = now();
          set((s) => ({ attempts: [{ id, studentId, labTemplateId, assignmentId, labConfigId, startedAt: t, updatedAt: t, status: "in_progress" }, ...s.attempts] }));
          return id;
        },
        setAttemptStatus: (id, status) => {
          set((s) => ({ attempts: s.attempts.map((a) => (a.id === id ? { ...a, status, updatedAt: now() } : a)) }));
          get().logEvent({ attemptId: id, type: status === "paused" ? "pause" : "resume", input: {}, output: {} });
        },
        setDraftRule: (id, rule) => set((s) => ({ attempts: s.attempts.map((a) => (a.id === id ? { ...a, draftRule: rule, updatedAt: now() } : a)) })),
        logEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid("ev"), timestamp: now() }] })),
        submit: (input) => {
          const id = uid("sub");
          const t = now();
          const assignment = get().assignments.find((a) => a.id === input.assignmentId);
          get().logEvent({ attemptId: input.attemptId, type: "submit", input: { rule: input.rule }, output: { passed: input.testResults.filter((r) => r.pass).length, total: input.testResults.length } });
          set((s) => ({
            submissions: [{ id, ...input, submittedAt: t, status: "submitted" }, ...s.submissions.filter((x) => !(x.assignmentId === input.assignmentId && x.studentId === input.studentId))],
            attempts: s.attempts.map((a) => (a.id === input.attemptId ? { ...a, status: "submitted", updatedAt: t } : a)),
          }));
          get().savePortfolioVersion({
            studentId: input.studentId,
            kind: "lab-report",
            title: `Báo cáo: ${assignment?.title ?? "Vườn tưới thông minh"}`,
            content: `Điều kiện: ${input.rule}\nKết quả kiểm thử: ${input.testResults.filter((r) => r.pass).length}/${input.testResults.length}\nGiải thích: ${input.explanation}`,
          });
          audit(input.studentId, "submit", "Submission", id, `Nộp bài "${assignment?.title ?? ""}"`);
          return id;
        },

        saveAssessment: (a) => {
          set((s) => {
            const existing = s.assessments.find((x) => x.submissionId === a.submissionId);
            const record = { ...a, id: existing?.id ?? uid("asm"), updatedAt: now() };
            return {
              assessments: existing ? s.assessments.map((x) => (x.id === existing.id ? record : x)) : [record, ...s.assessments],
              submissions: s.submissions.map((x) => (x.id === a.submissionId ? { ...x, status: a.status === "final" ? "graded" : "submitted" } : x)),
            };
          });
          audit(a.teacherId, "grade", "Assessment", a.submissionId, a.status === "final" ? "Lưu đánh giá chính thức" : "Lưu nháp đánh giá");
        },

        addResource: (r) => {
          const id = uid("res");
          set((s) => ({ resources: [{ ...r, id, createdAt: now() }, ...s.resources] }));
          return id;
        },
        updateResource: (id, patch) => set((s) => ({ resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
        deleteResource: (id) => set((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),

        savePortfolioVersion: ({ studentId, kind, title, content, itemId }) => {
          const existing = itemId ? get().portfolio.find((p) => p.id === itemId) : undefined;
          if (existing) {
            set((s) => ({
              portfolio: s.portfolio.map((p) =>
                p.id === existing.id ? { ...p, title, versions: [...p.versions, { version: p.versions.length + 1, content, savedAt: now() }] } : p,
              ),
            }));
            return existing.id;
          }
          const id = uid("pf");
          set((s) => ({ portfolio: [{ id, studentId, kind, title, versions: [{ version: 1, content, savedAt: now() }], createdAt: now() }, ...s.portfolio] }));
          return id;
        },

        logAI: (i) => {
          const id = uid("ai");
          set((s) => ({ aiInteractions: [{ ...i, id, demo: true as const, createdAt: now() }, ...s.aiInteractions].slice(0, 300) }));
          return id;
        },
        reviewAI: (id, decision) => set((s) => ({ aiInteractions: s.aiInteractions.map((x) => (x.id === id ? { ...x, reviewed: decision } : x)) })),
        verifyLesson: (lessonId, verifierId, note) => {
          set((s) => ({ verifications: [{ lessonId, verifierId, note, verifiedAt: now() }, ...s.verifications.filter((v) => v.lessonId !== lessonId)] }));
          audit(verifierId, "verify", "Lesson", lessonId, `Thẩm định bài học: ${note || "không ghi chú"}`);
        },
        unverifyLesson: (lessonId) => set((s) => ({ verifications: s.verifications.filter((v) => v.lessonId !== lessonId) })),
        recordAudit: audit,

        markSection: (studentId, lessonId, sectionId, done) =>
          set((s) => ({ lessonProgress: upsertProgress(s.lessonProgress, studentId, lessonId, (p) => ({ ...p, lastSection: sectionId, sectionsDone: done ? [...new Set([...p.sectionsDone, sectionId])] : p.sectionsDone.filter((x) => x !== sectionId) })) })),
        toggleConfused: (studentId, lessonId, sectionId) =>
          set((s) => ({ lessonProgress: upsertProgress(s.lessonProgress, studentId, lessonId, (p) => ({ ...p, confused: p.confused.includes(sectionId) ? p.confused.filter((x) => x !== sectionId) : [...p.confused, sectionId] })) })),
        setLastSection: (studentId, lessonId, sectionId) =>
          set((s) => ({ lessonProgress: upsertProgress(s.lessonProgress, studentId, lessonId, (p) => ({ ...p, lastSection: sectionId })) })),
        recordLessonQuiz: (studentId, lessonId, correct, total) =>
          set((s) => ({ lessonProgress: upsertProgress(s.lessonProgress, studentId, lessonId, (p) => ({ ...p, lastSection: "kiem-tra", quiz: { correct, total, at: now() }, sectionsDone: correct / total >= 0.6 ? [...new Set([...p.sectionsDone, "kiem-tra"])] : p.sectionsDone.filter((x) => x !== "kiem-tra") })) })),
        addNote: (studentId, lessonId, text) => set((s) => ({ notes: [{ id: uid("note"), studentId, lessonId, text, createdAt: now() }, ...s.notes] })),
        deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        toggleBookmark: (b) => {
          const existing = get().bookmarks.find((x) => x.studentId === b.studentId && x.kind === b.kind && x.refId === b.refId);
          if (existing) {
            set((s) => ({ bookmarks: s.bookmarks.filter((x) => x.id !== existing.id) }));
            return false;
          }
          set((s) => ({ bookmarks: [{ ...b, id: uid("bm"), createdAt: now() }, ...s.bookmarks] }));
          return true;
        },
        savePracticeAttempt: (a) => {
          const id = uid("pa");
          set((s) => ({ practiceAttempts: [{ ...a, id }, ...s.practiceAttempts] }));
          return id;
        },
        saveCode: (studentId, exerciseId, code, versionNote) =>
          set((s) => {
            const cur = s.codeWorks.find((c) => c.studentId === studentId && c.exerciseId === exerciseId);
            const t = now();
            const base = cur ?? { id: uid("cw"), studentId, exerciseId, code, versions: [], updatedAt: t };
            const next = { ...base, code, updatedAt: t, versions: versionNote ? [...base.versions, { code, savedAt: t, note: versionNote }].slice(-30) : base.versions };
            return { codeWorks: cur ? s.codeWorks.map((c) => (c.id === cur.id ? next : c)) : [next, ...s.codeWorks] };
          }),
        recordCodeRun: (studentId, exerciseId, code, run) => {
          get().saveCode(studentId, exerciseId, code);
          set((s) => ({ codeWorks: s.codeWorks.map((c) => (c.studentId === studentId && c.exerciseId === exerciseId ? { ...c, lastRun: { ...run, at: now() } } : c)) }));
        },
        saveGameCode: (studentId, gameSlug, level, code) =>
          set((s) => ({ gameProgress: upsertGame(s.gameProgress, studentId, gameSlug, (g) => ({ ...g, codeByLevel: { ...g.codeByLevel, [level]: code } })) })),
        recordGameRun: (studentId, gameSlug, level, code, score, total) => {
          const passed = score === total;
          const before = get().gameProgress.find((g) => g.studentId === studentId && g.gameSlug === gameSlug)?.passed.includes(level) ?? false;
          set((s) => ({
            gameProgress: upsertGame(s.gameProgress, studentId, gameSlug, (g) => ({
              ...g,
              codeByLevel: { ...g.codeByLevel, [level]: code },
              passed: passed ? [...new Set([...g.passed, level])].sort() : g.passed,
              history: [...g.history, { level, at: now(), score, total, passed }].slice(-100),
            })),
          }));
          return passed && !before;
        },
        createProject: (p) => {
          const id = uid("pj");
          const t = now();
          set((s) => ({ projects: [{ ...p, id, createdAt: t, updatedAt: t, log: [{ at: t, note: "Tạo dự án" }] }, ...s.projects] }));
          return id;
        },
        updateProject: (id, patch, logNote) =>
          set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now(), log: logNote ? [...p.log, { at: now(), note: logNote }].slice(-50) : p.log } : p)) })),
        deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
        reportIssue: (userId, area, text) => set((s) => ({ reports: [{ id: uid("rp"), userId, area, text, at: now() }, ...s.reports] })),
        setPrefs: (userId, prefs) => set((s) => ({ prefs: { ...s.prefs, [userId]: { ...DEFAULT_PREFS, ...s.prefs[userId], ...prefs } } })),
        markNotifRead: (userId, ids) => set((s) => ({ notifRead: { ...s.notifRead, [userId]: [...new Set([...(s.notifRead[userId] ?? []), ...ids])] } })),
        setPortfolioVisibility: (id, v) => set((s) => ({ portfolio: s.portfolio.map((p) => (p.id === id ? { ...p, visibility: v } : p)) })),

        createCourse: ({ scaffold, ...c }) => {
          const id = uid("course");
          const t = now();
          set((s) => ({ courses: [{ ...c, id, topics: scaffold ? scaffoldTopics(c.grade, c.textbookId) : [], classIds: [], status: "draft", createdAt: t, updatedAt: t }, ...s.courses] }));
          audit(c.ownerId, "create", "Course", id, `Tạo khóa học "${c.title}"`);
          return id;
        },
        updateCourse: (id, patch) => set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)) })),
        deleteCourse: (id, actorId) => {
          set((s) => ({ courses: s.courses.filter((c) => c.id !== id), courseProgress: s.courseProgress.filter((p) => p.courseId !== id) }));
          audit(actorId, "delete", "Course", id, "Xóa khóa học");
        },
        publishCourse: (id, classIds, actorId) => {
          set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, classIds, status: "published", updatedAt: now() } : c)) }));
          const names = get().classes.filter((c) => classIds.includes(c.id)).map((c) => c.name).join(", ");
          audit(actorId, "publish", "Course", id, `Phát hành khóa học cho ${names}`);
        },
        unpublishCourse: (id, actorId) => {
          set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, status: "draft", updatedAt: now() } : c)) }));
          audit(actorId, "update", "Course", id, "Thu hồi khóa học về bản nháp");
        },
        markCourseBlock: (studentId, courseId, blockId, done, score) =>
          set((s) => ({
            courseProgress: upsertCourseProgress(s.courseProgress, studentId, courseId, (p) => {
              const next = { ...p.done };
              if (done) next[blockId] = { at: now(), ...(score !== undefined ? { score } : {}) };
              else delete next[blockId];
              return { ...p, done: next };
            }),
          })),
        saveTeacherQuiz: (q) => {
          const id = q.id ?? uid("tq");
          set((s) => ({ teacherQuizzes: [{ ...q, id, updatedAt: now() }, ...s.teacherQuizzes.filter((x) => x.id !== id)] }));
          return id;
        },
        addBookNote: (n) => set((s) => ({ bookNotes: [{ ...n, id: uid("bn"), at: now() }, ...s.bookNotes] })),
        deleteBookNote: (id, userId) => set((s) => ({ bookNotes: s.bookNotes.filter((n) => !(n.id === id && n.userId === userId)) })),
        toggleBookPick: (userId, key) => set((s) => ({ bookPicks: s.bookPicks.some((p) => p.userId === userId && p.key === key) ? s.bookPicks.filter((p) => !(p.userId === userId && p.key === key)) : [...s.bookPicks, { userId, key }] })),
        markBookRead: (userId, ref, sectionId) =>
          set((s) => {
            const cur = s.bookProgress.find((p) => p.userId === userId && p.ref === ref);
            if (cur && cur.last === sectionId && cur.read.includes(sectionId)) return {};
            const next = { userId, ref, read: [...new Set([...(cur?.read ?? []), sectionId])], last: sectionId, at: now() };
            return { bookProgress: [next, ...s.bookProgress.filter((p) => p !== cur)] };
          }),
        toggleTaught: (teacherId, classId, ref) =>
          set((s) => ({ taughtLessons: s.taughtLessons.some((t) => t.teacherId === teacherId && t.classId === classId && t.ref === ref) ? s.taughtLessons.filter((t) => !(t.teacherId === teacherId && t.classId === classId && t.ref === ref)) : [...s.taughtLessons, { teacherId, classId, ref, at: now() }] })),
        recordLabResult: (r) => set((s) => ({ labResults: [{ ...r, id: uid("lr"), finishedAt: now() }, ...s.labResults].slice(0, 5000) })),
        deleteTeacherQuiz: (id, ownerId) => set((s) => ({ teacherQuizzes: s.teacherQuizzes.filter((x) => !(x.id === id && x.ownerId === ownerId)) })),
        toggleLessonLab: (ownerId, sgkRef, slug) =>
          set((s) => {
            const has = s.lessonLabs.some((l) => l.ownerId === ownerId && l.sgkRef === sgkRef && l.slug === slug);
            return { lessonLabs: has ? s.lessonLabs.filter((l) => !(l.ownerId === ownerId && l.sgkRef === sgkRef && l.slug === slug)) : [...s.lessonLabs, { ownerId, sgkRef, slug }] };
          }),
        logTutorEvent: (e) => set((s) => ({ tutorEvents: [{ ...e, id: uid("te"), at: now() }, ...s.tutorEvents].slice(0, 2000) })),
        setCourseLastLesson: (studentId, courseId, lessonId) =>
          set((s) => ({ courseProgress: upsertCourseProgress(s.courseProgress, studentId, courseId, (p) => ({ ...p, lastLessonId: lessonId })) })),
      } as AppState;
    },
    {
      name: "edunova-v3",
      version: 1,
      storage: createJSONStorage(safeStorage),
      skipHydration: true,
      partialize: (s) => {
        // chỉ lưu dữ liệu, không lưu hàm
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(s)) if (typeof v !== "function") out[k] = v;
        // đăng nhập thật: phiên nằm trong cookie Supabase, không lưu người dùng hiện tại vào localStorage
        if (AUTH_MODE === "supabase") delete out.userId;
        return out as Partial<AppState>;
      },
    },
  ),
);

function upsertCourseProgress(list: DemoData["courseProgress"], studentId: string, courseId: string, fn: (p: DemoData["courseProgress"][number]) => DemoData["courseProgress"][number]) {
  const cur = list.find((p) => p.studentId === studentId && p.courseId === courseId);
  const next = { ...fn(cur ?? { studentId, courseId, done: {}, updatedAt: now() }), updatedAt: now() };
  return cur ? list.map((p) => (p === cur ? next : p)) : [next, ...list];
}

function upsertProgress(list: DemoData["lessonProgress"], studentId: string, lessonId: string, fn: (p: DemoData["lessonProgress"][number]) => DemoData["lessonProgress"][number]) {
  const cur = list.find((p) => p.studentId === studentId && p.lessonId === lessonId);
  const next = { ...fn(cur ?? { studentId, lessonId, sectionsDone: [], confused: [], updatedAt: now() }), updatedAt: now() };
  return cur ? list.map((p) => (p === cur ? next : p)) : [next, ...list];
}

function upsertGame(list: DemoData["gameProgress"], studentId: string, gameSlug: string, fn: (g: DemoData["gameProgress"][number]) => DemoData["gameProgress"][number]) {
  const cur = list.find((g) => g.studentId === studentId && g.gameSlug === gameSlug);
  const next = { ...fn(cur ?? { studentId, gameSlug, passed: [], codeByLevel: {}, history: [], updatedAt: now() }), updatedAt: now() };
  return cur ? list.map((g) => (g === cur ? next : g)) : [next, ...list];
}

/** localStorage có thể bị chặn (cửa sổ riêng tư, khung nhúng) → dùng bộ nhớ tạm, app vẫn chạy. */
function safeStorage(): Storage {
  try {
    const k = "__edunova_probe__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      get length() { return mem.size; },
      clear: () => mem.clear(),
      getItem: (key) => mem.get(key) ?? null,
      key: (i) => [...mem.keys()][i] ?? null,
      removeItem: (key) => void mem.delete(key),
      setItem: (key, value) => void mem.set(key, value),
    };
  }
}

function makeInvite(name: string): string {
  const code = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TIN${name.replace(/\W/g, "").toUpperCase()}-${code}`;
}

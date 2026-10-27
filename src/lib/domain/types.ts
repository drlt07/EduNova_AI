// Domain model — khớp docs/DATA_MODEL.md. Mọi id là string.

export type Role = "teacher" | "student" | "admin";
export type Grade = 10 | 11 | 12;
export type Pathway = "chung" | "ICT" | "CS";
export type TextbookId = "kntt" | "cd" | "ctst";
export type Visibility = "private" | "class" | "school" | "public";
export type FeatureStatus = "REAL" | "DEMO" | "PLANNED";
export type LabMode = "explore" | "challenge" | "assessment";
export type HintMode = "off" | "guided" | "full";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  /** chỉ dùng để tô màu avatar */
  hue: number;
}

export interface Textbook {
  id: TextbookId;
  name: string;
  short: string;
  publisher: string;
}

export interface Topic {
  id: string;
  code: string; // A..G theo GDPT 2018
  name: string;
}

export interface Chapter {
  id: string;
  textbookId: TextbookId;
  grade: Grade;
  topicId: string;
  title: string;
  order: number;
}

export interface Objective {
  id: string;
  code: string;
  grade: Grade;
  topicId: string;
  pathway: Pathway;
  description: string;
  level: "biết" | "hiểu" | "vận dụng";
  curriculumVerified: boolean;
}

export interface Lesson {
  id: string;
  chapterId: string;
  textbookId: TextbookId;
  grade: Grade;
  topicId: string;
  pathway: Pathway;
  title: string;
  order: number;
  summary: string;
  objectiveIds: string[];
  keywords: string[];
  concepts?: { term: string; definition: string }[];
  quiz?: QuizQuestion[];
  /** khóa chung của bài (giống nhau giữa các bộ sách) */
  key: string;
  difficulty: Difficulty;
  curriculumVerified: boolean;
}

export type Difficulty = "co-ban" | "trung-binh" | "nang-cao";

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CurriculumMapping {
  id: string;
  labTemplateId: string;
  lessonId: string;
  objectiveIds: string[];
}

export interface CurriculumVerification {
  lessonId: string;
  verifierId: string;
  verifiedAt: string;
  note: string;
}

// ---------- Lab templates ----------
export type EngineKind = "svg-ts" | "iframe-sandbox" | "phaser" | "r3f" | "r3f-glb" | "pyodide-worker";

export interface LabParam {
  key: string;
  label: string;
  type: "number" | "boolean" | "select";
  min?: number;
  max?: number;
  options?: string[];
  default: number | boolean | string;
}

export interface LabTestCase {
  id: string;
  name: string;
  input: Record<string, number | boolean>;
  expected: Record<string, boolean>;
  category: "normal" | "boundary" | "no-water" | "extreme";
}

export interface LabTemplate {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  grades: Grade[];
  pathways: Pathway[];
  textbookMapping: { textbookId: TextbookId; lessonIds: string[] }[];
  objectiveIds: string[];
  capabilities: string[];
  parameterSchema: LabParam[];
  engine: EngineKind;
  safetyConstraints: string[];
  testCases: LabTestCase[];
  evidenceEvents: ExperimentEventType[];
  rubricMapping: { criterionKey: string; objectiveId: string }[];
  status: "available" | "preview" | "planned";
  featureStatus: FeatureStatus;
  assets: { name: string; kind: "svg" | "glb" | "png" | "json"; status: "ready" | "missing" }[];
  provenance: { author: string; license: string; source: string };
  tags: string[];
  modes: LabMode[];
  accent: "cyan" | "blue" | "violet" | "emerald" | "amber" | "rose";
  sampleTasks: string[];
}

// ---------- Teacher content ----------
export type LessonPhase = "mo-dau" | "hinh-thanh" | "luyen-tap" | "van-dung";

export interface PlanActivity {
  id: string;
  phase: LessonPhase;
  title: string;
  objectiveIds: string[];
  content: string;
  product: string;
  organization: string;
  labTemplateId?: string;
  evidence: string;
}

export interface LessonPlan {
  id: string;
  ownerId: string;
  title: string;
  grade: Grade;
  textbookId: TextbookId;
  lessonId: string;
  objectiveIds: string[];
  durationMinutes: number;
  status: "draft" | "published";
  visibility: Visibility;
  activities: PlanActivity[];
  notes: string;
  uploadedFile?: { name: string; size: number; parsed: false };
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  curriculumVerified: boolean;
}

export interface LessonPlanVersion {
  id: string;
  lessonPlanId: string;
  version: number;
  note: string;
  authorId: string;
  createdAt: string;
  snapshot: Omit<LessonPlan, "currentVersion">;
}

export interface SmartGardenParams {
  threshold: number;
  requireWater: boolean;
  initialHumidity: number;
  initialHasWater: boolean;
  allowRuleEditor: boolean;
}

export interface LabConfiguration {
  id: string;
  ownerId: string;
  labTemplateId: string;
  title: string;
  mode: LabMode;
  hintMode: HintMode;
  params: SmartGardenParams;
  testCaseIds: string[];
  version: number;
  parentId?: string;
  visibility: Visibility;
  createdAt: string;
}

export interface ActivityQuestion {
  id: string;
  kind: "mcq" | "short";
  prompt: string;
  options: string[];
  correctIndex?: number;
}

export interface TeachingActivity {
  id: string;
  ownerId: string;
  lessonPlanId: string;
  objectiveIds: string[];
  format: "lab" | "quiz" | "project";
  title: string;
  instructions: string;
  labConfigId?: string;
  rubricId: string;
  questions: ActivityQuestion[];
  status: "draft" | "published";
  createdAt: string;
}

export interface RubricLevel {
  score: number;
  descriptor: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  objectiveId: string;
  maxScore: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  ownerId: string;
  title: string;
  criteria: RubricCriterion[];
}

export interface Assignment {
  id: string;
  ownerId: string;
  activityId: string;
  classId: string;
  title: string;
  dueAt: string;
  hintMode: HintMode;
  publishedAt: string;
  status: "open" | "closed";
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: Grade;
  teacherId: string;
  schoolYear: string;
  inviteCode: string;
  textbookId: TextbookId;
  pathway: Pathway;
  schedule: { weekday: number; period: string; room: string }[];
}

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
}

// ---------- Evidence ----------
export type ExperimentEventType = "run" | "test" | "input_change" | "rule_change" | "reset" | "submit" | "pause" | "resume";

export interface ExperimentEvent {
  id: string;
  attemptId: string;
  type: ExperimentEventType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  pass?: boolean;
  timestamp: string;
}

export interface LabAttempt {
  id: string;
  studentId: string;
  labTemplateId: string;
  assignmentId?: string;
  labConfigId?: string;
  startedAt: string;
  updatedAt: string;
  status: "in_progress" | "paused" | "submitted";
  /** bản nháp luật hiện tại để tiếp tục */
  draftRule?: string;
}

export interface TestResult {
  caseId: string;
  pass: boolean;
  expected: boolean;
  actual: boolean | null;
  category: LabTestCase["category"];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptId: string;
  submittedAt: string;
  rule: string;
  explanation: string;
  answers: { questionId: string; answer: string }[];
  testResults: TestResult[];
  status: "submitted" | "graded";
}

export interface Assessment {
  id: string;
  submissionId: string;
  teacherId: string;
  rubricId: string;
  scores: { criterionId: string; score: number; comment: string }[];
  feedback: string;
  usedAiSuggestion: boolean;
  status: "draft" | "final";
  updatedAt: string;
}

export type AgentRole = "curriculum-analyst" | "lesson-planner" | "activity-designer" | "learning-mentor" | "learning-tutor" | "learning-analyst";

export interface AIInteraction {
  id: string;
  agent: AgentRole;
  userId: string;
  contextRef: string;
  inputSummary: string;
  output: unknown;
  demo: true;
  flags: string[];
  createdAt: string;
  reviewed?: "approved" | "rejected";
}

export interface PortfolioItem {
  id: string;
  studentId: string;
  visibility?: "private" | "teacher" | "class";
  kind: "lab-report" | "code" | "web" | "project";
  title: string;
  submissionId?: string;
  versions: { version: number; content: string; savedAt: string }[];
  createdAt: string;
}

export type ResourceKind = "question-bank" | "flashcards" | "diagram" | "worksheet";

export interface Resource {
  id: string;
  ownerId: string;
  kind: ResourceKind;
  title: string;
  lessonId: string;
  items: { front: string; back: string }[];
  source: "template-demo" | "teacher";
  reviewStatus: "pending" | "approved" | "rejected";
  visibility: Visibility;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  at: string;
}

export interface ActivityDraft {
  id: string;
  ownerId: string;
  step: number;
  values: unknown;
  updatedAt: string;
}

// ---------- Student Hub ----------
export interface LessonProgress {
  studentId: string;
  lessonId: string;
  sectionsDone: string[];
  confused: string[];
  lastSection?: string;
  quiz?: { correct: number; total: number; at: string };
  updatedAt: string;
}

export interface StudyNote {
  id: string;
  studentId: string;
  lessonId: string;
  text: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  studentId: string;
  kind: "lesson" | "game" | "exercise" | "term" | "practice";
  refId: string;
  title: string;
  href: string;
  detail?: string;
  createdAt: string;
}

export interface PracticeItemResult {
  questionId: string;
  objectiveId: string;
  status: "correct" | "wrong" | "self";
  answer: string;
}

export interface PracticeAttempt {
  id: string;
  studentId: string;
  setId: string;
  mode: "practice" | "adaptive" | "exam";
  items: PracticeItemResult[];
  startedAt: string;
  finishedAt: string;
}

export interface CodeWork {
  id: string;
  studentId: string;
  exerciseId: string;
  code: string;
  versions: { code: string; savedAt: string; note: string }[];
  lastRun?: { passed: number; total: number; at: string; errorType?: string };
  updatedAt: string;
}

export interface GameProgress {
  studentId: string;
  gameSlug: string;
  passed: number[];
  codeByLevel: Record<number, string>;
  history: { level: number; at: string; score: number; total: number; passed: boolean }[];
  updatedAt: string;
}

export interface StudentProject {
  id: string;
  studentId: string;
  templateId: string;
  title: string;
  kind: "python" | "web" | "report";
  files: { name: string; content: string }[];
  tasks: { text: string; done: boolean }[];
  log: { at: string; note: string }[];
  visibility: "private" | "teacher" | "class";
  status: "doing" | "done";
  reflection: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportReport {
  id: string;
  userId: string;
  area: string;
  text: string;
  at: string;
}

export interface UserPrefs {
  fontScale: number;
  highContrast: boolean;
}

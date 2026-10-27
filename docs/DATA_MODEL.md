# Data model

Kiểu TypeScript: `src/lib/domain/types.ts`. SQL + RLS: `supabase/migrations/20261027000000_init.sql` (kiểm thử: `tests/db/rls.test.ts`).

| Thực thể | Khóa ngoại chính | Owner / Scope |
|---|---|---|
| Users / Profiles / Roles | — | bản thân; role ∈ teacher/student/admin |
| Classes | `teacherId → Users` | giáo viên sở hữu |
| Enrollments | `classId → Classes`, `studentId → Users` | lớp |
| Textbooks, Topics, Chapters, Lessons, Objectives | Lesson → Chapter → Textbook; Lesson/Objective → Topic | public, `curriculumVerified` |
| CurriculumMappings | `labTemplateId`, `lessonId`, `objectiveIds[]` | public |
| LessonPlans | `ownerId`, `lessonId`, `textbookId`, `objectiveIds[]` | owner + visibility (private/class/school/public) |
| LessonPlanVersions | `lessonPlanId` | owner |
| TeachingActivities | `lessonPlanId`, `labConfigId?`, `rubricId?`, `objectiveIds[]` | owner |
| LabTemplates | — | public catalog, admin quản lý status |
| LabConfigurations | `labTemplateId`, `ownerId` | owner + visibility |
| Rubrics / RubricCriteria | `ownerId`; criterion `objectiveId` | owner |
| Assignments | `activityId`, `classId`, `ownerId` | owner; học sinh thuộc lớp được đọc |
| LabAttempts | `studentId`, `assignmentId?`, `labConfigId?` | học sinh; GV của lớp được đọc |
| ExperimentEvents | `attemptId` | như attempt |
| Submissions | `assignmentId`, `studentId`, `attemptId` | học sinh; GV của lớp |
| Assessments | `submissionId`, `teacherId`, scores → `criterionId` | GV của lớp; học sinh đọc khi `final` |
| AIInteractions | `userId`, `contextRef` | người dùng; admin audit |
| PortfolioItems | `studentId`, `submissionId?` | học sinh |
| Resources (Học liệu) | `ownerId`, `lessonId` | owner + visibility |
| Assets | `labTemplateId` | public, có provenance/license |
| AuditEvents | `actorId` | admin |
| CurriculumVerifications | `lessonId`, `verifierId` | admin/teacher |

Quy tắc phạm vi (mô phỏng RLS trong `src/lib/store/scoped.ts`, có test):
- Giáo viên chỉ thấy lớp `teacherId = me` và mọi bản ghi gắn với các lớp đó.
- Học sinh chỉ thấy assignment của lớp mình ghi danh, attempt/submission/assessment của chính mình.
- Không truy vấn chéo lớp.

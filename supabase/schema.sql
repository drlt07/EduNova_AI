-- EduNova AI — BẢN NHÁP schema PostgreSQL/Supabase cho giai đoạn tích hợp.
-- TRẠNG THÁI: PLANNED. Chưa được áp dụng vào cơ sở dữ liệu nào và CHƯA được kiểm thử.
-- Giai đoạn 1 dùng mock repository (src/lib/store) với cùng quy tắc phạm vi (src/lib/store/scoped.ts).

create type app_role as enum ('teacher', 'student', 'admin');
create type visibility as enum ('private', 'class', 'school', 'public');
create type lab_mode as enum ('explore', 'challenge', 'assessment');
create type hint_mode as enum ('off', 'guided', 'full');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'student',
  full_name text not null,
  school_id uuid,
  created_at timestamptz not null default now()
);

-- ---------- Chương trình (đọc công khai) ----------
create table textbooks (id text primary key, name text not null, publisher text not null);
create table topics (id text primary key, code text not null, name text not null);
create table chapters (id text primary key, textbook_id text not null references textbooks(id), grade smallint not null check (grade in (10,11,12)), topic_id text not null references topics(id), title text not null, ord int not null);
create table lessons (
  id text primary key, chapter_id text not null references chapters(id), textbook_id text not null references textbooks(id),
  grade smallint not null, topic_id text not null references topics(id), pathway text not null check (pathway in ('chung','ICT','CS')),
  title text not null, ord int not null, summary text, curriculum_verified boolean not null default false
);
create table objectives (id text primary key, grade smallint not null, topic_id text not null references topics(id), pathway text not null, level text not null, description text not null, curriculum_verified boolean not null default false);
create table lesson_objectives (lesson_id text references lessons(id) on delete cascade, objective_id text references objectives(id), primary key (lesson_id, objective_id));
create table curriculum_verifications (lesson_id text primary key references lessons(id), verifier_id uuid not null references profiles(id), verified_at timestamptz not null default now(), note text not null);
create table lab_templates (id text primary key, slug text unique not null, title text not null, engine text not null, status text not null, feature_status text not null, spec jsonb not null);
create table curriculum_mappings (id uuid primary key default gen_random_uuid(), lab_template_id text not null references lab_templates(id), lesson_id text not null references lessons(id), objective_ids text[] not null);

-- ---------- Lớp học ----------
create table classes (
  id uuid primary key default gen_random_uuid(), name text not null, grade smallint not null, teacher_id uuid not null references profiles(id),
  school_year text not null, invite_code text unique not null, textbook_id text references textbooks(id), pathway text not null
);
create table enrollments (class_id uuid references classes(id) on delete cascade, student_id uuid references profiles(id) on delete cascade, primary key (class_id, student_id));

-- ---------- Nội dung giáo viên ----------
create table lesson_plans (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), title text not null, grade smallint not null,
  textbook_id text references textbooks(id), lesson_id text references lessons(id), objective_ids text[] not null default '{}',
  duration_minutes int not null check (duration_minutes between 15 and 180), status text not null default 'draft', visibility visibility not null default 'private',
  content jsonb not null default '{}', current_version int not null default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table lesson_plan_versions (id uuid primary key default gen_random_uuid(), lesson_plan_id uuid not null references lesson_plans(id) on delete cascade, version int not null, note text, author_id uuid references profiles(id), snapshot jsonb not null, created_at timestamptz default now(), unique (lesson_plan_id, version));
create table lab_configurations (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), lab_template_id text not null references lab_templates(id), title text not null, mode lab_mode not null, hint_mode hint_mode not null, params jsonb not null, test_case_ids text[] not null, version int not null default 1, parent_id uuid references lab_configurations(id), visibility visibility not null default 'private', created_at timestamptz default now(),
  constraint assessment_no_hints check (mode <> 'assessment' or hint_mode = 'off'));
create table rubrics (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), title text not null);
create table rubric_criteria (id uuid primary key default gen_random_uuid(), rubric_id uuid not null references rubrics(id) on delete cascade, title text not null, objective_id text not null references objectives(id), max_score int not null check (max_score between 1 and 10), levels jsonb not null);
create table teaching_activities (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), lesson_plan_id uuid not null references lesson_plans(id), objective_ids text[] not null, format text not null, title text not null, instructions text not null, lab_config_id uuid references lab_configurations(id), rubric_id uuid not null references rubrics(id), questions jsonb not null, status text not null, created_at timestamptz default now());
create table assignments (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), activity_id uuid not null references teaching_activities(id), class_id uuid not null references classes(id), title text not null, due_at timestamptz not null, hint_mode hint_mode not null, published_at timestamptz default now(), status text not null default 'open', unique (activity_id, class_id));

-- ---------- Minh chứng ----------
create table lab_attempts (id uuid primary key default gen_random_uuid(), student_id uuid not null references profiles(id), lab_template_id text not null references lab_templates(id), assignment_id uuid references assignments(id), lab_config_id uuid references lab_configurations(id), status text not null, draft_rule text, started_at timestamptz default now(), updated_at timestamptz default now());
create table experiment_events (id bigint generated always as identity primary key, attempt_id uuid not null references lab_attempts(id) on delete cascade, type text not null, input jsonb not null, output jsonb not null, pass boolean, ts timestamptz not null default now());
create table submissions (id uuid primary key default gen_random_uuid(), assignment_id uuid not null references assignments(id), student_id uuid not null references profiles(id), attempt_id uuid not null references lab_attempts(id), rule text not null, explanation text, answers jsonb not null, test_results jsonb not null, status text not null, submitted_at timestamptz default now(), unique (assignment_id, student_id));
create table assessments (id uuid primary key default gen_random_uuid(), submission_id uuid unique not null references submissions(id) on delete cascade, teacher_id uuid not null references profiles(id), rubric_id uuid not null references rubrics(id), scores jsonb not null, feedback text, used_ai_suggestion boolean not null default false, status text not null, updated_at timestamptz default now());
create table ai_interactions (id uuid primary key default gen_random_uuid(), agent text not null, user_id uuid not null references profiles(id), context_ref text, input_summary text, output jsonb not null, flags text[] not null default '{}', prompt_version text not null, reviewed text, created_at timestamptz default now());
create table portfolio_items (id uuid primary key default gen_random_uuid(), student_id uuid not null references profiles(id), kind text not null, title text not null, submission_id uuid references submissions(id), versions jsonb not null, created_at timestamptz default now());
create table assets (id uuid primary key default gen_random_uuid(), lab_template_id text references lab_templates(id), storage_path text not null, kind text not null, license text not null, provenance text not null);
create table audit_events (id bigint generated always as identity primary key, actor_id uuid references profiles(id), action text not null, entity text not null, entity_id text not null, summary text, at timestamptz default now());

-- ---------- Hàm trợ giúp RLS ----------
create function is_teacher_of_class(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from classes where id = c and teacher_id = auth.uid()) $$;
create function is_enrolled(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments where class_id = c and student_id = auth.uid()) $$;
create function current_role_is(r app_role) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = r) $$;

-- ---------- RLS ----------
alter table classes enable row level security;
create policy classes_teacher on classes for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_student_read on classes for select using (is_enrolled(id));

alter table enrollments enable row level security;
create policy enroll_teacher on enrollments for all using (is_teacher_of_class(class_id));
create policy enroll_self_read on enrollments for select using (student_id = auth.uid());

alter table assignments enable row level security;
create policy asg_teacher on assignments for all using (owner_id = auth.uid() and is_teacher_of_class(class_id)) with check (owner_id = auth.uid() and is_teacher_of_class(class_id));
create policy asg_student_read on assignments for select using (is_enrolled(class_id));

alter table lab_attempts enable row level security;
create policy att_student on lab_attempts for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy att_teacher_read on lab_attempts for select using (exists (select 1 from assignments a where a.id = assignment_id and is_teacher_of_class(a.class_id)));

alter table experiment_events enable row level security;
create policy ev_student on experiment_events for all using (exists (select 1 from lab_attempts t where t.id = attempt_id and t.student_id = auth.uid()));
create policy ev_teacher_read on experiment_events for select using (exists (select 1 from lab_attempts t join assignments a on a.id = t.assignment_id where t.id = attempt_id and is_teacher_of_class(a.class_id)));

alter table submissions enable row level security;
create policy sub_student on submissions for all using (student_id = auth.uid()) with check (student_id = auth.uid() and exists (select 1 from assignments a where a.id = assignment_id and is_enrolled(a.class_id) and a.status = 'open'));
create policy sub_teacher_read on submissions for select using (exists (select 1 from assignments a where a.id = assignment_id and is_teacher_of_class(a.class_id)));

alter table assessments enable row level security;
create policy asm_teacher on assessments for all using (exists (select 1 from submissions s join assignments a on a.id = s.assignment_id where s.id = submission_id and is_teacher_of_class(a.class_id)));
create policy asm_student_read on assessments for select using (status = 'final' and exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()));

alter table lesson_plans enable row level security;
create policy lp_owner on lesson_plans for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy lp_shared_read on lesson_plans for select using (visibility in ('school', 'public') and current_role_is('teacher'));

alter table lab_configurations enable row level security;
create policy lc_owner on lab_configurations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy lc_shared_read on lab_configurations for select using (visibility in ('school', 'public'));

alter table portfolio_items enable row level security;
create policy pf_owner on portfolio_items for all using (student_id = auth.uid());

alter table ai_interactions enable row level security;
create policy ai_owner_read on ai_interactions for select using (user_id = auth.uid() or current_role_is('admin'));
-- Ghi ai_interactions chỉ từ server (service role), không cho client insert trực tiếp.

alter table audit_events enable row level security;
create policy audit_admin on audit_events for select using (current_role_is('admin'));

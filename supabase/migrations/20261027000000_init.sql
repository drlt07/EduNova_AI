-- EduNova AI — schema PostgreSQL/Supabase: dữ liệu, xác thực và phân quyền theo dòng (RLS).
-- Kiểm thử: tests/db/rls.test.ts chạy file này trên PGlite với bản giả lập auth.users / auth.uid().
--
-- Nguyên tắc:
--  * Xác thực bằng Supabase Auth (email + mật khẩu). Mật khẩu chỉ nằm trong auth.users (đã băm).
--  * Vai trò nằm ở profiles.role, người dùng KHÔNG tự sửa được (chỉ được sửa full_name, school).
--  * Ai đăng ký cũng là học sinh. Email thuộc tên miền trường (school_domains) và ĐÃ XÁC NHẬN thì là giáo viên.
--    Bắt buộc bật "Confirm email" trong Supabase Auth, nếu không ai cũng có thể khai email trường.
--  * Mọi bảng bật RLS; client chỉ thấy dữ liệu của mình, của lớp mình dạy, hoặc của lớp mình học.

create type app_role as enum ('teacher', 'student', 'admin');
create type visibility as enum ('private', 'class', 'school', 'public');
create type lab_mode as enum ('explore', 'challenge', 'assessment');
create type hint_mode as enum ('off', 'guided', 'full');

-- ---------- Người dùng ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'student',
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null,
  school text,
  created_at timestamptz not null default now()
);

-- Tên miền email của trường; chỉ quản trị viên quản lý.
create table school_domains (
  domain text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  school_name text not null,
  created_at timestamptz not null default now()
);

-- ---------- Chương trình (mọi người dùng đã đăng nhập được đọc) ----------
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
create table assets (id uuid primary key default gen_random_uuid(), lab_template_id text references lab_templates(id), storage_path text not null, kind text not null, license text not null, provenance text not null);

-- ---------- Lớp học ----------
create table classes (
  id uuid primary key default gen_random_uuid(), name text not null, grade smallint not null check (grade in (10,11,12)), teacher_id uuid not null references profiles(id),
  school_year text not null, invite_code text unique not null check (char_length(invite_code) >= 6), textbook_id text references textbooks(id), pathway text not null default 'chung'
);
create table enrollments (class_id uuid references classes(id) on delete cascade, student_id uuid references profiles(id) on delete cascade, joined_at timestamptz not null default now(), primary key (class_id, student_id));

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
create table teaching_activities (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), lesson_plan_id uuid references lesson_plans(id), objective_ids text[] not null, format text not null, title text not null, instructions text not null, lab_config_id uuid references lab_configurations(id), rubric_id uuid not null references rubrics(id), questions jsonb not null, status text not null, created_at timestamptz default now());
create table assignments (id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), activity_id uuid not null references teaching_activities(id), class_id uuid not null references classes(id) on delete cascade, title text not null, due_at timestamptz not null, hint_mode hint_mode not null, published_at timestamptz default now(), status text not null default 'open' check (status in ('open','closed')), unique (activity_id, class_id));

-- Khóa học & bài giảng: khung chủ đề → bài → khối nội dung lưu dạng jsonb (topics).
create table courses (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references profiles(id), title text not null, description text not null default '',
  grade smallint not null check (grade in (10,11,12)), textbook_id text not null, topics jsonb not null default '[]', sequential boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table course_classes (course_id uuid references courses(id) on delete cascade, class_id uuid references classes(id) on delete cascade, primary key (course_id, class_id));
create table course_progress (
  student_id uuid not null references profiles(id) on delete cascade, course_id uuid not null references courses(id) on delete cascade,
  lesson_ref text not null, block_ref text not null, done_at timestamptz not null default now(), primary key (student_id, course_id, lesson_ref, block_ref)
);

-- ---------- Minh chứng ----------
create table lab_attempts (id uuid primary key default gen_random_uuid(), student_id uuid not null references profiles(id), lab_template_id text not null references lab_templates(id), assignment_id uuid references assignments(id), lab_config_id uuid references lab_configurations(id), status text not null, draft_rule text, started_at timestamptz default now(), updated_at timestamptz default now());
create table experiment_events (id bigint generated always as identity primary key, attempt_id uuid not null references lab_attempts(id) on delete cascade, type text not null, input jsonb not null, output jsonb not null, pass boolean, ts timestamptz not null default now());
create table submissions (id uuid primary key default gen_random_uuid(), assignment_id uuid not null references assignments(id), student_id uuid not null references profiles(id), attempt_id uuid not null references lab_attempts(id), rule text not null, explanation text, answers jsonb not null, test_results jsonb not null, status text not null default 'submitted' check (status in ('submitted','graded')), submitted_at timestamptz default now(), unique (assignment_id, student_id));
create table assessments (id uuid primary key default gen_random_uuid(), submission_id uuid unique not null references submissions(id) on delete cascade, teacher_id uuid not null references profiles(id), rubric_id uuid not null references rubrics(id), scores jsonb not null, feedback text, used_ai_suggestion boolean not null default false, status text not null check (status in ('draft','final')), updated_at timestamptz default now());
create table ai_interactions (id uuid primary key default gen_random_uuid(), agent text not null, user_id uuid not null references profiles(id), context_ref text, input_summary text, output jsonb not null, flags text[] not null default '{}', prompt_version text not null, reviewed text, created_at timestamptz default now());
-- Sự kiện AI Gia sư: chỉ học sinh thấy của mình; giáo viên xem số liệu tổng hợp qua tutor_class_summary().
create table tutor_events (
  id bigint generated always as identity primary key, student_id uuid not null references profiles(id) on delete cascade, class_id uuid references classes(id) on delete cascade,
  topic text not null, kind text not null check (kind in ('hint','check','explain','solution')), error_kind text, at timestamptz not null default now()
);
create table portfolio_items (id uuid primary key default gen_random_uuid(), student_id uuid not null references profiles(id), kind text not null, title text not null, submission_id uuid references submissions(id), versions jsonb not null, created_at timestamptz default now());
create table audit_events (id bigint generated always as identity primary key, actor_id uuid references profiles(id), action text not null, entity text not null, entity_id text not null, summary text, at timestamptz default now());

-- ---------- Hàm trợ giúp RLS (security definer để tránh đệ quy policy) ----------
create function current_role_is(r app_role) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = r) $$;
create function is_teacher_of_class(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from classes where id = c and teacher_id = auth.uid()) and current_role_is('teacher') $$;
create function is_enrolled(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments where class_id = c and student_id = auth.uid()) $$;
create function teaches_student(s uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments e join classes c on c.id = e.class_id where e.student_id = s and c.teacher_id = auth.uid()) and current_role_is('teacher') $$;
create function owns_course(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from courses where id = c and owner_id = auth.uid()) $$;
create function can_view_course(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select owns_course(c) or exists (select 1 from courses co join course_classes cc on cc.course_id = co.id where co.id = c and co.status = 'published' and is_enrolled(cc.class_id)) $$;
create function activity_assigned_to_me(a uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from assignments s where s.activity_id = a and is_enrolled(s.class_id)) $$;

-- ---------- Vai trò theo email trường ----------
create function role_for_email(p_email text, p_confirmed timestamptz) returns app_role language sql stable security definer set search_path = public as
$$ select case when p_confirmed is not null and exists (select 1 from school_domains where domain = lower(split_part(p_email, '@', 2))) then 'teacher'::app_role else 'student'::app_role end $$;

-- Tạo/cập nhật hồ sơ khi tài khoản được tạo, đổi email hoặc xác nhận email. Không bao giờ hạ quyền quản trị viên.
create function handle_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into profiles (id, full_name, email, school, role)
    values (new.id,
            coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
            new.email,
            nullif(trim(new.raw_user_meta_data->>'school'), ''),
            role_for_email(new.email, new.email_confirmed_at));
  else
    update profiles
       set email = new.email,
           role = case when role = 'admin' then role else role_for_email(new.email, new.email_confirmed_at) end
     where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_changed after insert or update of email, email_confirmed_at on auth.users
  for each row execute function handle_auth_user();

-- Thêm tên miền trường thì nâng quyền các tài khoản đã xác nhận thuộc tên miền đó.
create function apply_school_domain() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles p set role = 'teacher'
    from auth.users u
   where u.id = p.id and p.role = 'student' and u.email_confirmed_at is not null
     and lower(split_part(u.email, '@', 2)) = new.domain;
  return new;
end $$;
create trigger on_school_domain_added after insert on school_domains for each row execute function apply_school_domain();

-- Quản trị viên đổi vai trò (vd cấp quyền giáo viên cho email cá nhân, hoặc thu hồi).
create function set_user_role(p_user uuid, p_role app_role) returns void language plpgsql security definer set search_path = public as $$
begin
  if not current_role_is('admin') then raise exception 'Chỉ quản trị viên được đổi vai trò' using errcode = '42501'; end if;
  update profiles set role = p_role where id = p_user;
end $$;

-- Học sinh vào lớp bằng mã mời; trả về id lớp.
create function join_class(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_class uuid;
begin
  if not current_role_is('student') then raise exception 'Chỉ học sinh được tham gia lớp bằng mã mời' using errcode = '42501'; end if;
  select id into v_class from classes where invite_code = upper(trim(p_code));
  if v_class is null then raise exception 'Mã lớp không đúng' using errcode = 'P0002'; end if;
  insert into enrollments (class_id, student_id) values (v_class, auth.uid()) on conflict do nothing;
  return v_class;
end $$;

-- Tổng hợp AI Gia sư cho giáo viên: không trả về học sinh cụ thể; nhóm dưới 2 học sinh bị ẩn.
create function tutor_class_summary(p_class uuid) returns table (topic text, error_kind text, students bigint, events bigint) language sql stable security definer set search_path = public as $$
  select t.topic, t.error_kind, count(distinct t.student_id), count(*)
    from tutor_events t
   where t.class_id = p_class and is_teacher_of_class(p_class)
   group by t.topic, t.error_kind
  having count(distinct t.student_id) >= 2
$$;

-- Bài nộp: không ai đổi người nộp / nhiệm vụ; giáo viên chỉ đổi trạng thái, không sửa nội dung bài của học sinh.
create function guard_submission_update() returns trigger language plpgsql set search_path = public as $$
begin
  if new.student_id <> old.student_id or new.assignment_id <> old.assignment_id then
    raise exception 'Không được đổi người nộp hoặc nhiệm vụ' using errcode = '42501';
  end if;
  if auth.uid() is distinct from old.student_id
     and (new.rule, new.explanation, new.answers, new.test_results, new.attempt_id, new.submitted_at)
         is distinct from (old.rule, old.explanation, old.answers, old.test_results, old.attempt_id, old.submitted_at) then
    raise exception 'Giáo viên không được sửa nội dung bài nộp' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger submissions_guard before update on submissions for each row execute function guard_submission_update();

revoke execute on function handle_auth_user(), apply_school_domain(), guard_submission_update() from public;

-- ---------- RLS ----------
alter table profiles enable row level security;
create policy profiles_self_read on profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin_read on profiles for select to authenticated using (current_role_is('admin'));
create policy profiles_teacher_reads_students on profiles for select to authenticated using (teaches_student(id));
create policy profiles_student_reads_teachers on profiles for select to authenticated using (exists (select 1 from classes c where c.teacher_id = profiles.id and is_enrolled(c.id)));
create policy profiles_self_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Chỉ được sửa tên hiển thị và trường; vai trò, email do hệ thống quản lý.
revoke insert, update, delete on profiles from anon, authenticated;
grant update (full_name, school) on profiles to authenticated;

alter table school_domains enable row level security;
create policy domains_admin on school_domains for all to authenticated using (current_role_is('admin')) with check (current_role_is('admin'));

do $$
declare t text;
begin
  foreach t in array array['textbooks','topics','chapters','lessons','objectives','lesson_objectives','lab_templates','curriculum_mappings','assets','curriculum_verifications'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (current_role_is(''admin'')) with check (current_role_is(''admin''))', t || '_admin', t);
  end loop;
end $$;

alter table classes enable row level security;
create policy classes_teacher on classes for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and current_role_is('teacher'));
create policy classes_student_read on classes for select to authenticated using (is_enrolled(id));
create policy classes_admin_read on classes for select to authenticated using (current_role_is('admin'));

alter table enrollments enable row level security;
create policy enroll_teacher on enrollments for all to authenticated using (is_teacher_of_class(class_id)) with check (is_teacher_of_class(class_id));
create policy enroll_self_read on enrollments for select to authenticated using (student_id = auth.uid());
create policy enroll_self_leave on enrollments for delete to authenticated using (student_id = auth.uid());

alter table lesson_plans enable row level security;
create policy lp_owner on lesson_plans for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and current_role_is('teacher'));
create policy lp_shared_read on lesson_plans for select to authenticated using (visibility in ('school', 'public') and current_role_is('teacher'));

alter table lesson_plan_versions enable row level security;
create policy lpv_owner on lesson_plan_versions for all to authenticated
  using (exists (select 1 from lesson_plans p where p.id = lesson_plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from lesson_plans p where p.id = lesson_plan_id and p.owner_id = auth.uid()));

alter table lab_configurations enable row level security;
create policy lc_owner on lab_configurations for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and current_role_is('teacher'));
create policy lc_shared_read on lab_configurations for select to authenticated using (visibility in ('school', 'public'));
create policy lc_assigned_read on lab_configurations for select to authenticated using (exists (select 1 from teaching_activities a where a.lab_config_id = lab_configurations.id and activity_assigned_to_me(a.id)));

alter table rubrics enable row level security;
create policy rb_owner on rubrics for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and current_role_is('teacher'));
create policy rb_assigned_read on rubrics for select to authenticated using (exists (select 1 from teaching_activities a where a.rubric_id = rubrics.id and activity_assigned_to_me(a.id)));

alter table rubric_criteria enable row level security;
create policy rc_owner on rubric_criteria for all to authenticated
  using (exists (select 1 from rubrics r where r.id = rubric_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from rubrics r where r.id = rubric_id and r.owner_id = auth.uid()));
create policy rc_assigned_read on rubric_criteria for select to authenticated using (exists (select 1 from teaching_activities a where a.rubric_id = rubric_criteria.rubric_id and activity_assigned_to_me(a.id)));

alter table teaching_activities enable row level security;
create policy ta_owner on teaching_activities for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and current_role_is('teacher'));
create policy ta_assigned_read on teaching_activities for select to authenticated using (activity_assigned_to_me(id));

alter table assignments enable row level security;
create policy asg_teacher on assignments for all to authenticated using (owner_id = auth.uid() and is_teacher_of_class(class_id)) with check (owner_id = auth.uid() and is_teacher_of_class(class_id));
create policy asg_student_read on assignments for select to authenticated using (is_enrolled(class_id));

alter table courses enable row level security;
create policy course_owner on courses for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and current_role_is('teacher'));
create policy course_student_read on courses for select to authenticated using (can_view_course(id));

alter table course_classes enable row level security;
create policy cc_owner on course_classes for all to authenticated using (owns_course(course_id)) with check (owns_course(course_id) and is_teacher_of_class(class_id));
create policy cc_student_read on course_classes for select to authenticated using (is_enrolled(class_id));

alter table course_progress enable row level security;
create policy cp_student on course_progress for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid() and can_view_course(course_id));
create policy cp_teacher_read on course_progress for select to authenticated using (owns_course(course_id));

alter table lab_attempts enable row level security;
create policy att_student on lab_attempts for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid() and (assignment_id is null or exists (select 1 from assignments a where a.id = assignment_id and is_enrolled(a.class_id))));
create policy att_teacher_read on lab_attempts for select to authenticated using (exists (select 1 from assignments a where a.id = assignment_id and is_teacher_of_class(a.class_id)));

alter table experiment_events enable row level security;
create policy ev_student on experiment_events for all to authenticated
  using (exists (select 1 from lab_attempts t where t.id = attempt_id and t.student_id = auth.uid()))
  with check (exists (select 1 from lab_attempts t where t.id = attempt_id and t.student_id = auth.uid()));
create policy ev_teacher_read on experiment_events for select to authenticated using (exists (select 1 from lab_attempts t join assignments a on a.id = t.assignment_id where t.id = attempt_id and is_teacher_of_class(a.class_id)));

alter table submissions enable row level security;
create policy sub_student_read on submissions for select to authenticated using (student_id = auth.uid());
-- Nộp / nộp lại chỉ khi nhiệm vụ còn mở và bài chưa được chấm.
create policy sub_student_insert on submissions for insert to authenticated
  with check (student_id = auth.uid() and status = 'submitted' and exists (select 1 from assignments a where a.id = assignment_id and is_enrolled(a.class_id) and a.status = 'open'));
create policy sub_student_update on submissions for update to authenticated
  using (student_id = auth.uid() and status = 'submitted' and exists (select 1 from assignments a where a.id = assignment_id and a.status = 'open'))
  with check (student_id = auth.uid() and status = 'submitted');
create policy sub_teacher_read on submissions for select to authenticated using (exists (select 1 from assignments a where a.id = assignment_id and is_teacher_of_class(a.class_id)));
create policy sub_teacher_grade on submissions for update to authenticated
  using (exists (select 1 from assignments a where a.id = assignment_id and is_teacher_of_class(a.class_id)))
  with check (exists (select 1 from assignments a where a.id = assignment_id and is_teacher_of_class(a.class_id)));

alter table assessments enable row level security;
create policy asm_teacher on assessments for all to authenticated
  using (exists (select 1 from submissions s join assignments a on a.id = s.assignment_id where s.id = submission_id and is_teacher_of_class(a.class_id)))
  with check (teacher_id = auth.uid() and exists (select 1 from submissions s join assignments a on a.id = s.assignment_id where s.id = submission_id and is_teacher_of_class(a.class_id)));
create policy asm_student_read on assessments for select to authenticated using (status = 'final' and exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()));

alter table tutor_events enable row level security;
create policy tutor_student on tutor_events for select to authenticated using (student_id = auth.uid());
create policy tutor_student_insert on tutor_events for insert to authenticated with check (student_id = auth.uid() and (class_id is null or is_enrolled(class_id)));

alter table portfolio_items enable row level security;
create policy pf_owner on portfolio_items for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

alter table ai_interactions enable row level security;
create policy ai_owner_read on ai_interactions for select to authenticated using (user_id = auth.uid() or current_role_is('admin'));
-- Ghi ai_interactions chỉ từ server (service role), không cho client insert trực tiếp.

alter table audit_events enable row level security;
create policy audit_admin on audit_events for select to authenticated using (current_role_is('admin'));

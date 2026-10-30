-- Đồng bộ phần còn lại của dữ liệu app (giai đoạn 2): bài giao, bài nộp, chấm điểm, kết quả mô phỏng, luyện tập,
-- tiến độ khóa học/bài học/trò chơi, ghi chú, khóa học, nội dung đã mở cho lớp…
-- Mỗi bản ghi của app là một dòng (kind + id) mang nguyên dữ liệu JSON; RLS quyết định ai đọc/ghi.
-- Chạy SAU 20261030000000_class_sync.sql. Chạy lại nhiều lần không sao.

create table if not exists app_records (
  kind text not null check (kind ~ '^[a-zA-Z]{2,40}$'),
  id text not null check (char_length(id) between 1 and 300),
  owner_id uuid not null references profiles(id) on delete cascade,
  -- Bản ghi giáo viên chia sẻ cho học sinh (bài giao, khóa học, nội dung đã mở…).
  shared boolean not null default false,
  -- Chia sẻ cho lớp nào; rỗng nghĩa là mọi lớp của người tạo.
  class_ids uuid[] not null default '{}',
  data jsonb not null check (pg_column_size(data) < 262144),
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);
create index if not exists app_records_owner on app_records (owner_id);
alter table app_records enable row level security;

-- Người dùng hiện tại là học sinh trong một lớp do `t` dạy.
create or replace function learns_from(t uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments e join classes c on c.id = e.class_id where e.student_id = auth.uid() and c.teacher_id = t) $$;
-- Người dùng hiện tại học ít nhất một lớp trong danh sách.
create or replace function enrolled_any(cs uuid[]) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments where student_id = auth.uid() and class_id = any(cs)) $$;

drop policy if exists records_read on app_records;
create policy records_read on app_records for select to authenticated using (
  owner_id = auth.uid()
  or teaches_student(owner_id)                       -- giáo viên xem bài làm, tiến độ của học sinh lớp mình
  or (shared and case when cardinality(class_ids) = 0 then learns_from(owner_id) else enrolled_any(class_ids) end)
  or current_role_is('admin')
);
-- Ghi bản ghi của mình; giáo viên được ghi bản ghi thuộc học sinh lớp mình (chấm điểm, nhận xét).
drop policy if exists records_insert on app_records;
create policy records_insert on app_records for insert to authenticated with check (owner_id = auth.uid() or teaches_student(owner_id));
drop policy if exists records_update on app_records;
create policy records_update on app_records for update to authenticated
  using (owner_id = auth.uid() or teaches_student(owner_id))
  with check (owner_id = auth.uid() or teaches_student(owner_id));
drop policy if exists records_delete on app_records;
create policy records_delete on app_records for delete to authenticated using (owner_id = auth.uid());

create or replace function touch_app_record() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists app_records_touch on app_records;
create trigger app_records_touch before update on app_records for each row execute function touch_app_record();

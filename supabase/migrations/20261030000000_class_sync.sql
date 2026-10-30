-- Đồng bộ lớp học giữa app và Supabase (giai đoạn 1: người dùng, lớp, ghi danh).
-- Chạy SAU 20261027000000_init.sql. Chạy lại nhiều lần không sao.

-- Bộ sách để lớp tham chiếu (classes.textbook_id).
insert into textbooks (id, name, publisher) values
  ('kntt', 'Kết nối tri thức với cuộc sống', 'NXB Giáo dục Việt Nam'),
  ('cd', 'Cánh Diều', 'NXB Đại học Sư phạm'),
  ('ctst', 'Chân trời sáng tạo', 'NXB Giáo dục Việt Nam')
on conflict (id) do nothing;

-- Lịch học của lớp: [{weekday, period, room}].
alter table classes add column if not exists schedule jsonb not null default '[]'::jsonb;

-- Quản trị viên xem được ghi danh (đếm sĩ số ở trang quản trị).
drop policy if exists enroll_admin_read on enrollments;
create policy enroll_admin_read on enrollments for select to authenticated using (current_role_is('admin'));

-- Học sinh trong cùng lớp thấy tên nhau (bảng xếp hạng, nhóm). Chỉ đọc hồ sơ, không đọc bài làm.
create or replace function shares_class(other uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments a join enrollments b on a.class_id = b.class_id where a.student_id = auth.uid() and b.student_id = other) $$;
drop policy if exists profiles_classmates_read on profiles;
create policy profiles_classmates_read on profiles for select to authenticated using (shares_class(id));

-- Đăng ký kèm mã lớp (raw_user_meta_data.invite_code): học sinh vào lớp ngay khi tài khoản được tạo.
create or replace function handle_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role app_role;
  v_class uuid;
begin
  if tg_op = 'INSERT' then
    v_role := role_for_email(new.email, new.email_confirmed_at);
    insert into profiles (id, full_name, email, school, role)
    values (new.id,
            coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
            new.email,
            nullif(trim(new.raw_user_meta_data->>'school'), ''),
            v_role);
    if v_role = 'student' and nullif(trim(new.raw_user_meta_data->>'invite_code'), '') is not null then
      select id into v_class from classes where invite_code = upper(trim(new.raw_user_meta_data->>'invite_code'));
      if v_class is not null then
        insert into enrollments (class_id, student_id) values (v_class, new.id) on conflict do nothing;
      end if;
    end if;
  else
    update profiles
       set email = new.email,
           role = case when role = 'admin' then role else role_for_email(new.email, new.email_confirmed_at) end
     where id = new.id;
  end if;
  return new;
end $$;
revoke execute on function handle_auth_user() from public;

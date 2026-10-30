-- Tài khoản thử nghiệm cho môi trường phát triển (KHÔNG chạy trên dự án thật đang có người dùng).
-- Chạy trong Supabase → SQL Editor, SAU khi đã chạy migrations/20261027000000_init.sql.
-- Tạo sẵn 3 tài khoản đã xác nhận email (giáo viên, học sinh, quản trị) + 1 lớp có học sinh.
-- Chạy lại nhiều lần không sao: tài khoản đã có thì bỏ qua.
-- Mật khẩu chung: EduNova@2026 — đổi ngay nếu dùng ngoài máy cá nhân.

do $$
declare
  acc record;
  uid uuid;
  t_id uuid;
  s_id uuid;
  c_id uuid;
begin
  for acc in
    select * from (values
      ('gv.test@edunova.test',    'Cô Giáo Thử',     'teacher'::app_role),
      ('hs.test@edunova.test',    'Học Sinh Thử',    'student'::app_role),
      ('admin.test@edunova.test', 'Quản Trị Thử',    'admin'::app_role)
    ) as t(email, full_name, role)
  loop
    select id into uid from auth.users where email = acc.email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', acc.email,
              extensions.crypt('EduNova@2026', extensions.gen_salt('bf')), now(),
              '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', acc.full_name),
              now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text,
              jsonb_build_object('sub', uid::text, 'email', acc.email, 'email_verified', true),
              'email', now(), now(), now());
    end if;
    -- trigger handle_auth_user đã tạo hồ sơ (mặc định học sinh); gán vai trò thử nghiệm
    update profiles set role = acc.role, full_name = acc.full_name, school = 'THPT Thử Nghiệm' where id = uid;
    if acc.role = 'teacher' then t_id := uid; elsif acc.role = 'student' then s_id := uid; end if;
  end loop;

  select id into c_id from classes where invite_code = 'TEST10A1';
  if c_id is null then
    insert into classes (name, grade, teacher_id, school_year, invite_code)
    values ('10A1 (thử)', 10, t_id, '2026-2027', 'TEST10A1') returning id into c_id;
  end if;
  insert into enrollments (class_id, student_id) values (c_id, s_id) on conflict do nothing;
end $$;

select p.email, p.role, p.full_name from profiles p where p.email like '%@edunova.test' order by p.role;

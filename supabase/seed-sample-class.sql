-- Lớp mẫu 30 học sinh cho giáo viên thử (gv.test@edunova.test) — chỉ dùng cho môi trường thử nghiệm.
-- Chạy trong Supabase → SQL Editor, SAU các migration và seed-test-accounts.sql. Chạy lại nhiều lần không sao.
-- Học sinh: hs01@edunova.test … hs30@edunova.test, mật khẩu chung EduNova@2026.

do $$
declare
  ho text[] := array['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Phan','Trịnh'];
  dem text[] := array['Văn','Thị','Minh','Gia','Ngọc','Thanh','Hữu','Khánh','Bảo','Anh'];
  ten text[] := array['An','Bình','Chi','Dũng','Giang','Hà','Hải','Hiếu','Hoa','Huy','Khang','Khoa','Lan','Linh','Long',
                      'Mai','Minh','My','Nam','Ngân','Nhi','Phúc','Quân','Sơn','Tâm','Thảo','Trang','Tú','Vy','Yến'];
  t_id uuid;
  c_id uuid;
  uid uuid;
  em text;
  nm text;
begin
  select id into t_id from profiles where email = 'gv.test@edunova.test';
  if t_id is null then raise exception 'Chưa có gv.test@edunova.test — chạy seed-test-accounts.sql trước'; end if;

  select id into c_id from classes where invite_code = 'MAU10A2';
  if c_id is null then
    insert into classes (name, grade, teacher_id, school_year, invite_code, textbook_id, schedule)
    values ('10A2 (mẫu)', 10, t_id, '2026-2027', 'MAU10A2', 'kntt',
            '[{"weekday":2,"period":"Tiết 3","room":"P. Tin 1"},{"weekday":5,"period":"Tiết 1","room":"P. Tin 1"}]'::jsonb)
    returning id into c_id;
  end if;

  for i in 1..30 loop
    em := 'hs' || lpad(i::text, 2, '0') || '@edunova.test';
    nm := ho[1 + (i * 7) % array_length(ho, 1)] || ' ' || dem[1 + (i * 3) % array_length(dem, 1)] || ' ' || ten[i];
    select id into uid from auth.users where email = em;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
              extensions.crypt('EduNova@2026', extensions.gen_salt('bf')), now(),
              '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', nm),
              now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
              'email', now(), now(), now());
    end if;
    update profiles set full_name = nm, school = 'THPT Thử Nghiệm' where id = uid;
    insert into enrollments (class_id, student_id) values (c_id, uid) on conflict do nothing;
  end loop;
end $$;

select c.name, c.invite_code, count(e.student_id) as so_hoc_sinh
  from classes c left join enrollments e on e.class_id = c.id
 where c.invite_code = 'MAU10A2' group by c.id;

-- Chọn vai trò sau lần đăng nhập đầu: tài khoản mới (email ngoài trường, không kèm mã lớp) tự xác nhận mình là
-- Giáo viên hay Học sinh, đúng MỘT lần. Sau đó chỉ quản trị viên đổi được (set_user_role).
-- Tự bỏ qua bước chọn: email trường đã xác nhận (giáo viên), đăng ký kèm mã lớp (học sinh), quản trị viên.
-- Chạy SAU 20261031000000_app_records.sql. Chạy lại nhiều lần không sao.

alter table profiles add column if not exists role_chosen boolean not null default false;

-- Tài khoản đã có: coi là đã chọn nếu không phải học sinh, hoặc đã vào lớp. Học sinh "mặc định" chưa vào lớp nào sẽ được hỏi.
update profiles p set role_chosen = true
 where not p.role_chosen
   and (p.role <> 'student' or exists (select 1 from enrollments e where e.student_id = p.id));

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
        update profiles set role_chosen = true where id = new.id;
      end if;
    end if;
  else
    -- Vai trò người dùng đã tự chọn (hoặc quản trị viên đặt) không bị email ghi đè.
    update profiles
       set email = new.email,
           role = case when role = 'admin' or role_chosen then role else role_for_email(new.email, new.email_confirmed_at) end
     where id = new.id;
  end if;
  return new;
end $$;
revoke execute on function handle_auth_user() from public;

-- Người dùng tự chọn vai trò lần đầu: chỉ Giáo viên hoặc Học sinh, chỉ khi chưa chọn và đang là học sinh mặc định.
create or replace function choose_role(p_role app_role) returns app_role language plpgsql security definer set search_path = public as $$
declare v_row profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập' using errcode = '42501'; end if;
  if p_role not in ('teacher', 'student') then raise exception 'Chỉ chọn được Giáo viên hoặc Học sinh' using errcode = '42501'; end if;
  select * into v_row from profiles where id = auth.uid() for update;
  if not found then raise exception 'Không tìm thấy hồ sơ' using errcode = 'P0002'; end if;
  if v_row.role_chosen or v_row.role <> 'student' then
    raise exception 'Vai trò đã được xác nhận; nhờ quản trị viên nếu cần đổi' using errcode = '42501';
  end if;
  update profiles set role = p_role, role_chosen = true where id = auth.uid();
  return p_role;
end $$;
revoke execute on function choose_role(app_role) from public, anon;
grant execute on function choose_role(app_role) to authenticated;

-- Quản trị viên đặt vai trò thì coi như đã chọn (email đổi sau đó không ghi đè).
create or replace function set_user_role(p_user uuid, p_role app_role) returns void language plpgsql security definer set search_path = public as $$
begin
  if not current_role_is('admin') then raise exception 'Chỉ quản trị viên được đổi vai trò' using errcode = '42501'; end if;
  update profiles set role = p_role, role_chosen = true where id = p_user;
end $$;

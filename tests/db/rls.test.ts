/**
 * Kiểm thử phân quyền thật trên PostgreSQL (PGlite): chạy migration Supabase với bản giả lập auth.users / auth.uid()
 * và các vai trò anon / authenticated như Supabase, rồi đóng vai từng người dùng để thử đọc/ghi.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const DIR = path.resolve(__dirname, "../../supabase/migrations");
/** Mọi migration theo thứ tự tên file (như `supabase db push`). */
const MIGRATIONS = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(path.join(DIR, f), "utf8"));

/** Phần Supabase có sẵn trước khi chạy migration: schema auth, vai trò, quyền mặc định của schema public. */
const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
grant usage on schema auth to anon, authenticated;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'
);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
`;

let db: PGlite;

/** Chạy với quyền hệ thống (như Supabase dashboard / service role). */
async function sys<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  return (await db.query<T>(sql, params)).rows;
}

/** Chạy như người dùng đã đăng nhập. */
async function as<T = Record<string, unknown>>(uid: string, sql: string, params: unknown[] = []) {
  await db.exec("reset role;");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
  await db.exec("set role authenticated;");
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role;");
  }
}

async function signUp(email: string, opts: { confirmed?: boolean; name?: string; inviteCode?: string } = {}) {
  const [u] = await sys<{ id: string }>(
    "insert into auth.users (email, email_confirmed_at, raw_user_meta_data) values ($1, $2, $3) returning id",
    [email, opts.confirmed === false ? null : new Date().toISOString(), JSON.stringify({ full_name: opts.name ?? email.split("@")[0], ...(opts.inviteCode ? { invite_code: opts.inviteCode } : {}) })],
  );
  return u.id;
}
const role = async (id: string) => (await sys<{ role: string }>("select role from profiles where id = $1", [id]))[0]?.role;

const ids = {} as Record<"admin" | "t1" | "t2" | "s1" | "s2" | "s3" | "c1" | "c2" | "asg" | "attempt" | "sub", string>;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const m of MIGRATIONS) await db.exec(m);

  await sys("insert into school_domains (domain, school_name) values ('thpt-a.edu.vn', 'THPT A')");
  ids.admin = await signUp("admin@gmail.com");
  await sys("update profiles set role = 'admin' where id = $1", [ids.admin]);
  ids.t1 = await signUp("ha@thpt-a.edu.vn", { name: "Cô Hà" });
  ids.t2 = await signUp("nam@thpt-a.edu.vn", { name: "Thầy Nam" });
  ids.s1 = await signUp("an@gmail.com", { name: "An" });
  ids.s2 = await signUp("binh@gmail.com", { name: "Bình" });
  ids.s3 = await signUp("chi@gmail.com", { name: "Chi" });

  await sys("insert into topics values ('F', 'F', 'Giải quyết vấn đề')");
  await sys("insert into objectives values ('O10-F-02', 10, 'F', 'chung', 'vận dụng', 'Viết câu lệnh if', false)");
  await sys("insert into lab_templates values ('lab-garden', 'smart-garden', 'Vườn tưới', '2d', 'available', 'REAL', '{}')");
});

describe("tài khoản và vai trò", () => {
  it("đăng ký thường là học sinh; email trường đã xác nhận là giáo viên", async () => {
    expect(await role(ids.s1)).toBe("student");
    expect(await role(ids.t1)).toBe("teacher");
  });

  it("email trường CHƯA xác nhận vẫn là học sinh, xác nhận xong mới thành giáo viên", async () => {
    const id = await signUp("moi@thpt-a.edu.vn", { confirmed: false });
    expect(await role(id)).toBe("student");
    await sys("update auth.users set email_confirmed_at = now() where id = $1", [id]);
    expect(await role(id)).toBe("teacher");
  });

  it("thêm tên miền trường thì tài khoản đã xác nhận thuộc tên miền đó thành giáo viên", async () => {
    const id = await signUp("lan@thpt-b.edu.vn");
    expect(await role(id)).toBe("student");
    await as(ids.admin, "insert into school_domains values ('thpt-b.edu.vn', 'THPT B')");
    expect(await role(id)).toBe("teacher");
  });

  it("đổi sang email ngoài trường thì mất quyền giáo viên; quản trị viên không bị hạ quyền", async () => {
    const id = await signUp("doi@thpt-a.edu.vn");
    await sys("update auth.users set email = 'doi@gmail.com' where id = $1", [id]);
    expect(await role(id)).toBe("student");
    await sys("update auth.users set email = 'admin2@gmail.com' where id = $1", [ids.admin]);
    expect(await role(ids.admin)).toBe("admin");
  });

  it("người dùng không tự nâng vai trò, chỉ sửa được tên", async () => {
    await expect(as(ids.s1, "update profiles set role = 'teacher' where id = auth.uid()")).rejects.toThrow(/permission denied/);
    await as(ids.s1, "update profiles set full_name = 'Nguyễn An' where id = auth.uid()");
    expect((await sys<{ full_name: string }>("select full_name from profiles where id = $1", [ids.s1]))[0].full_name).toBe("Nguyễn An");
    await expect(as(ids.s1, "insert into profiles (id, full_name, email, role) values (gen_random_uuid(), 'x', 'x@x.vn', 'admin')")).rejects.toThrow(/permission denied/);
  });

  it("chỉ quản trị viên đổi được vai trò người khác", async () => {
    await expect(as(ids.t1, "select set_user_role($1, 'admin')", [ids.t1])).rejects.toThrow(/quản trị viên/);
    const id = await signUp("tro-giang@gmail.com");
    await as(ids.admin, "select set_user_role($1, 'teacher')", [id]);
    expect(await role(id)).toBe("teacher");
  });

  it("học sinh không thấy hồ sơ người khác; không ai đọc được danh sách tên miền trừ quản trị viên", async () => {
    expect(await as(ids.s1, "select id from profiles")).toEqual([{ id: ids.s1 }]);
    expect(await as(ids.t1, "select * from school_domains")).toEqual([]);
    expect((await as(ids.admin, "select * from school_domains")).length).toBeGreaterThan(0);
  });
});

describe("lớp học", () => {
  it("học sinh không tạo được lớp; giáo viên tạo lớp của mình, không tạo hộ người khác", async () => {
    await expect(as(ids.s1, "insert into classes (name, grade, teacher_id, school_year, invite_code) values ('X', 10, $1, '2026', 'XXXXXX')", [ids.s1])).rejects.toThrow(/row-level security/);
    await expect(as(ids.t1, "insert into classes (name, grade, teacher_id, school_year, invite_code) values ('X', 10, $1, '2026', 'YYYYYY')", [ids.t2])).rejects.toThrow(/row-level security/);
    ids.c1 = (await as<{ id: string }>(ids.t1, "insert into classes (name, grade, teacher_id, school_year, invite_code) values ('10A1', 10, auth.uid(), '2026', 'TIN10A1') returning id"))[0].id;
    ids.c2 = (await as<{ id: string }>(ids.t2, "insert into classes (name, grade, teacher_id, school_year, invite_code) values ('10A2', 10, auth.uid(), '2026', 'TIN10A2') returning id"))[0].id;
  });

  it("học sinh vào lớp bằng mã mời; mã sai báo lỗi; giáo viên không dùng mã mời", async () => {
    await expect(as(ids.s1, "select join_class('SAIMA1')")).rejects.toThrow(/Mã lớp không đúng/);
    await as(ids.s1, "select join_class(' tin10a1 ')");
    await as(ids.s2, "select join_class('TIN10A1')");
    await as(ids.s3, "select join_class('TIN10A2')");
    await expect(as(ids.t2, "select join_class('TIN10A1')")).rejects.toThrow(/Chỉ học sinh/);
  });

  it("mỗi người chỉ thấy lớp của mình", async () => {
    expect(await as(ids.s1, "select name from classes")).toEqual([{ name: "10A1" }]);
    expect(await as(ids.t1, "select name from classes")).toEqual([{ name: "10A1" }]);
    expect(await as(ids.s1, "select student_id from enrollments")).toEqual([{ student_id: ids.s1 }]);
  });

  it("giáo viên thấy hồ sơ học sinh lớp mình, không thấy học sinh lớp khác", async () => {
    const seen = (await as<{ id: string }>(ids.t1, "select id from profiles where role = 'student'")).map((r) => r.id).sort();
    expect(seen).toEqual([ids.s1, ids.s2].sort());
    expect(await as(ids.s1, "select full_name from profiles where id = $1", [ids.t1])).toEqual([{ full_name: "Cô Hà" }]);
  });

  it("học sinh cùng lớp thấy tên nhau, không thấy học sinh lớp khác", async () => {
    const seen = (await as<{ id: string }>(ids.s1, "select id from profiles where role = 'student'")).map((r) => r.id).sort();
    expect(seen).toEqual([ids.s1, ids.s2].sort());
  });

  it("giáo viên lưu lịch học và bộ sách của lớp", async () => {
    await as(ids.t1, "update classes set schedule = $1, textbook_id = 'cd' where id = $2", [JSON.stringify([{ weekday: 1, period: "Tiết 2", room: "P. Tin 1" }]), ids.c1]);
    const [c] = await sys<{ schedule: { room: string }[]; textbook_id: string }>("select schedule, textbook_id from classes where id = $1", [ids.c1]);
    expect(c.schedule[0].room).toBe("P. Tin 1");
    expect(c.textbook_id).toBe("cd");
  });

  it("đăng ký kèm mã lớp thì vào lớp ngay; mã sai hoặc email giáo viên thì không", async () => {
    const a = await signUp("dung@gmail.com", { inviteCode: " tin10a1 " });
    const b = await signUp("em@gmail.com", { inviteCode: "SAIMA1" });
    const t = await signUp("gv@thpt-a.edu.vn", { inviteCode: "TIN10A1" });
    const n = async (id: string) => (await sys("select 1 from enrollments where student_id = $1", [id])).length;
    expect([await n(a), await n(b), await n(t)]).toEqual([1, 0, 0]);
  });

  it("quản trị viên xem được ghi danh của mọi lớp", async () => {
    const rows = await as<{ class_id: string }>(ids.admin, "select distinct class_id from enrollments");
    expect(rows.map((r) => r.class_id).sort()).toEqual([ids.c1, ids.c2].sort());
  });

  it("học sinh không tự thêm mình hay bạn vào lớp khác bằng cách ghi thẳng bảng", async () => {
    await expect(as(ids.s1, "insert into enrollments (class_id, student_id) values ($1, $2)", [ids.c2, ids.s1])).rejects.toThrow(/row-level security/);
  });
});

describe("nhiệm vụ, bài nộp, chấm điểm", () => {
  beforeAll(async () => {
    const [rb] = await as<{ id: string }>(ids.t1, "insert into rubrics (owner_id, title) values (auth.uid(), 'Rubric if') returning id");
    await as(ids.t1, "insert into rubric_criteria (rubric_id, title, objective_id, max_score, levels) values ($1, 'Điều kiện', 'O10-F-02', 4, '[]')", [rb.id]);
    const [act] = await as<{ id: string }>(ids.t1, "insert into teaching_activities (owner_id, objective_ids, format, title, instructions, rubric_id, questions, status) values (auth.uid(), '{O10-F-02}', 'lab', 'Vườn tưới', '...', $1, '[]', 'published') returning id", [rb.id]);
    ids.asg = (await as<{ id: string }>(ids.t1, "insert into assignments (owner_id, activity_id, class_id, title, due_at, hint_mode) values (auth.uid(), $1, $2, 'Vườn tưới', now() + interval '3 days', 'guided') returning id", [act.id, ids.c1]))[0].id;
    ids.attempt = (await as<{ id: string }>(ids.s1, "insert into lab_attempts (student_id, lab_template_id, assignment_id, status) values (auth.uid(), 'lab-garden', $1, 'in_progress') returning id", [ids.asg]))[0].id;
  });

  it("giáo viên lớp khác không giao bài vào lớp không phải của mình", async () => {
    const [rb] = await as<{ id: string }>(ids.t2, "insert into rubrics (owner_id, title) values (auth.uid(), 'R') returning id");
    const [act] = await as<{ id: string }>(ids.t2, "insert into teaching_activities (owner_id, objective_ids, format, title, instructions, rubric_id, questions, status) values (auth.uid(), '{}', 'lab', 'x', 'x', $1, '[]', 'published') returning id", [rb.id]);
    await expect(as(ids.t2, "insert into assignments (owner_id, activity_id, class_id, title, due_at, hint_mode) values (auth.uid(), $1, $2, 'x', now(), 'off')", [act.id, ids.c1])).rejects.toThrow(/row-level security/);
    await as(ids.t2, "insert into assignments (owner_id, activity_id, class_id, title, due_at, hint_mode) values (auth.uid(), $1, $2, 'x', now(), 'off')", [act.id, ids.c2]);
    await expect(as(ids.s1, "insert into teaching_activities (owner_id, objective_ids, format, title, instructions, rubric_id, questions, status) values (auth.uid(), '{}', 'lab', 'x', 'x', $1, '[]', 'published')", [rb.id])).rejects.toThrow(/row-level security/);
  });

  it("học sinh lớp khác không thấy nhiệm vụ và không nộp được", async () => {
    expect(await as(ids.s3, "select id from assignments where id = $1", [ids.asg])).toEqual([]);
    expect(await as(ids.s1, "select id from assignments")).toEqual([{ id: ids.asg }]);
    expect((await as(ids.s1, "select id from rubric_criteria")).length).toBe(1);
    expect(await as(ids.s3, "select id from rubric_criteria")).toEqual([]);
  });

  it("học sinh nộp bài của mình; bạn cùng lớp không xem được; giáo viên lớp xem được, giáo viên khác thì không", async () => {
    ids.sub = (await as<{ id: string }>(ids.s1, "insert into submissions (assignment_id, student_id, attempt_id, rule, answers, test_results) values ($1, auth.uid(), $2, 'if do_am < 40', '{}', '[]') returning id", [ids.asg, ids.attempt]))[0].id;
    await expect(as(ids.s2, "insert into submissions (assignment_id, student_id, attempt_id, rule, answers, test_results) values ($1, $2, $3, 'x', '{}', '[]')", [ids.asg, ids.s1, ids.attempt])).rejects.toThrow(/row-level security/);
    expect(await as(ids.s2, "select id from submissions")).toEqual([]);
    expect(await as(ids.t1, "select id from submissions")).toEqual([{ id: ids.sub }]);
    expect(await as(ids.t2, "select id from submissions")).toEqual([]);
  });

  it("giáo viên chấm bài: đổi trạng thái được, sửa nội dung bài thì bị chặn", async () => {
    await expect(as(ids.t1, "update submissions set rule = 'gian lận' where id = $1", [ids.sub])).rejects.toThrow(/không được sửa nội dung/);
    const [rb] = await as<{ id: string }>(ids.t1, "select id from rubrics where title = 'Rubric if'");
    await as(ids.t1, "insert into assessments (submission_id, teacher_id, rubric_id, scores, status) values ($1, auth.uid(), $2, '[]', 'draft')", [ids.sub, rb.id]);
    expect(await as(ids.s1, "select id from assessments")).toEqual([]);
    await as(ids.t1, "update assessments set status = 'final' where submission_id = $1", [ids.sub]);
    await as(ids.t1, "update submissions set status = 'graded' where id = $1", [ids.sub]);
    expect((await as(ids.s1, "select status from assessments"))[0]).toEqual({ status: "final" });
  });

  it("bài đã chấm hoặc nhiệm vụ đã đóng thì học sinh không sửa được", async () => {
    const updated = await as(ids.s1, "update submissions set rule = 'sửa sau khi chấm' where id = $1 returning id", [ids.sub]);
    expect(updated).toEqual([]);
    await as(ids.t1, "update assignments set status = 'closed' where id = $1", [ids.asg]);
    const [att] = await as<{ id: string }>(ids.s2, "insert into lab_attempts (student_id, lab_template_id, assignment_id, status) values (auth.uid(), 'lab-garden', $1, 'in_progress') returning id", [ids.asg]);
    await expect(as(ids.s2, "insert into submissions (assignment_id, student_id, attempt_id, rule, answers, test_results) values ($1, auth.uid(), $2, 'x', '{}', '[]')", [ids.asg, att.id])).rejects.toThrow(/row-level security/);
  });
});

describe("khóa học", () => {
  it("bản nháp chỉ giáo viên thấy; phát hành cho lớp thì học sinh lớp đó thấy, lớp khác không", async () => {
    const [c] = await as<{ id: string }>(ids.t1, "insert into courses (owner_id, title, grade, textbook_id) values (auth.uid(), 'Tin 10', 10, 'kntt') returning id");
    await as(ids.t1, "insert into course_classes values ($1, $2)", [c.id, ids.c1]);
    await expect(as(ids.t1, "insert into course_classes values ($1, $2)", [c.id, ids.c2])).rejects.toThrow(/row-level security/);
    expect(await as(ids.s1, "select id from courses")).toEqual([]);
    await as(ids.t1, "update courses set status = 'published' where id = $1", [c.id]);
    expect(await as(ids.s1, "select title from courses")).toEqual([{ title: "Tin 10" }]);
    expect(await as(ids.s3, "select title from courses")).toEqual([]);
    await expect(as(ids.s3, "insert into course_progress (student_id, course_id, lesson_ref, block_ref) values (auth.uid(), $1, 'l', 'b')", [c.id])).rejects.toThrow(/row-level security/);
    await as(ids.s1, "insert into course_progress (student_id, course_id, lesson_ref, block_ref) values (auth.uid(), $1, 'l', 'b')", [c.id]);
    expect((await as(ids.t1, "select student_id from course_progress"))[0]).toEqual({ student_id: ids.s1 });
    expect(await as(ids.s2, "select * from course_progress")).toEqual([]);
    await expect(as(ids.s1, "insert into courses (owner_id, title, grade, textbook_id) values (auth.uid(), 'x', 10, 'kntt')")).rejects.toThrow(/row-level security/);
  });
});

describe("AI Gia sư: giáo viên chỉ xem số liệu tổng hợp", () => {
  it("không đọc được sự kiện của từng học sinh; nhóm dưới 2 học sinh bị ẩn", async () => {
    await as(ids.s1, "insert into tutor_events (student_id, class_id, topic, kind, error_kind) values (auth.uid(), $1, 'if', 'check', 'boundary')", [ids.c1]);
    await as(ids.s2, "insert into tutor_events (student_id, class_id, topic, kind, error_kind) values (auth.uid(), $1, 'if', 'check', 'boundary')", [ids.c1]);
    await as(ids.s2, "insert into tutor_events (student_id, class_id, topic, kind, error_kind) values (auth.uid(), $1, 'if', 'hint', 'logic')", [ids.c1]);
    await expect(as(ids.s3, "insert into tutor_events (student_id, class_id, topic, kind) values (auth.uid(), $1, 'if', 'hint')", [ids.c1])).rejects.toThrow(/row-level security/);

    expect(await as(ids.t1, "select * from tutor_events")).toEqual([]);
    expect((await as(ids.s1, "select student_id from tutor_events")).every((r) => r.student_id === ids.s1)).toBe(true);
    const summary = await as<{ error_kind: string; students: number }>(ids.t1, "select error_kind, students::int from tutor_class_summary($1)", [ids.c1]);
    expect(summary).toEqual([{ error_kind: "boundary", students: 2 }]);
    expect(await as(ids.t2, "select * from tutor_class_summary($1)", [ids.c1])).toEqual([]);
  });
});

describe("chương trình và nhật ký", () => {
  it("ai đăng nhập cũng đọc được chương trình; chỉ quản trị viên sửa", async () => {
    expect((await as<{ id: string }>(ids.s1, "select id from textbooks order by id")).map((r) => r.id)).toEqual(["cd", "ctst", "kntt"]);
    await expect(as(ids.t1, "insert into topics values ('Z', 'Z', 'Z')")).rejects.toThrow(/row-level security/);
    await as(ids.admin, "insert into topics values ('Z', 'Z', 'Z')");
  });

  it("khách chưa đăng nhập (anon) không đọc được gì", async () => {
    await db.exec("reset role; set role anon;");
    try {
      expect((await db.query("select * from textbooks")).rows).toEqual([]);
      expect((await db.query("select * from profiles")).rows).toEqual([]);
    } finally {
      await db.exec("reset role;");
    }
  });

  it("lịch sử AI và nhật ký: người dùng chỉ thấy của mình, quản trị viên thấy hết", async () => {
    await sys("insert into ai_interactions (agent, user_id, output, prompt_version) values ('tutor', $1, '{}', 'v1'), ('tutor', $2, '{}', 'v1')", [ids.s1, ids.s2]);
    expect((await as(ids.s1, "select user_id from ai_interactions")).length).toBe(1);
    expect((await as(ids.admin, "select user_id from ai_interactions")).length).toBe(2);
    await expect(as(ids.s1, "insert into ai_interactions (agent, user_id, output, prompt_version) values ('x', auth.uid(), '{}', 'v')")).rejects.toThrow(/row-level security/);
    await sys("insert into audit_events (actor_id, action, entity, entity_id) values ($1, 'login', 'user', $2)", [ids.s1, ids.s1]);
    expect(await as(ids.s1, "select * from audit_events")).toEqual([]);
  });
});

describe("dữ liệu app đồng bộ (app_records)", () => {
  const put = (uid: string, kind: string, id: string, owner: string, shared = false, classIds: string[] = []) =>
    as(uid, "insert into app_records (kind, id, owner_id, shared, class_ids, data) values ($1, $2, $3, $4, $5, '{}')", [kind, id, owner, shared, classIds]);
  const ids_ = async (uid: string, kind: string) => (await as<{ id: string }>(uid, "select id from app_records where kind = $1 order by id", [kind])).map((r) => r.id);

  it("bài giao chia sẻ cho lớp: học sinh lớp đó thấy, lớp khác không; không ai ghi hộ giáo viên", async () => {
    await put(ids.t1, "assignments", "a1", ids.t1, true, [ids.c1]);
    await put(ids.t1, "assignments", "nhap", ids.t1, false);
    expect(await ids_(ids.s1, "assignments")).toEqual(["a1"]);
    expect(await ids_(ids.s3, "assignments")).toEqual([]);
    expect(await ids_(ids.t2, "assignments")).toEqual([]);
    await expect(put(ids.s1, "assignments", "gia", ids.t1, true)).rejects.toThrow(/row-level security/);
  });

  it("bài làm của học sinh: bạn cùng lớp không xem được; giáo viên lớp mình xem và chấm được, giáo viên khác thì không", async () => {
    await put(ids.s1, "labResults", "r1", ids.s1);
    expect(await ids_(ids.s2, "labResults")).toEqual([]);
    expect(await ids_(ids.t1, "labResults")).toEqual(["r1"]);
    expect(await ids_(ids.t2, "labResults")).toEqual([]);
    await as(ids.t1, "update app_records set data = '{\"review\":{\"score\":9}}' where kind = 'labResults' and id = 'r1'");
    expect((await sys<{ data: { review: { score: number } } }>("select data from app_records where id = 'r1'"))[0].data.review.score).toBe(9);
    expect((await as(ids.t2, "update app_records set data = '{}' where kind = 'labResults' and id = 'r1' returning id")).length).toBe(0);
    await expect(put(ids.t2, "assessments", "x1", ids.s1)).rejects.toThrow(/row-level security/);
    await put(ids.t1, "assessments", "x1", ids.s1);
    expect(await ids_(ids.s1, "assessments")).toEqual(["x1"]);
  });

  it("chỉ chủ bản ghi xóa được; quản trị viên đọc được tất cả", async () => {
    expect((await as(ids.t1, "delete from app_records where kind = 'labResults' and id = 'r1' returning id")).length).toBe(0);
    expect((await as(ids.s1, "delete from app_records where kind = 'labResults' and id = 'r1' returning id")).length).toBe(1);
    expect((await as(ids.admin, "select id from app_records")).length).toBeGreaterThan(0);
  });
});

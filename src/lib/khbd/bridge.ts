/**
 * Cầu nối EduNova ↔ trợ lý soạn KHBD (khbd/): gợi ý mô phỏng theo yêu cầu cần đạt của bài, gắn vào hoạt động,
 * và chuyển bản soạn cuối thành KHBD của EduNova (mỗi hoạt động một PlanActivity, kèm mô phỏng đã gắn).
 */
import type { HocLieuGan, HoatDongBan } from "@khbd/lib/pipeline/6-xuat-file/hoc-lieu";
import type { TomTatHoatDong } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import type { LabTemplate, Lesson, LessonPhase, PlanActivity } from "@/lib/domain/types";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { getLessonContent } from "@/lib/data/lesson-content";
import { uid } from "@/lib/utils";

export interface SimSuggestion {
  lab: LabTemplate;
  /** Yêu cầu cần đạt trùng với bài */
  matched: string[];
  /** Hoạt động đề xuất gắn vào */
  hd: string | null;
  task: string;
  reason: string;
}

const VAN_DUNG = /vận dụng|ứng dụng|thực tế|thực hành/i;

/** Hoạt động vận dụng của bản soạn: HĐ III (khung mới) hoặc hoạt động GV đặt tên "Vận dụng"; không có thì hoạt động cuối. */
export function applyActivity(activities: (HoatDongBan & { loai?: string })[]): string | null {
  if (!activities.length) return null;
  return (
    activities.find((a) => a.hd === "HD3")?.hd ??
    activities.find((a) => a.loai === "van_dung")?.hd ??
    activities.find((a) => VAN_DUNG.test(a.ten))?.hd ??
    activities[activities.length - 1].hd
  );
}

/** Mô phỏng có yêu cầu cần đạt trùng với bài; mô phỏng dùng được xếp trước, trùng nhiều xếp trước. */
export function suggestSimulations(lesson: Lesson | undefined, activities: (HoatDongBan & { loai?: string })[]): SimSuggestion[] {
  if (!lesson) return [];
  const content = getLessonContent(lesson.key);
  const hd = applyActivity(activities);
  // Tên hoạt động không kèm thời lượng "(35 phút – tiết 2)"
  const hdName = (activities.find((a) => a.hd === hd)?.ten ?? "hoạt động vận dụng").replace(/\s*\([^)]*\)\s*$/, "");
  return LAB_TEMPLATES.map((lab) => ({ lab, matched: lab.objectiveIds.filter((o) => lesson.objectiveIds.includes(o)) }))
    .filter((x) => x.matched.length > 0)
    .sort((a, b) => Number(a.lab.status === "planned") - Number(b.lab.status === "planned") || b.matched.length - a.matched.length)
    .map(({ lab, matched }) => ({
      lab,
      matched,
      hd,
      task: lab.slug === content?.labSlug && content.labTask ? content.labTask : lab.sampleTasks.join(" "),
      reason: `Cùng yêu cầu cần đạt ${matched.join(", ")}. Đề xuất dùng ở "${hdName}": học sinh thao tác, thử nghiệm và kiểm tra kết quả trên tình huống.`,
    }));
}

export function simToResource(s: Pick<SimSuggestion, "lab" | "task">, hd: string): HocLieuGan {
  return { hd, loai: "mo_phong", ten: `Mô phỏng "${s.lab.title}" trên EduNova`, nhiemVu: s.task };
}

const PHASE_BY_TYPE: Record<string, LessonPhase> = { khoi_dong: "mo-dau", hinh_thanh: "hinh-thanh", luyen_tap: "luyen-tap", van_dung: "van-dung", cung_co: "luyen-tap" };
const PHASE_BY_HD: Record<string, LessonPhase> = { GD1: "hinh-thanh", HD1: "mo-dau", HD2: "luyen-tap", HD3: "van-dung", HD4: "van-dung", GD3: "van-dung" };

function phaseOf(a: TomTatHoatDong, index: number, total: number): LessonPhase {
  return PHASE_BY_HD[a.hd] ?? (a.loai && PHASE_BY_TYPE[a.loai]) ?? (index === 0 ? "mo-dau" : index === total - 1 ? "van-dung" : "hinh-thanh");
}

/** Bản soạn → các hoạt động của KHBD EduNova; dòng được xếp vào mục theo vai trò của dòng trong bản soạn. */
export function toPlanActivities(summary: TomTatHoatDong[], resources: HocLieuGan[], objectiveIds: string[]): PlanActivity[] {
  return summary.map((a, i) => {
    const pick = (...vai: (string | undefined)[]) => a.dong.filter((d) => vai.includes(d.vai)).map((d) => d.chu).join("\n");
    const organization = pick("to_chuc", "cach_to_chuc", "buoc", "buoc_viec", "nhiem_vu_so", "tinh_huong", "cau_hoi_mo_dau");
    const product = pick("san_pham");
    const evidence = pick("tieu_chi", "danh_gia");
    const goal = pick("muc_tieu");
    const rest = a.dong.filter((d) => !d.vai || ["nhan_dinh", "nhan_dinh_dau", "tieu_de"].includes(d.vai)).map((d) => d.chu).join("\n");
    const sim = resources.find((r) => r.hd === a.hd && r.loai === "mo_phong");
    const labId = sim ? LAB_TEMPLATES.find((l) => sim.ten.includes(`"${l.title}"`))?.id : undefined;
    return {
      id: uid("pa"),
      phase: phaseOf(a, i, summary.length),
      title: a.ten,
      objectiveIds,
      content: [goal && `Mục tiêu: ${goal}`, rest].filter(Boolean).join("\n") || a.dong.map((d) => d.chu).join("\n"),
      organization: organization || (rest ? "" : a.dong.map((d) => d.chu).join("\n")),
      product,
      evidence,
      ...(labId ? { labTemplateId: labId } : {}),
    };
  });
}

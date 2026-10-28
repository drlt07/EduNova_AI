import {
  BookMarked,
  BarChart3,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  Dumbbell,
  FlaskConical,
  Library,
  Trophy,
  Gamepad2,
  GraduationCap,
  Home,
  NotebookPen,
  Shield,
  Users,
} from "lucide-react";
import type { Role } from "@/lib/domain/types";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Đường dẫn trang con cũng tính là đang ở mục này */
  match?: string[];
  /** Nhóm trong thanh bên; mục không có nhóm thuộc nhóm đầu */
  group?: string;
  /** Số đếm trực tiếp cạnh nhãn */
  badge?: "classes" | "todos";
}

export const NAV: Record<Role, NavItem[]> = {
  // Các chức năng chính của giáo viên (gồm thư viện tình huống mô phỏng), rồi kho dùng chung (học liệu, thiết lập mô phỏng, chuyên đề HSG).
  teacher: [
    { href: "/teacher/dashboard", label: "Hôm nay", icon: Home },
    { href: "/teacher/classes", label: "Lớp học của tôi", icon: Users, badge: "classes" },
    { href: "/teacher/sgk", label: "Khóa học", icon: BookMarked, match: ["/teacher/courses", "/curriculum", "/explore", "/bai-hoc"] },
    { href: "/teacher/assignments", label: "Bài tập & Đánh giá", icon: ClipboardCheck, badge: "todos", match: ["/teacher/assessment", "/teacher/activity-builder"] },
    { href: "/teacher/analytics", label: "Kết quả học tập", icon: BarChart3 },
    { href: "/teacher/lesson-planner", label: "Trợ lý KHBD AI", icon: NotebookPen },
    { href: "/labs", label: "Tình huống mô phỏng", icon: Gamepad2, match: ["/student/games"] },
    { href: "/teacher/library", label: "Thư viện học liệu", icon: Library, group: "Kho dùng chung", match: ["/teacher/resources"] },
    { href: "/teacher/labs", label: "Thiết lập mô phỏng", icon: FlaskConical, group: "Kho dùng chung" },
    { href: "/thuat-toan", label: "Chuyên đề HSG", icon: Trophy, group: "Kho dùng chung" },
  ],
  // 5 chức năng của học sinh (Trang chủ = trang giới thiệu chung); trang con (match) vẫn đánh dấu đúng mục cha. Kết quả học tập nằm ở Trang cá nhân.
  student: [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/student/courses", label: "Khóa học của tôi", icon: BookMarked, match: ["/student/sgk", "/student/missions", "/student/learning", "/student/dashboard", "/curriculum", "/explore", "/bai-hoc"] },
    { href: "/student/games", label: "Tình huống mô phỏng", icon: Gamepad2, match: ["/labs", "/thuat-toan"] },
    { href: "/student/practice", label: "Luyện tập", icon: Dumbbell, match: ["/student/code", "/student/projects"] },
    { href: "/student/tutor", label: "AI Gia sư", icon: Bot },
  ],
  admin: [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/admin", label: "Quản trị", icon: Shield },
    { href: "/curriculum", label: "Chương trình", icon: BookOpenCheck },
    { href: "/labs", label: "Thư viện thí nghiệm", icon: GraduationCap },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { teacher: "Giáo viên", student: "Học sinh", admin: "Quản trị viên" };
/** Trang vào sau khi đăng nhập (Trang chủ chung là trang giới thiệu "/"). */
export { ROLE_HOME } from "@/lib/auth/paths";

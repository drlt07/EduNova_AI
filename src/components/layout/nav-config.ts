import {
  BookMarked,
  BarChart3,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  Dumbbell,
  FlaskConical,
  Library,
  Home,
  NotebookPen,
  Shield,
  Sparkles,
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
  // Giáo viên: 5 mục chính + Mô phỏng đời sống (kho công khai, mở tự do). Bài học là trung tâm (giao hoạt động ngay trong bài); các trang cũ được gom vào mục hợp lý qua `match`.
  teacher: [
    { href: "/teacher/dashboard", label: "Hôm nay", icon: Home },
    { href: "/teacher/sgk", label: "Khóa học", icon: BookMarked, match: ["/teacher/courses", "/curriculum", "/explore", "/bai-hoc"] },
    { href: "/teacher/classes", label: "Lớp của tôi", icon: Users, badge: "todos", match: ["/teacher/assignments", "/teacher/assessment", "/teacher/results", "/teacher/analytics"] },
    { href: "/teacher/lesson-planner", label: "Trợ lý KHBD AI", icon: NotebookPen },
    { href: "/teacher/sims", label: "Thư viện", icon: Library, match: ["/teacher/bank", "/teacher/library", "/teacher/resources", "/teacher/labs", "/teacher/activity-builder", "/labs", "/thuat-toan"] },
    { href: "/teacher/kho", label: "Mô phỏng đời sống", icon: Sparkles },
  ],
  // Học sinh: bài được giao trước, rồi bài học, luyện tập, mô phỏng, tiến độ và AI Gia sư.
  student: [
    { href: "/student/missions", label: "Bài của tôi", icon: ClipboardCheck, match: ["/student/dashboard"] },
    { href: "/student/sgk", label: "Khóa học", icon: BookMarked, match: ["/student/courses", "/student/learning", "/curriculum", "/explore", "/bai-hoc"] },
    { href: "/student/practice", label: "Luyện tập", icon: Dumbbell, match: ["/student/code", "/student/projects"] },
    { href: "/student/games", label: "Mô phỏng", icon: FlaskConical, match: ["/labs", "/thuat-toan"] },
    { href: "/student/kho", label: "Mô phỏng đời sống", icon: Sparkles },
    { href: "/student/progress", label: "Tiến độ", icon: BarChart3, match: ["/student/profile", "/student/portfolio"] },
    { href: "/student/tutor", label: "AI Gia sư", icon: Bot },
  ],
  admin: [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/admin", label: "Quản trị", icon: Shield },
    { href: "/curriculum", label: "Chương trình", icon: BookOpenCheck },
    { href: "/admin/sims", label: "Mô phỏng theo bài", icon: FlaskConical },
    { href: "/admin/kho", label: "Mô phỏng đời sống", icon: Sparkles, match: ["/kho"] },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { teacher: "Giáo viên", student: "Học sinh", admin: "Quản trị viên" };
/** Trang vào sau khi đăng nhập (Trang chủ chung là trang giới thiệu "/"). */
export { ROLE_HOME } from "@/lib/auth/paths";

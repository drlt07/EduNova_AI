import {
  Bell,
  BookMarked,
  LayoutDashboard,
  UserCog,
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
  badge?: "classes" | "todos" | "pending" | "notifs";
}

export const NAV: Record<Role, NavItem[]> = {
  // Giáo viên: 6 mục "Quản lý giảng dạy" + 2 mục cá nhân. Trang cũ thuộc mục hợp lý qua `match` (không mất chức năng).
  teacher: [
    { href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/teacher/sgk", label: "Bài học", icon: BookMarked, match: ["/teacher/courses", "/curriculum", "/explore", "/bai-hoc"] },
    { href: "/teacher/classes", label: "Lớp của tôi", icon: Users, match: ["/teacher/results"] },
    { href: "/teacher/assignments", label: "Bài tập & Kiểm tra", icon: ClipboardCheck, badge: "pending", match: ["/teacher/assessment", "/teacher/bank", "/teacher/activity-builder", "/teacher/analytics"] },
    { href: "/teacher/sims", label: "Thư viện", icon: Library, match: ["/teacher/kho", "/teacher/library", "/teacher/resources", "/teacher/labs", "/teacher/saved", "/labs", "/thuat-toan"] },
    { href: "/teacher/lesson-planner", label: "Trợ lý KHBD AI", icon: NotebookPen },
    { href: "/teacher/notifications", label: "Thông báo", icon: Bell, group: "Cá nhân", badge: "notifs" },
    { href: "/teacher/settings", label: "Hồ sơ & Cài đặt", icon: UserCog, group: "Cá nhân" },
  ],
  // Học sinh: bài được giao trước, rồi bài học, luyện tập, mô phỏng, tiến độ và AI Gia sư.
  student: [
    { href: "/student/missions", label: "Bài của tôi", icon: ClipboardCheck, match: ["/student/dashboard"] },
    { href: "/student/sgk", label: "Khóa học", icon: BookMarked, match: ["/student/courses", "/student/learning", "/curriculum", "/explore", "/bai-hoc"] },
    { href: "/student/practice", label: "Luyện tập", icon: Dumbbell, match: ["/student/code", "/student/projects"] },
    { href: "/student/games", label: "Mô phỏng", icon: FlaskConical, match: ["/labs"] },
    { href: "/student/kho", label: "Mô phỏng đời sống", icon: Sparkles, match: ["/thuat-toan"] },
    { href: "/student/progress", label: "Tiến độ", icon: BarChart3, match: ["/student/profile", "/student/portfolio"] },
    { href: "/student/tutor", label: "AI Gia sư", icon: Bot },
  ],
  admin: [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/admin", label: "Quản trị", icon: Shield },
    { href: "/curriculum", label: "Chương trình", icon: BookOpenCheck },
    { href: "/admin/sims", label: "Mô phỏng theo bài", icon: FlaskConical },
    { href: "/admin/kho", label: "Mô phỏng đời sống", icon: Sparkles, match: ["/kho", "/thuat-toan"] },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { teacher: "Giáo viên", student: "Học sinh", admin: "Quản trị viên" };
/** Trang vào sau khi đăng nhập (Trang chủ chung là trang giới thiệu "/"). */
export { ROLE_HOME } from "@/lib/auth/paths";

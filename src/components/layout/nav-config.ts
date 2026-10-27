import {
  BookMarked,
  BarChart3,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  FlaskConical,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Home,
  LayoutDashboard,
  Library,
  ListChecks,
  NotebookPen,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import type { Role } from "@/lib/domain/types";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Đường dẫn trang con cũng tính là đang ở mục này */
  match?: string[];
}

export const NAV: Record<Role, NavItem[]> = {
  teacher: [
    { href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/teacher/courses", label: "Khóa học & bài giảng", icon: BookMarked },
    { href: "/teacher/lesson-planner", label: "Kế hoạch bài dạy", icon: NotebookPen },
    { href: "/teacher/activity-builder", label: "Thiết kế hoạt động", icon: Wand2 },
    { href: "/teacher/labs", label: "Phòng thí nghiệm ảo", icon: FlaskConical },
    { href: "/teacher/resources", label: "Học liệu", icon: Sparkles },
    { href: "/teacher/classes", label: "Lớp học", icon: Users },
    { href: "/teacher/assignments", label: "Giao nhiệm vụ", icon: ListChecks },
    { href: "/teacher/assessment", label: "Chấm bài", icon: ClipboardCheck },
    { href: "/teacher/analytics", label: "Thống kê học tập", icon: BarChart3 },
    { href: "/teacher/library", label: "Thư viện chia sẻ", icon: Library },
    { href: "/teacher/settings", label: "Cài đặt", icon: Settings },
  ],
  // 5 chức năng của học sinh; trang con (match) vẫn đánh dấu đúng mục cha. Kết quả học tập nằm ở Trang cá nhân.
  student: [
    { href: "/student/dashboard", label: "Trang chủ", icon: Home },
    { href: "/student/courses", label: "Khóa học của tôi", icon: BookMarked, match: ["/student/missions", "/student/learning"] },
    { href: "/student/games", label: "Tình huống mô phỏng", icon: Gamepad2 },
    { href: "/student/practice", label: "Luyện tập", icon: Dumbbell, match: ["/student/code", "/student/projects"] },
    { href: "/student/tutor", label: "AI Gia sư", icon: Bot },
  ],
  admin: [
    { href: "/admin", label: "Quản trị", icon: Shield },
    { href: "/curriculum", label: "Chương trình", icon: BookOpenCheck },
    { href: "/labs", label: "Thư viện thí nghiệm", icon: GraduationCap },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { teacher: "Giáo viên", student: "Học sinh", admin: "Quản trị viên" };
export const ROLE_HOME: Record<Role, string> = { teacher: "/teacher/dashboard", student: "/student/dashboard", admin: "/admin" };

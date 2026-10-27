import {
  Award,
  BookMarked,
  BarChart3,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  Code2,
  Compass,
  FlaskConical,
  FolderKanban,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  Map,
  NotebookPen,
  Settings,
  Shield,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import type { Role } from "@/lib/domain/types";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
  student: [
    { href: "/student/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/student/courses", label: "Khóa học", icon: BookMarked },
    { href: "/student/learning", label: "Bài học", icon: Compass },
    { href: "/student/games", label: "Trò chơi mô phỏng", icon: Gamepad2 },
    { href: "/student/code", label: "Phòng lập trình", icon: Code2 },
    { href: "/student/tutor", label: "Gia sư AI", icon: Bot },
    { href: "/student/practice", label: "Luyện tập & kiểm tra", icon: Dumbbell },
    { href: "/student/projects", label: "Xưởng dự án", icon: FolderKanban },
    { href: "/student/missions", label: "Nhiệm vụ của tôi", icon: Target },
    { href: "/student/progress", label: "Tiến độ học tập", icon: Map },
    { href: "/student/portfolio", label: "Thành tích & hồ sơ", icon: Award },
    { href: "/student/settings", label: "Cài đặt", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Quản trị", icon: Shield },
    { href: "/curriculum", label: "Chương trình", icon: BookOpenCheck },
    { href: "/labs", label: "Thư viện thí nghiệm", icon: GraduationCap },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { teacher: "Giáo viên", student: "Học sinh", admin: "Quản trị viên" };
export const ROLE_HOME: Record<Role, string> = { teacher: "/teacher/dashboard", student: "/student/dashboard", admin: "/admin" };

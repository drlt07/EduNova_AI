import {
  BookMarked,
  BarChart3,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Home,
  LayoutDashboard,
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
}

export const NAV: Record<Role, NavItem[]> = {
  // Trang chủ chung + 6 chức năng của giáo viên. Kho mô phỏng, học liệu, ngân hàng câu hỏi là tài nguyên dùng chung,
  // mở từ Khóa học hoặc Bài tập & Đánh giá (match) chứ không phải mục menu riêng.
  teacher: [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/teacher/classes", label: "Lớp học của tôi", icon: Users },
    { href: "/teacher/courses", label: "Khóa học", icon: BookMarked, match: ["/teacher/labs", "/teacher/library", "/labs", "/curriculum", "/explore", "/bai-hoc", "/thuat-toan"] },
    { href: "/teacher/assignments", label: "Bài tập & Đánh giá", icon: ClipboardCheck, match: ["/teacher/assessment", "/teacher/activity-builder", "/teacher/resources"] },
    { href: "/teacher/analytics", label: "Kết quả học tập", icon: BarChart3 },
    { href: "/teacher/lesson-planner", label: "Trợ lý KHBD AI", icon: NotebookPen },
  ],
  // 5 chức năng của học sinh (Trang chủ = trang giới thiệu chung); trang con (match) vẫn đánh dấu đúng mục cha. Kết quả học tập nằm ở Trang cá nhân.
  student: [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/student/courses", label: "Khóa học của tôi", icon: BookMarked, match: ["/student/missions", "/student/learning", "/student/dashboard", "/curriculum", "/explore", "/bai-hoc"] },
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

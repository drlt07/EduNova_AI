import { StrictMode, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { Providers } from "@/components/layout/providers";
import { AppShell } from "@/components/layout/app-shell";
import { PublicFrame } from "@/components/layout/public-frame";
import { ParamsContext } from "./shims/navigation";
import { getLoc, subscribe } from "./shims/router-store";

import Home from "@/app/(public)/page";
import Explore from "@/app/(public)/explore/page";
import Curriculum from "@/app/(public)/curriculum/page";
import Labs from "@/app/(public)/labs/page";
import LabDetailPage from "@/app/(public)/labs/[slug]/page";
import KhoSim from "@/app/(public)/kho/[slug]/page";
import Hsg from "@/app/(public)/thuat-toan/page";
import TSgk from "@/app/teacher/sgk/page";
import TClass from "@/app/teacher/classes/[id]/page";
import SSgk from "@/app/student/sgk/page";
import { BookReader } from "@/components/sgk/reader";
import { AlgoPage } from "@/components/algo/algo-page";
import About from "@/app/(public)/about/page";
import Guide from "@/app/(public)/huong-dan/page";
import Policy from "@/app/(public)/chinh-sach/page";
import Login from "@/app/(public)/login/page";
import Register from "@/app/(public)/register/page";
import NotFound from "@/app/not-found";
import LessonPage from "@/app/(public)/bai-hoc/[id]/page";
import SLesson from "@/app/student/learning/[id]/page";

import TDashboard from "@/app/teacher/dashboard/page";
import TCourses from "@/app/teacher/courses/page";
import TCourse from "@/app/teacher/courses/[id]/page";
import TPlanner from "@/app/teacher/lesson-planner/page";
import TPlanEditor from "@/app/teacher/lesson-planner/[id]/page";
import TPlanAssistant from "@/app/teacher/lesson-planner/assistant/page";
import TBuilder from "@/app/teacher/activity-builder/page";
import TLabs from "@/app/teacher/labs/page";
import TResources from "@/app/teacher/resources/page";
import TClasses from "@/app/teacher/classes/page";
import TAssignments from "@/app/teacher/assignments/page";
import TAssessment from "@/app/teacher/assessment/page";
import TAnalytics from "@/app/teacher/analytics/page";
import TSims from "@/app/teacher/sims/page";
import TBank from "@/app/teacher/bank/page";
import TResults from "@/app/teacher/results/page";
import ASims from "@/app/admin/sims/page";
import TLibrary from "@/app/teacher/library/page";
import TSettings from "@/app/teacher/settings/page";

import SDashboard from "@/app/student/dashboard/page";
import SCourses from "@/app/student/courses/page";
import SCourse from "@/app/student/courses/[id]/page";
import SLearning from "@/app/student/learning/page";
import SCode from "@/app/student/code/page";
import SMissions from "@/app/student/missions/page";
import SMission from "@/app/student/missions/[id]/page";
import SGames from "@/app/student/games/page";
import SGame from "@/app/student/games/[slug]/page";
import STutor from "@/app/student/tutor/page";
import SPractice from "@/app/student/practice/page";
import SPracticeRun from "@/app/student/practice/[id]/page";
import SProjects from "@/app/student/projects/page";
import SProject from "@/app/student/projects/[id]/page";
import SProgress from "@/app/student/progress/page";
import SPortfolio from "@/app/student/portfolio/page";
import SSettings from "@/app/student/settings/page";
import SProfile from "@/app/student/profile/page";
import Admin from "@/app/admin/page";

/** Trang bài học cũng là async server component trong Next. */
function AsyncPage({ page, params }: { page: unknown; params: Record<string, string> }) {
  const [el, setEl] = useState<ReactNode>(null);
  const key = JSON.stringify(params);
  useEffect(() => {
    let alive = true;
    (page as (p: { params: Promise<Record<string, string>> }) => Promise<ReactNode>)({ params: Promise.resolve(JSON.parse(key)) })
      .then((x) => alive && setEl(x))
      .catch(() => alive && setEl(<NotFound />));
    return () => {
      alive = false;
    };
  }, [page, key]);
  return el;
}

/** Trang chi tiết lab là async server component trong Next — ở đây chạy nó phía client. */
function LabDetail({ slug }: { slug: string }) {
  const [el, setEl] = useState<ReactNode>(null);
  useEffect(() => {
    let alive = true;
    (LabDetailPage as unknown as (p: { params: Promise<{ slug: string }> }) => Promise<ReactNode>)({ params: Promise.resolve({ slug }) })
      .then((x) => alive && setEl(x))
      .catch(() => alive && setEl(<NotFound />));
    return () => {
      alive = false;
    };
  }, [slug]);
  return el;
}

type Route = { re: RegExp; keys: string[]; area: "public" | "teacher" | "student" | "admin"; render: (p: Record<string, string>) => ReactNode };
const r = (pattern: string, area: Route["area"], render: Route["render"]): Route => {
  const keys: string[] = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
  return { re, keys, area, render };
};
const C = (X: () => ReactNode) => function Page() {
  return <X />;
};

const ROUTES: Route[] = [
  r("/", "public", C(Home)),
  r("/explore", "public", C(Explore)),
  r("/curriculum", "public", C(Curriculum)),
  r("/labs", "public", C(Labs)),
  r("/labs/:slug", "public", (p) => <LabDetail slug={p.slug} />),
  r("/kho", "public", C(Labs)),
  r("/kho/:slug", "public", C(KhoSim)),
  r("/thuat-toan", "public", C(Hsg)),
  r("/thuat-toan/:id", "public", (p) => <AlgoPage key={p.id} id={p.id} />),
  r("/bai-hoc/:id", "public", (p) => <AsyncPage page={LessonPage} params={p} />),
  r("/about", "public", C(About)),
  r("/huong-dan", "public", C(Guide)),
  r("/chinh-sach", "public", C(Policy)),
  r("/login", "public", C(Login)),
  r("/register", "public", C(Register)),
  r("/teacher(?:/dashboard)?", "teacher", C(TDashboard)),
  r("/teacher/sgk", "teacher", C(TSgk)),
  r("/teacher/sgk/:ref", "teacher", (p) => <BookReader key={p.ref} refId={p.ref} role="teacher" />),
  r("/teacher/courses", "teacher", C(TCourses)),
  r("/teacher/courses/:id", "teacher", (p) => <TCourse key={p.id} />),
  r("/teacher/lesson-planner", "teacher", C(TPlanner)),
  r("/teacher/lesson-planner/assistant", "teacher", C(TPlanAssistant)),
  r("/teacher/lesson-planner/:id", "teacher", (p) => <TPlanEditor key={p.id} />),
  r("/teacher/activity-builder", "teacher", C(TBuilder)),
  r("/teacher/labs", "teacher", C(TLabs)),
  r("/teacher/resources", "teacher", C(TResources)),
  r("/teacher/classes", "teacher", C(TClasses)),
  r("/teacher/classes/:id", "teacher", (p) => <TClass key={p.id} />),
  r("/teacher/assignments", "teacher", C(TAssignments)),
  r("/teacher/assessment", "teacher", C(TAssessment)),
  r("/teacher/analytics", "teacher", C(TAnalytics)),
  r("/teacher/sims", "teacher", C(TSims)),
  r("/teacher/bank", "teacher", C(TBank)),
  r("/teacher/results", "teacher", C(TResults)),
  r("/teacher/library", "teacher", C(TLibrary)),
  r("/teacher/settings", "teacher", C(TSettings)),
  r("/student(?:/dashboard)?", "student", C(SDashboard)),
  r("/student/sgk", "student", C(SSgk)),
  r("/student/sgk/:ref", "student", (p) => <BookReader key={p.ref} refId={p.ref} role="student" />),
  r("/student/courses", "student", C(SCourses)),
  r("/student/courses/:id", "student", (p) => <SCourse key={p.id} />),
  r("/student/learning", "student", C(SLearning)),
  r("/student/learning/:id", "student", (p) => <SLesson key={p.id} />),
  r("/student/games", "student", C(SGames)),
  r("/student/games/:slug", "student", (p) => <SGame key={p.slug} />),
  r("/student/tutor", "student", C(STutor)),
  r("/student/practice", "student", C(SPractice)),
  r("/student/practice/:id", "student", (p) => <SPracticeRun key={p.id} />),
  r("/student/projects", "student", C(SProjects)),
  r("/student/projects/:id", "student", (p) => <SProject key={p.id} />),
  r("/student/progress", "student", C(SProgress)),
  r("/student/code", "student", C(SCode)),
  r("/student/missions", "student", C(SMissions)),
  r("/student/missions/:id", "student", (p) => <SMission key={p.id} />),
  r("/student/portfolio", "student", C(SPortfolio)),
  r("/student/settings", "student", C(SSettings)),
  r("/student/profile", "student", C(SProfile)),
  r("/admin", "admin", C(Admin)),
  r("/admin/sims", "admin", C(ASims)),
];

function App() {
  const loc = useSyncExternalStore(subscribe, getLoc, getLoc);
  let route: Route | undefined;
  let params: Record<string, string> = {};
  for (const x of ROUTES) {
    const m = x.re.exec(loc.pathname);
    if (m) {
      route = x;
      params = Object.fromEntries(x.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      break;
    }
  }
  const body = route ? route.render(params) : <NotFound />;
  const area = route?.area ?? "public";
  return (
    <ParamsContext.Provider value={params}>
      {area === "public" ? (
        <PublicFrame>
          <div key={loc.pathname}>{body}</div>
        </PublicFrame>
      ) : (
        <AppShell role={area}>
          <div key={loc.pathname}>{body}</div>
        </AppShell>
      )}
    </ParamsContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);

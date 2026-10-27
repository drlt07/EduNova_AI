"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, CheckCircle2, Code2, FileText, FolderKanban, FolderOpen, Globe, Lock, Pause, Play, SkipBack, SkipForward, XCircle } from "lucide-react";
import type { PortfolioItem } from "@/lib/domain/types";
import { computeAchievements } from "@/lib/store/achievements";
import { learningTimeline, type TimelineItem } from "@/lib/store/student-insights";
import { buildSrcDoc } from "@/components/labs/web-creator";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { FilterGroup } from "@/components/ui/tabs";
import { Stagger, StaggerItem } from "@/components/motion";

const KIND: Record<PortfolioItem["kind"], { label: string; Icon: typeof FileText }> = {
  "lab-report": { label: "Báo cáo thí nghiệm", Icon: FileText },
  code: { label: "Bài lập trình", Icon: Code2 },
  web: { label: "Trang web", Icon: Globe },
  project: { label: "Dự án", Icon: FolderKanban },
};
const VIS = { private: "Chỉ mình em", teacher: "Giáo viên", class: "Cả lớp" } as const;
const TL_KIND: Record<TimelineItem["kind"], string> = { lab: "Thí nghiệm", code: "Lập trình", game: "Trò chơi", practice: "Luyện tập", project: "Dự án", lesson: "Bài học", submit: "Nộp bài" };

function splitWeb(content: string) {
  const [htmlPart, cssPart = ""] = content.split("/* CSS */");
  return { html: htmlPart.replace("<!-- HTML -->", "").trim(), css: cssPart.trim() };
}

export default function PortfolioPage() {
  const [tab, setTab] = useState("badges");
  return (
    <>
      <PageHeader title="Thành tích & hồ sơ" description="Huy hiệu, sản phẩm em đã làm và toàn bộ quá trình học được ghi lại." />
      <FilterGroup label="Mục" value={tab} onChange={setTab} options={[{ value: "badges", label: "Huy hiệu" }, { value: "work", label: "Sản phẩm" }, { value: "replay", label: "Xem lại quá trình" }]} />
      <div className="mt-5">{tab === "badges" ? <Badges /> : tab === "work" ? <Works /> : <Replay />}</div>
    </>
  );
}

function Badges() {
  const { d, user } = useSessionData();
  const list = computeAchievements(d, user.id);
  return (
    <>
      <p className="mb-4 text-sm text-muted">Em đã đạt <b className="text-fg">{list.filter((a) => a.earned).length}/{list.length}</b> huy hiệu. Huy hiệu chỉ hiển thị cho riêng em, không có bảng xếp hạng.</p>
      <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((a) => (
          <StaggerItem as="li" key={a.id} className={cn("rounded-2xl border p-5", a.earned ? "border-success/40 bg-gradient-to-br from-success/10 to-transparent" : "border-line bg-surface")}>
            <motion.span whileHover={a.earned ? { rotate: [0, -8, 8, 0], scale: 1.08 } : undefined} className={cn("grid size-12 place-items-center rounded-2xl", a.earned ? "bg-success/15 text-success-fg" : "bg-surface-2 text-muted")}>{a.earned ? <Award className="size-6" aria-hidden /> : <Lock className="size-5" aria-hidden />}</motion.span>
            <p className="mt-3 font-semibold text-fg">{a.title}</p>
            <p className="text-sm text-muted">{a.description}</p>
            <div className="mt-3"><Progress value={a.progress} tone={a.earned ? "success" : "cyan"} label={`Tiến độ ${a.title}`} /></div>
            <p className="mt-1 text-xs text-muted">{a.earned ? "Đã đạt" : `${a.progress}%`}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </>
  );
}

function Works() {
  const { d, user } = useSessionData();
  const items = d.portfolio.filter((p) => p.studentId === user.id);
  const [kind, setKind] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [ver, setVer] = useState<number | null>(null);
  const list = items.filter((p) => !kind || p.kind === kind);
  const current = items.find((p) => p.id === sel) ?? list[0];
  const version = current?.versions.find((v) => v.version === ver) ?? current?.versions[current.versions.length - 1];
  if (!items.length) return <EmptyState icon={FolderOpen} title="Chưa có sản phẩm" description="Khi em nộp nhiệm vụ, lưu bài ở Phòng lập trình hoặc hoàn thành dự án, sản phẩm sẽ xuất hiện ở đây." />;
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Select aria-label="Lọc loại" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Mọi loại</option>
          {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <ul className="space-y-2">
          {list.map((p) => {
            const K = KIND[p.kind];
            return (
              <li key={p.id}>
                <button type="button" aria-pressed={current?.id === p.id} onClick={() => { setSel(p.id); setVer(null); }} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", current?.id === p.id ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
                  <K.Icon className="size-5 shrink-0 text-cyan-fg" aria-hidden />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-fg">{p.title}</span><span className="text-xs text-muted">{K.label} · {p.versions.length} phiên bản · {VIS[p.visibility ?? "teacher"]}</span></span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {current && version && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <div><CardTitle as="h2">{current.title}</CardTitle><p className="text-xs text-muted">Lưu {formatDate(version.savedAt, true)}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{KIND[current.kind].label}</Badge>
              <label htmlFor="ver" className="sr-only">Phiên bản</label>
              <Select id="ver" className="h-9 w-32" value={version.version} onChange={(e) => setVer(Number(e.target.value))}>
                {current.versions.map((v) => <option key={v.version} value={v.version}>Phiên bản {v.version}</option>)}
              </Select>
              <label htmlFor="vis" className="sr-only">Ai được xem</label>
              <Select id="vis" className="h-9 w-36" value={current.visibility ?? "teacher"} onChange={(e) => d.setPortfolioVisibility(current.id, e.target.value as keyof typeof VIS)} data-testid="portfolio-visibility">
                {Object.entries(VIS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {current.kind === "web" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <pre tabIndex={0} className="max-h-[420px] overflow-auto rounded-xl bg-[#0B1220] p-3 font-mono text-xs text-slate-200">{version.content}</pre>
                <iframe title="Xem trước trang web" sandbox="" srcDoc={buildSrcDoc(splitWeb(version.content).html, splitWeb(version.content).css)} className="min-h-[300px] w-full rounded-xl border border-line bg-white" />
              </div>
            ) : (
              <pre tabIndex={0} className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#0B1220] p-4 font-mono text-[13px] leading-6 text-slate-200">{version.content}</pre>
            )}
            <p className="mt-3 text-xs text-muted">Sản phẩm không bao giờ được công khai ra ngoài lớp. “Cả lớp” nghĩa là bạn cùng lớp có thể xem khi hệ thống có máy chủ dữ liệu dùng chung.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Replay() {
  const { d, user } = useSessionData();
  const items = useMemo(() => learningTimeline(d, user.id), [d, user.id]);
  const [filter, setFilter] = useState("");
  const list = items.filter((i) => !filter || i.kind === filter);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const at = Math.min(pos, Math.max(0, list.length - 1));
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setPos((p) => {
      if (p >= list.length - 1) { setPlaying(false); return p; }
      return p + 1;
    }), 1400);
    return () => window.clearInterval(t);
  }, [playing, list.length]);
  if (!items.length) return <EmptyState title="Chưa có hoạt động nào được ghi lại" description="Mọi lần chạy thử, lưu code, luyện tập và làm dự án sẽ xuất hiện ở đây." />;
  const cur = list[at];
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle as="h2">Xem lại quá trình học</CardTitle>
          <Select aria-label="Loại hoạt động" className="h-9 w-40" value={filter} onChange={(e) => { setFilter(e.target.value); setPos(0); setPlaying(false); }}>
            <option value="">Mọi hoạt động</option>
            {Object.entries(TL_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </CardHeader>
        <CardContent>
          {cur ? (
            <>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="secondary" aria-label="Lùi" onClick={() => setPos(Math.max(0, at - 1))} disabled={at === 0}><SkipBack className="size-4" /></Button>
                <Button size="icon" aria-label={playing ? "Tạm dừng" : "Phát lại"} onClick={() => { if (at >= list.length - 1) setPos(0); setPlaying((p) => !p); }} data-testid="replay-play">{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
                <Button size="icon" variant="secondary" aria-label="Tiếp" onClick={() => setPos(Math.min(list.length - 1, at + 1))} disabled={at >= list.length - 1}><SkipForward className="size-4" /></Button>
                <label htmlFor="replay-pos" className="sr-only">Vị trí</label>
                <input id="replay-pos" type="range" min={0} max={list.length - 1} value={at} onChange={(e) => setPos(Number(e.target.value))} className="flex-1 accent-[var(--cyan)]" />
                <span className="w-16 text-right text-xs text-muted">{at + 1}/{list.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={cur.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="mt-4 rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cyan">{TL_KIND[cur.kind]}</Badge>
                    <span className="text-xs text-muted">{formatDate(cur.at, true)}</span>
                    {cur.ok !== undefined && (cur.ok ? <Badge tone="success">Đạt</Badge> : <Badge tone="warning">Chưa đạt</Badge>)}
                  </div>
                  <p className="mt-2 font-semibold text-fg">{cur.title}</p>
                  <p className="text-sm text-muted">{cur.detail}</p>
                  {cur.code && <pre tabIndex={0} className="mt-3 max-h-64 overflow-auto rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] text-slate-200">{cur.code}</pre>}
                </motion.div>
              </AnimatePresence>
            </>
          ) : <p className="text-sm text-muted">Không có hoạt động loại này.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle as="h2">Dòng thời gian</CardTitle></CardHeader>
        <CardContent>
          <ol tabIndex={0} aria-label="Dòng thời gian hoạt động" className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
            {list.map((i, k) => (
              <li key={i.id}>
                <button type="button" onClick={() => { setPos(k); setPlaying(false); }} aria-current={k === at ? "step" : undefined} className={cn("flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm", k === at ? "bg-cyan/10" : "hover:bg-surface-2")}>
                  {i.ok === undefined ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan" aria-hidden /> : i.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden />}
                  <span className="min-w-0 flex-1"><span className="block truncate text-fg">{i.title}</span><span className="text-xs text-muted">{formatDate(i.at, true)}</span></span>
                </button>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { MiniSimPreview } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import { useState } from "react";
import { Compass, Gamepad2, Search, Swords, Trophy } from "lucide-react";
import { FARM_LEVELS, GAMES, WORLDS } from "@/lib/data/games";
import { LAB_LEVELS, LAB_TOPICS, labMeta, topicLabel } from "@/lib/data/lab-catalog";
import { fmtScore } from "@/lib/sim/lab-score";
import { useSessionData } from "@/lib/store/use-role";
import { cn, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { SimCard, type LabProgress } from "@/components/labs/lab-card";
import { Stagger, StaggerItem } from "@/components/motion";
import { AlgoThumb } from "@/components/algo/hsg-catalog";
import { ALGO_IDS, HSG_TOPICS } from "@/lib/data/hsg";

const WORLD_STYLE = { success: "from-success/25 via-cyan/10", blue: "from-blue/25 via-cyan/10", violet: "from-violet/25 via-blue/10" } as const;

export default function GamesPage() {
  const { d, user } = useSessionData();
  const [grade, setGrade] = useState("");
  const [world, setWorld] = useState("");
  const [diff, setDiff] = useState("");
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const farm = d.gameProgress.find((g) => g.studentId === user.id && g.gameSlug === "smart-farm");
  /** Trạng thái của em: nông trại theo cấp đã vượt, các mô phỏng khác theo điểm đã lưu. */
  const progressOf = (g: (typeof GAMES)[number]): LabProgress => {
    if (g.slug === "smart-farm") { const n = farm?.passed.length ?? 0; return n ? { label: `Cấp ${n}/${FARM_LEVELS.length}`, done: n >= FARM_LEVELS.length } : { label: "Chưa học", done: false }; }
    const rs = d.labResults.filter((r) => r.studentId === user.id && r.labSlug === g.labSlug);
    return rs.length ? { label: `Hoàn thành · ${fmtScore(Math.max(...rs.map((r) => r.score)))}`, done: true } : { label: "Chưa học", done: false };
  };
  const games = GAMES.filter((g) => {
    const m = labMeta(g.labSlug ?? g.icon);
    const done = progressOf(g)?.done ?? false;
    return (!grade || String(g.grade) === grade) && (!world || g.worldId === world) && (!diff || g.difficulty === diff) && (!topic || m.topic === topic) && (!status || (status === "done" ? done : !done)) && matchesQuery(q, g.title, g.description, g.focus, topicLabel(m.topic));
  });

  return (
    <>
      <PageHero variant="app" eyebrow="Tình huống mô phỏng" icon={Gamepad2} title="Khám phá Tin học" accent="bằng cách thử" description="Thuật toán, máy tính, mạng và những tình huống tương tác. Gặp khó, mở AI Gia sư ngay bên cạnh mô phỏng." stats={[{ value: GAMES.filter((g) => g.status === "available").length, label: "chơi được ngay" }, { value: GAMES.length, label: "tình huống" }, { value: WORLDS.length, label: "thế giới" }, { value: "3D", label: "giao lộ thông minh" }]} visual={<MiniSimPreview href="/student/games/traffic-city" cta="Chơi ngay" />} />
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <Input type="search" aria-label="Tìm tình huống" placeholder="Tìm tình huống (ví dụ: nhị phân, gói tin, SQL, lừa đảo)…" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 rounded-xl pl-11" />
          </div>
          <Select aria-label="Khối lớp" className="h-12 rounded-xl" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">Tất cả khối lớp (10, 11, 12)</option>{[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</Select>
          <Select aria-label="Mức độ" className="h-12 rounded-xl" value={diff} onChange={(e) => setDiff(e.target.value)}><option value="">Tất cả mức độ</option>{Object.entries(LAB_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4" role="group" aria-label="Lọc theo chủ đề">
          <span className="mr-1 text-sm font-medium text-muted">Chủ đề:</span>
          {[{ id: "", label: "Tất cả" }, ...LAB_TOPICS].map((t) => (
            <button key={t.id} type="button" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)} className={cn("rounded-xl px-3 py-1.5 text-sm font-medium transition-colors", topic === t.id ? "bg-brand text-brand-ink shadow-sm shadow-brand/30" : "bg-surface-2 text-fg/80 hover:bg-line")}>{t.label}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="game-status" className="text-sm font-medium text-muted">Trạng thái:</label>
          <Select id="game-status" className="h-9 w-44 rounded-xl" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả bài</option><option value="todo">Chưa học</option><option value="done">Đã hoàn thành</option></Select>
          {world && <button type="button" onClick={() => setWorld("")} className="rounded-xl bg-brand/10 px-3 py-1.5 text-sm font-medium text-blue-fg">{WORLDS.find((w) => w.id === world)?.name} ✕</button>}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">Hiển thị <b className="text-fg">{games.length}</b> tình huống</p>
      <Stagger as="ul" className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => {
          const m = labMeta(g.labSlug ?? g.icon);
          const p = progressOf(g);
          return (
            <StaggerItem as="li" key={g.slug} className="min-w-0">
              <SimCard href={g.status === "available" ? `/student/games/${g.slug}` : undefined} art={g.labSlug ?? g.icon} grades={[g.grade]} level={g.difficulty} minutes={g.minutes} missions={g.slug === "smart-farm" ? FARM_LEVELS.length : m.missions} topic={topicLabel(m.topic)} title={g.title} description={g.description} footer={`Kiến thức: ${g.focus}`} cta={g.status === "available" ? (p?.done ? "Làm lại" : "Khám phá") : "Sắp có"} pill={p} dim={g.status !== "available"} />
            </StaggerItem>
          );
        })}
      </Stagger>
      <Link href="/thuat-toan" className="group mb-6 mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-warning/40 bg-gradient-to-r from-warning/20 via-warning/5 to-transparent p-4 transition-all hover:-translate-y-0.5 sm:p-5">
        <span className="hidden gap-2 sm:flex" aria-hidden>{(["bubble", "bfs", "dijkstra"] as const).map((id) => <AlgoThumb key={id} id={id} className="h-10 w-16 rounded-lg bg-surface" />)}</span>
        <span className="min-w-0 flex-1 basis-60">
          <span className="flex items-center gap-2 text-lg font-bold text-fg"><Trophy className="size-5 text-warning-fg" aria-hidden /> Chuyên đề HSG: mô phỏng thuật toán</span>
          <span className="block text-sm text-muted">{ALGO_IDS.length} thuật toán trong {HSG_TOPICS.length} chuyên đề: sắp xếp, tìm kiếm, loang BFS/DFS, Dijkstra, quy hoạch động, sàng nguyên tố. Chạy từng bước và đoán bước tiếp theo.</span>
        </span>
        <span className="rounded-xl bg-fg px-3 py-2 text-sm font-semibold text-bg group-hover:opacity-90">Mở chuyên đề</span>
      </Link>
      <Stagger className="mb-6 grid gap-4 md:grid-cols-3">
        {WORLDS.map((w) => (
          <StaggerItem key={w.id}>
            <button type="button" onClick={() => setWorld(world === w.id ? "" : w.id)} aria-pressed={world === w.id} className={cn("relative h-full w-full overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-5 text-left transition-all hover:-translate-y-0.5", WORLD_STYLE[w.accent], world === w.id ? "border-cyan/60 ring-2 ring-cyan/30" : "border-line")}>
              <span aria-hidden className="blob-float absolute -right-6 -top-6 size-24 rounded-full bg-white/20" />
              <Badge tone="blue">Tin học {w.grade}</Badge>
              <p className="mt-2 text-lg font-bold text-fg">{w.name}</p>
              <p className="mt-1 text-sm text-muted">{w.description}</p>
              <p className="mt-3 text-xs font-medium text-fg">{GAMES.filter((g) => g.worldId === w.id && g.status === "available").length}/{GAMES.filter((g) => g.worldId === w.id).length} trò chơi đã mở</p>
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-3">
        {[
          { icon: Compass, t: "Khám phá", d: "Tự thử nghiệm, không tính điểm." },
          { icon: Swords, t: "Nhiệm vụ", d: "Vượt từng cấp độ, có gợi ý, mở cấp tiếp theo khi đạt." },
          { icon: Trophy, t: "Đánh giá", d: "Làm bài giáo viên giao, kết quả được lưu làm minh chứng." },
        ].map((m) => (
          <div key={m.t} className="flex gap-3">
            <m.icon className="mt-0.5 size-5 shrink-0 text-cyan-fg" aria-hidden />
            <div><p className="font-semibold text-fg">{m.t}</p><p className="text-sm text-muted">{m.d}</p></div>
          </div>
        ))}
      </div>

    </>
  );
}

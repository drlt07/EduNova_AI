"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Compass, Lock, Swords, Trophy } from "lucide-react";
import { FARM_LEVELS, GAMES, WORLDS } from "@/lib/data/games";
import { DIFFICULTY_LABEL } from "@/lib/data/curriculum";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { LabIcon } from "@/components/labs/lab-card";
import { AnimatedBar, Stagger, StaggerItem } from "@/components/motion";

const WORLD_STYLE = { success: "from-success/25 via-cyan/10", blue: "from-blue/25 via-cyan/10", violet: "from-violet/25 via-blue/10" } as const;
const DIFF_TONE = { "co-ban": "success", "trung-binh": "warning", "nang-cao": "danger" } as const;

export default function GamesPage() {
  const { d, user } = useSessionData();
  const [grade, setGrade] = useState("");
  const [world, setWorld] = useState("");
  const [diff, setDiff] = useState("");
  const games = useMemo(() => GAMES.filter((g) => (!grade || String(g.grade) === grade) && (!world || g.worldId === world) && (!diff || g.difficulty === diff)), [grade, world, diff]);
  const farm = d.gameProgress.find((g) => g.studentId === user.id && g.gameSlug === "smart-farm");

  return (
    <>
      <PageHeader title="Tình huống mô phỏng" description="Khám phá thuật toán, máy tính, mạng và những tình huống tương tác. Gặp khó, em mở AI Gia sư ngay trong mô phỏng." />
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

      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label="Lớp" className="w-36" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">Mọi lớp</option>{[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</Select>
        <Select aria-label="Thế giới" className="w-52" value={world} onChange={(e) => setWorld(e.target.value)}><option value="">Mọi thế giới</option>{WORLDS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
        <Select aria-label="Độ khó" className="w-40" value={diff} onChange={(e) => setDiff(e.target.value)}><option value="">Mọi độ khó</option>{Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
      </div>

      <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => {
          const available = g.status === "available";
          const passed = g.slug === "smart-farm" ? farm?.passed.length ?? 0 : null;
          const inner = (
            <>
              <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-cyan/15 via-surface-2 to-violet/15">
                <LabIcon slug={g.icon} className={cn("size-16", available ? "text-cyan-fg" : "text-muted")} />
                {!available && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted"><Lock className="size-3" /> Sắp có</span>}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs text-muted">{WORLDS.find((w) => w.id === g.worldId)?.name} · Lớp {g.grade}</p>
                <h3 className="text-lg font-bold text-fg">{g.title}</h3>
                <p className="text-sm text-muted">{g.description}</p>
                <p className="text-sm text-fg"><span className="text-muted">Kiến thức:</span> {g.focus}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <Badge tone={DIFF_TONE[g.difficulty]}>{DIFFICULTY_LABEL[g.difficulty]}</Badge>
                  <Badge><Clock className="size-3" /> {g.minutes} phút</Badge>
                </div>
                {passed !== null && (
                  <div className="pt-1">
                    <div className="mb-1 flex justify-between text-xs text-muted"><span>Cấp độ đã vượt</span><span>{passed}/{FARM_LEVELS.length}</span></div>
                    <AnimatedBar value={(passed / FARM_LEVELS.length) * 100} tone="success" label={`Đã vượt ${passed} trên ${FARM_LEVELS.length} cấp`} />
                  </div>
                )}
              </div>
            </>
          );
          return (
            <StaggerItem as="li" key={g.slug}>
              {available ? (
                <Link href={`/student/games/${g.slug}`} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-1 hover:border-cyan/50 hover:shadow-lg">{inner}</Link>
              ) : (
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-line bg-surface">{inner}</div>
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
    </>
  );
}

import { CheckCircle2, ListChecks, Pause, Pencil, Play, RotateCcw, Send, SlidersHorizontal, XCircle } from "lucide-react";
import type { ExperimentEvent } from "@/lib/domain/types";
import { formatTime } from "@/lib/utils";

const META: Record<ExperimentEvent["type"], { label: string; Icon: typeof Play }> = {
  run: { label: "Chạy thử", Icon: Play },
  test: { label: "Kiểm thử", Icon: ListChecks },
  input_change: { label: "Đổi độ ẩm/nước", Icon: SlidersHorizontal },
  rule_change: { label: "Sửa điều kiện", Icon: Pencil },
  reset: { label: "Đặt lại", Icon: RotateCcw },
  submit: { label: "Nộp bài", Icon: Send },
  pause: { label: "Tạm dừng", Icon: Pause },
  resume: { label: "Tiếp tục", Icon: Play },
};

function describe(e: ExperimentEvent): string {
  const i = e.input as Record<string, unknown>;
  const o = e.output as Record<string, unknown>;
  switch (e.type) {
    case "run":
      return i.kind === "timeline" ? `Mô phỏng theo thời gian với "${i.rule}"` : `độ ẩm ${i.humidity}%, ${i.hasWater ? "còn nước" : "hết nước"} → bơm ${o.pump ? "BẬT" : "TẮT"} (đúng ra: ${o.expected ? "BẬT" : "TẮT"})`;
    case "test":
      return `Đạt ${o.passed}/${o.total} trường hợp`;
    case "input_change":
      return `độ ẩm ${i.humidity}%, ${i.hasWater ? "còn nước" : "hết nước"}`;
    case "rule_change":
      return `"${i.rule}"${i.valid === false ? " (chưa hợp lệ)" : ""}`;
    case "submit":
      return `Điều kiện nộp: "${i.rule}"`;
    default:
      return "";
  }
}

export function EventTimeline({ events, max = 60 }: { events: ExperimentEvent[]; max?: number }) {
  const list = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(-max);
  if (!list.length) return <p className="text-sm text-muted">Chưa có sự kiện.</p>;
  return (
    <ol className="relative space-y-2 border-l border-line pl-4" aria-label="Quá trình làm bài">
      {list.map((e) => {
        const m = META[e.type];
        return (
          <li key={e.id} className="relative text-sm">
            <span className="absolute -left-[23px] top-1 grid size-3.5 place-items-center rounded-full bg-surface ring-2 ring-line" aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <m.Icon className="size-3.5 text-cyan-fg" aria-hidden />
              <span className="font-medium text-fg">{m.label}</span>
              {e.pass === true && <CheckCircle2 className="size-3.5 text-success-fg" aria-label="đúng" />}
              {e.pass === false && <XCircle className="size-3.5 text-danger-fg" aria-label="sai" />}
              <span className="ml-auto font-mono text-[11px] text-muted">{formatTime(e.timestamp)}</span>
            </div>
            <p className="font-mono text-xs text-muted">{describe(e)}</p>
          </li>
        );
      })}
    </ol>
  );
}

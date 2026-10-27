// Router trong bộ nhớ cho bản Artifact (không có server Next.js).
type Loc = { pathname: string; search: string };
let loc: Loc = { pathname: "/", search: "" };
const subs = new Set<() => void>();

export function parse(href: string): Loc {
  const u = new URL(href, "https://app.local" + loc.pathname);
  return { pathname: u.pathname.replace(/\/$/, "") || "/", search: u.search };
}
export function getLoc() {
  return loc;
}
export function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}
const history: Loc[] = [];
export function navigate(href: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  const next = parse(href);
  if (!opts.replace) history.push(loc);
  loc = next;
  subs.forEach((f) => f());
  const hash = new URL(href, "https://app.local").hash.slice(1);
  if (hash) {
    // chờ trang mới render xong rồi cuộn tới mục (#lien-he, #dieu-khoan…)
    requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: "start" }));
  } else if (opts.scroll !== false && !opts.replace) window.scrollTo({ top: 0 });
}
export function back() {
  const prev = history.pop();
  if (prev) {
    loc = prev;
    subs.forEach((f) => f());
  }
}

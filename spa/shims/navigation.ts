import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { back, getLoc, navigate, subscribe } from "./router-store";

export const ParamsContext = createContext<Record<string, string>>({});

const useLoc = () => useSyncExternalStore(subscribe, getLoc, getLoc);

export function useRouter() {
  return useMemo(
    () => ({
      push: (href: string, o?: { scroll?: boolean }) => navigate(href, o),
      replace: (href: string, o?: { scroll?: boolean }) => navigate(href, { ...o, replace: true }),
      back,
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
    [],
  );
}
export function usePathname() {
  return useLoc().pathname;
}
export function useSearchParams() {
  const search = useLoc().search;
  return useMemo(() => new URLSearchParams(search), [search]);
}
export function useParams<T = Record<string, string>>() {
  return useContext(ParamsContext) as T;
}
export function redirect(href: string): never {
  navigate(href, { replace: true });
  throw new Error("redirect");
}
export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { ROLE_HOME, isGatedPath, roleArea } from "@/lib/auth/paths";
import type { Role } from "@/lib/domain/types";

/**
 * Chặn ở máy chủ (khi có Supabase): làm mới phiên đăng nhập trong cookie, bắt đăng nhập với trang chức năng,
 * và không cho vào khu vực của vai trò khác. Dữ liệu vẫn được bảo vệ bởi RLS trong cơ sở dữ liệu.
 */
export async function proxy(request: NextRequest) {
  if (AUTH_MODE !== "supabase") return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() xác minh phiên với máy chủ Auth, không tin cookie phía client.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const area = roleArea(pathname);
  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    return res;
  };

  if (!user) {
    if (area || isGatedPath(pathname)) return redirect(`/login?next=${encodeURIComponent(pathname + search)}`);
    return response;
  }
  if (area || pathname === "/login" || pathname === "/register") {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: Role }>();
    const role = data?.role;
    if (role && area && area !== role) return redirect(ROLE_HOME[role]);
    if (role && !area) return redirect(ROLE_HOME[role]);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|auth/|nova/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|glb|gltf|woff2?)$).*)"],
};

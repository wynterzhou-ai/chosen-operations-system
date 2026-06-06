import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const isLogin = request.nextUrl.pathname === "/login";
  const isPortal = request.nextUrl.pathname === "/portal" || request.nextUrl.pathname.startsWith("/portal/");

  if (!session && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let isClientPortalUser = false;
  if (session) {
    const { data } = await supabase
      .from("client_users")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    isClientPortalUser = Boolean(data);
  }

  if (session && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = isClientPortalUser ? "/portal" : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (session && isClientPortalUser && !isPortal) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return response;
}

import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login"];
const authApiPrefix = "/api/auth";
const backendApiPrefix = "/api";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // NextAuth own routes — never intercept
  if (nextUrl.pathname.startsWith(authApiPrefix)) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proxy authenticated API calls to the backend
  if (nextUrl.pathname.startsWith(backendApiPrefix)) {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
    }

    const target = new URL(nextUrl.pathname + nextUrl.search, backendUrl);
    const headers = new Headers(req.headers);

    // Forward the session token so the backend can authenticate
    const accessToken = (req.auth as { accessToken?: string } | null)?.accessToken;
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return NextResponse.rewrite(target, { request: { headers } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)"],
};

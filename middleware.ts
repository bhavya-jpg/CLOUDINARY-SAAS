import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes must include Clerk's auth pages and OAuth callbacks
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/oauth(.*)",
  "/oauth-callback(.*)",
]);
const isPublicApiRoute = createRouteMatcher(["/api/videos", "/api/test-env"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);
  const isAccessingDashboard = currentUrl.pathname === "/home";
  const isApiRequest = currentUrl.pathname.startsWith("/api");

  // Redirect root path based on authentication state
  if (currentUrl.pathname === "/") {
    if (userId) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  // Only redirect logged-in users from /sign-in or /sign-up to /home
  if (userId && ["/sign-in", "/sign-up"].includes(currentUrl.pathname)) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Not logged in
  if (!userId) {
    // If user is not logged in and trying to access a protected route
    if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
      return NextResponse.redirect(new URL("/sign-up", req.url));
    }

    // If the request is for a protected API and the user is not logged in
    if (isApiRequest && !isPublicApiRoute(req)) {
      return NextResponse.redirect(new URL("/sign-up", req.url));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

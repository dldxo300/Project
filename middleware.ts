import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  // Admin route 체크가 필요한 경우에만 user 정보 조회
  let isAdmin = false;
  if (isAdminRoute && userId) {
    try {
      const user = await (await clerkClient()).users.getUser(userId);
      isAdmin = user.privateMetadata?.role === "admin";
    } catch (error) {
      console.error("❌ Failed to fetch user:", error);
    }
  }

  console.log("🔐 Middleware Check:", {
    path: req.nextUrl.pathname,
    userId: userId ? "authenticated" : "anonymous",
    isAdmin,
    isAdminRoute,
  });

  // Admin route 보호: 관리자가 아니면 홈으로 리다이렉트
  if (isAdminRoute && (!userId || !isAdmin)) {
    console.log("❌ Admin access denied, redirecting to /");
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

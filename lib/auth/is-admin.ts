import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * @file lib/auth/is-admin.ts
 * @description 서버 사이드에서 관리자 권한 확인 유틸리티
 *
 * Clerk privateMetadata.role === "admin" 체크
 */

/**
 * 현재 사용자가 관리자인지 확인
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) return false;

  try {
    const user = await (await clerkClient()).users.getUser(userId);
    return user.privateMetadata?.role === "admin";
  } catch (error) {
    console.error("❌ Failed to fetch user:", error);
    return false;
  }
}

/**
 * 관리자가 아니면 에러를 throw
 * Server Action에서 사용
 */
export async function assertAdminOrThrow(): Promise<void> {
  console.group("🔐 assertAdminOrThrow");

  const { userId } = await auth();

  if (!userId) {
    console.log("❌ Not authenticated");
    console.groupEnd();
    throw new Error("인증이 필요합니다.");
  }

  try {
    const user = await (await clerkClient()).users.getUser(userId);
    const role = user.privateMetadata?.role;

    console.log("userId:", userId);
    console.log("role:", role);

    if (role !== "admin") {
      console.log("❌ Not admin - throwing error");
      console.groupEnd();
      throw new Error("관리자 권한이 필요합니다.");
    }

    console.log("✅ Admin verified");
    console.groupEnd();
  } catch (error) {
    console.log("❌ Error checking admin status:", error);
    console.groupEnd();
    throw error instanceof Error ? error : new Error("관리자 권한 확인 실패");
  }
}


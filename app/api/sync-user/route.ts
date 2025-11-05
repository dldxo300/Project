import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 *
 * 공식 문서 권장 사항:
 * - Route Handler에서는 auth() 함수 사용
 * - 쿠키 기반 세션 관리로 인증 (Authorization header 불필요)
 */
export async function POST() {
  console.group("🔐 API: /api/sync-user");

  try {
    // Clerk 인증 확인 (공식 문서 권장 방식)
    console.log("1️⃣ Checking Clerk authentication...");
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ No userId found - Unauthorized");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized", details: "No user ID found" },
        { status: 401 }
      );
    }

    console.log("   userId:", userId);

    // Clerk에서 사용자 정보 가져오기
    console.log("2️⃣ Fetching user from Clerk...");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    console.log("   clerkUser:", {
      id: clerkUser.id,
      fullName: clerkUser.fullName,
      username: clerkUser.username,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    if (!clerkUser) {
      console.error("❌ User not found in Clerk");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Supabase에 사용자 정보 동기화
    console.log("3️⃣ Syncing to Supabase...");
    const supabase = getServiceRoleClient();

    const userData = {
      clerk_id: clerkUser.id,
      name:
        clerkUser.fullName ||
        clerkUser.username ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        "Unknown",
    };
    console.log("   userData to sync:", userData);

    const { data, error } = await supabase
      .from("users")
      .upsert(userData, {
        onConflict: "clerk_id",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase sync error:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to sync user", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ User synced successfully:", data);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("❌ Sync user error:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

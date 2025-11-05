"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase users 테이블에 사용자 정보를 저장합니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useSyncUser } from '@/hooks/use-sync-user';
 *
 * export default function Layout({ children }) {
 *   useSyncUser();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useSyncUser() {
  const { isLoaded, userId } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    console.group("🔄 User Sync Status");
    console.log("isLoaded:", isLoaded);
    console.log("userId:", userId);
    console.log("syncedRef.current:", syncedRef.current);
    console.groupEnd();

    // 이미 동기화했거나, 로딩 중이거나, 로그인하지 않은 경우 무시
    if (syncedRef.current) {
      console.log("✅ User already synced, skipping");
      return;
    }

    if (!isLoaded) {
      console.log("⏳ Clerk not loaded yet, waiting...");
      return;
    }

    if (!userId) {
      console.log("👤 No user logged in, skipping sync");
      return;
    }

    // 동기화 실행
    const syncUser = async () => {
      console.log("🚀 Starting user sync...");
      try {
        // Clerk는 쿠키로 세션을 관리하므로 credentials: "include"만 필요
        // Authorization header는 불필요 (공식 문서 권장 방식)
        const response = await fetch("/api/sync-user", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Failed to sync user:", errorText);
          return;
        }

        const result = await response.json();
        console.log("✅ User synced successfully:", result);
        syncedRef.current = true;
      } catch (error) {
        console.error("❌ Error syncing user:", error);
      }
    };

    syncUser();
  }, [isLoaded, userId]);
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { CustomOrder, CustomOrderStatus, CustomOrderWithSignedUrls } from "@/types/custom-order";
import { CANCELLABLE_STATUSES } from "@/types/custom-order";

/**
 * @file actions/custom-order.ts
 * @description 주문제작 의뢰 Server Action
 *
 * - FormData를 받아 Supabase Storage에 이미지 업로드
 * - `public.custom_orders`에 레코드 생성
 * - 생성된 의뢰 ID로 확인 페이지로 리다이렉트
 * - 주문 목록 조회, 상세 조회, 취소 기능
 */

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024; // 6MB (setup_storage.sql 정책과 일치)

const schema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "설명을 10자 이상 입력해 주세요."),
  size_preference: z
    .string()
    .trim()
    .min(1, "사이즈를 선택해 주세요."),
});

function assertImageOrThrow(file: File, label: string) {
  if (!file) throw new Error(`${label} 파일이 필요합니다.`);
  if (!file.type.startsWith("image/")) {
    throw new Error(`${label} 파일은 이미지 형식이어야 합니다.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`${label} 파일은 최대 6MB까지 업로드할 수 있습니다.`);
  }
}

export async function createCustomOrder(formData: FormData): Promise<never> {
  console.group("custom-order:server-action:create");
  const { userId } = await auth();
  if (!userId) {
    console.log("not-authenticated -> redirect /sign-in");
    console.groupEnd();
    redirect("/sign-in");
  }

  const description = String(formData.get("description") ?? "");
  const sizePreference = String(formData.get("size_preference") ?? "");
  const sourceImage = formData.get("source_image");

  const parsed = schema.safeParse({ description, size_preference: sizePreference });
  if (!parsed.success) {
    console.log("validation-failed", parsed.error.flatten());
    console.groupEnd();
    throw new Error("입력값을 확인해 주세요.");
  }

  if (!(sourceImage instanceof File)) {
    console.groupEnd();
    throw new Error("대표 이미지를 선택해 주세요.");
  }
  assertImageOrThrow(sourceImage, "대표 이미지");

  const referenceImages: File[] = [];
  const refEntries = formData.getAll("reference_images");
  for (const entry of refEntries) {
    if (entry instanceof File && entry.size > 0) {
      assertImageOrThrow(entry, "참고 이미지");
      referenceImages.push(entry);
    }
  }

  const supabase = createClerkSupabaseClient();

  // 업로드 경로 prefix: {clerk_sub}/custom-orders/{requestUid}
  const requestUid = crypto.randomUUID();
  const prefix = `${userId}/custom-orders/${requestUid}`;

  // 1) 대표 이미지 업로드
  const sourceImagePath = `${prefix}/source/${sourceImage.name}`;
  console.log("upload:source", sourceImagePath, sourceImage.type, sourceImage.size);
  const uploadMain = await supabase.storage
    .from("uploads")
    .upload(sourceImagePath, sourceImage, {
      cacheControl: "3600",
      contentType: sourceImage.type,
      upsert: false,
    });
  if (uploadMain.error) {
    console.log("upload-main-error", uploadMain.error);
    console.groupEnd();
    throw new Error("대표 이미지 업로드에 실패했습니다.");
  }

  // 2) 참고 이미지 업로드 (선택)
  const referencePaths: string[] = [];
  for (let i = 0; i < referenceImages.length; i++) {
    const f = referenceImages[i];
    const path = `${prefix}/refs/${i}_${f.name}`;
    console.log("upload:ref", path, f.type, f.size);
    const res = await supabase.storage
      .from("uploads")
      .upload(path, f, { cacheControl: "3600", contentType: f.type, upsert: false });
    if (res.error) {
      console.log("upload-ref-error", res.error, path);
      console.groupEnd();
      throw new Error("참고 이미지 업로드에 실패했습니다.");
    }
    referencePaths.push(path);
  }

  // 3) DB insert
  console.log("db:insert:custom_orders");
  // users 외래키 보장: clerk_id upsert (존재하지 않으면 생성)
  const upsertUser = await supabase
    .from("users")
    .upsert({ clerk_id: userId }, { onConflict: "clerk_id", ignoreDuplicates: true });
  if (upsertUser.error) {
    console.log("users-upsert-error", upsertUser.error);
    console.groupEnd();
    throw new Error("사용자 동기화에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const insertRes = await supabase
    .from("custom_orders")
    .insert({
      clerk_id: userId,
      description: parsed.data.description,
      size_preference: parsed.data.size_preference,
      source_image_url: sourceImagePath,
      reference_image_urls: referencePaths.length ? referencePaths : null,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data) {
    console.log("db-insert-error", insertRes.error);
    // 마이그레이션 미적용 시 reference_image_urls 컬럼 에러 가능성
    if (insertRes.error && typeof insertRes.error.message === "string" && insertRes.error.message.includes("reference_image_urls")) {
      console.log("hint: run pending migrations to add reference_image_urls column");
    }
    console.groupEnd();
    throw new Error("의뢰 저장에 실패했습니다.");
  }

  const newId = insertRes.data.id as string;
  console.log("redirect ->", `/custom-order/${newId}/confirmation`);
  console.groupEnd();
  redirect(`/custom-order/${newId}/confirmation`);
}

/**
 * 내 주문제작 목록 조회
 * @param status 상태 필터 (선택)
 */
export async function getMyCustomOrders(
  status?: CustomOrderStatus | "all"
): Promise<CustomOrder[]> {
  console.group("custom-orders:list");
  console.log("filter-status:", status ?? "all");

  const { userId } = await auth();
  if (!userId) {
    console.log("not-authenticated");
    console.groupEnd();
    return [];
  }

  const supabase = createClerkSupabaseClient();

  let query = supabase
    .from("custom_orders")
    .select("*")
    .eq("clerk_id", userId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.log("query-error", error);
    console.groupEnd();
    return [];
  }

  console.log("result-count:", data?.length ?? 0);
  console.groupEnd();
  return (data as CustomOrder[]) ?? [];
}

/**
 * 주문제작 상세 조회 (Storage 서명 URL 포함)
 * @param orderId 주문 ID
 */
export async function getCustomOrderById(
  orderId: string
): Promise<CustomOrderWithSignedUrls | null> {
  console.group("custom-orders:detail");
  console.log("order-id:", orderId);

  const { userId } = await auth();
  if (!userId) {
    console.log("not-authenticated");
    console.groupEnd();
    return null;
  }

  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("custom_orders")
    .select("*")
    .eq("id", orderId)
    .eq("clerk_id", userId)
    .single();

  if (error || !data) {
    console.log("query-error", error);
    console.groupEnd();
    return null;
  }

  const order = data as CustomOrder;

  // Storage 서명 URL 생성 (10분)
  const signedMain = await supabase.storage
    .from("uploads")
    .createSignedUrl(order.source_image_url, 600);

  const refUrls: string[] = Array.isArray(order.reference_image_urls)
    ? order.reference_image_urls
    : [];

  const signedRefs = await Promise.all(
    refUrls.map((path) =>
      supabase.storage.from("uploads").createSignedUrl(path, 600)
    )
  );

  const result: CustomOrderWithSignedUrls = {
    ...order,
    source_image_signed_url: signedMain.data?.signedUrl ?? null,
    reference_signed_urls: signedRefs
      .map((r) => r.data?.signedUrl)
      .filter((url): url is string => !!url),
  };

  console.log("order-status:", order.status);
  console.groupEnd();
  return result;
}

/**
 * 주문제작 취소
 * @param orderId 주문 ID
 * @returns 성공 여부 및 실패 이유
 */
export async function cancelCustomOrder(
  orderId: string
): Promise<{ ok: boolean; reason?: string }> {
  console.group("custom-orders:cancel");
  console.log("order-id:", orderId);

  const { userId } = await auth();
  if (!userId) {
    console.log("not-authenticated");
    console.groupEnd();
    return { ok: false, reason: "인증이 필요합니다." };
  }

  const supabase = createClerkSupabaseClient();

  // 1. 주문 조회 및 권한 확인
  const { data: order, error: fetchError } = await supabase
    .from("custom_orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("clerk_id", userId)
    .single();

  if (fetchError || !order) {
    console.log("fetch-error", fetchError);
    console.groupEnd();
    return { ok: false, reason: "주문을 찾을 수 없습니다." };
  }

  const currentStatus = order.status as CustomOrderStatus;
  console.log("current-status:", currentStatus);

  // 2. 취소 가능 상태 확인
  if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
    console.log("not-cancellable-status");
    console.groupEnd();
    return {
      ok: false,
      reason: "이 상태에서는 취소할 수 없습니다. (검토 대기 또는 견적 제공 상태에서만 가능)",
    };
  }

  // 3. 상태 업데이트
  const { error: updateError } = await supabase
    .from("custom_orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (updateError) {
    console.log("update-error", updateError);
    console.groupEnd();
    return { ok: false, reason: "취소 처리 중 오류가 발생했습니다." };
  }

  console.log("cancelled: status changed from", currentStatus, "to cancelled");
  console.groupEnd();
  return { ok: true };
}




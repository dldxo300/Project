/**
 * @file types/custom-order.ts
 * @description 주문제작 관련 타입 정의
 */

export type CustomOrderStatus =
  | "pending_review"
  | "quote_provided"
  | "payment_pending"
  | "in_progress"
  | "completed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface CustomOrder {
  id: string;
  clerk_id: string;
  source_image_url: string;
  reference_image_urls: string[] | null;
  generated_model_url: string | null;
  completed_image_urls: string[] | null;
  description: string;
  size_preference: string;
  status: CustomOrderStatus;
  quoted_price: number | null;
  final_price: number | null;
  shipping_address: string | null;
  linked_product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomOrderWithSignedUrls extends Omit<CustomOrder, "source_image_url" | "reference_image_urls"> {
  source_image_url: string;
  source_image_signed_url: string | null;
  reference_image_urls: string[] | null;
  reference_signed_urls: string[];
}

export const ORDER_STATUS_LABEL: Record<CustomOrderStatus, string> = {
  pending_review: "검토 대기",
  quote_provided: "견적 제공",
  payment_pending: "결제 대기",
  in_progress: "제작 중",
  completed: "완료",
  shipped: "배송 중",
  delivered: "배송 완료",
  cancelled: "취소됨",
};

export const CANCELLABLE_STATUSES: ReadonlyArray<CustomOrderStatus> = [
  "pending_review",
  "quote_provided",
];

export function isCancellable(status: CustomOrderStatus): boolean {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}


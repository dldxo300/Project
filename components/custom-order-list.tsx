"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CustomOrder, CustomOrderStatus } from "@/types/custom-order";
import { ORDER_STATUS_LABEL, isCancellable } from "@/types/custom-order";
import { Button } from "@/components/ui/button";
import { CustomOrderDetailModal } from "@/components/custom-order-detail-modal";
import Link from "next/link";

/**
 * @file components/custom-order-list.tsx
 * @description 주문제작 목록 Client Component
 */

interface CustomOrderListProps {
  initialOrders: CustomOrder[];
  initialStatus: CustomOrderStatus | "all";
}

const STATUS_OPTIONS: Array<{ value: CustomOrderStatus | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "pending_review", label: "검토 대기" },
  { value: "quote_provided", label: "견적 제공" },
  { value: "payment_pending", label: "결제 대기" },
  { value: "in_progress", label: "제작 중" },
  { value: "completed", label: "완료" },
  { value: "shipped", label: "배송 중" },
  { value: "delivered", label: "배송 완료" },
  { value: "cancelled", label: "취소됨" },
];

export function CustomOrderList({ initialOrders, initialStatus }: CustomOrderListProps) {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleStatusChange = (newStatus: string) => {
    console.log("custom-orders:filter-change", newStatus);
    const params = new URLSearchParams();
    if (newStatus !== "all") {
      params.set("status", newStatus);
    }
    router.push(`/my-custom-orders${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleModalClose = () => {
    console.log("custom-orders:modal-close");
    setSelectedOrderId(null);
    router.refresh();
  };

  if (initialOrders.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">주문제작 내역이 없습니다.</p>
        <Link href="/custom-order">
          <Button className="mt-4">새 주문제작 의뢰하기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상태 필터 드롭다운 */}
      <div className="flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm font-medium">
          상태 필터:
        </label>
        <select
          id="status-filter"
          value={initialStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">총 {initialOrders.length}건</span>
      </div>

      {/* 주문 카드 목록 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialOrders.map((order) => (
          <div key={order.id} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 text-xs text-gray-500">주문 ID: {order.id.slice(0, 8)}...</div>
                <div
                  className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                    order.status === "cancelled"
                      ? "bg-gray-100 text-gray-600"
                      : order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {ORDER_STATUS_LABEL[order.status as CustomOrderStatus]}
                </div>
              </div>
            </div>

            <div className="mb-3 text-sm">
              <div className="mb-1">
                <span className="font-medium">사이즈:</span> {order.size_preference}
              </div>
              <div className="mb-1">
                <span className="font-medium">생성일:</span>{" "}
                {new Date(order.created_at).toLocaleDateString()}
              </div>
              {order.quoted_price && (
                <div>
                  <span className="font-medium">견적:</span> {order.quoted_price.toLocaleString()}원
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                상세보기
              </Button>
              <Link href={`/my-custom-orders/${order.id}`}>
                <Button variant="ghost" size="sm" className="w-full">
                  상세 페이지로
                </Button>
              </Link>
            </div>

            {isCancellable(order.status as CustomOrderStatus) && (
              <div className="mt-2 text-xs text-amber-600">취소 가능</div>
            )}
          </div>
        ))}
      </div>

      {/* 상세 모달 */}
      {selectedOrderId && (
        <CustomOrderDetailModal orderId={selectedOrderId} isOpen={!!selectedOrderId} onClose={handleModalClose} />
      )}
    </div>
  );
}


"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCustomOrderById, cancelCustomOrder } from "@/actions/custom-order";
import type { CustomOrderWithSignedUrls } from "@/types/custom-order";
import { ORDER_STATUS_LABEL, isCancellable } from "@/types/custom-order";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * @file components/custom-order-detail-modal.tsx
 * @description 주문제작 상세 모달 (shadcn Dialog 사용)
 */

interface CustomOrderDetailModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomOrderDetailModal({ orderId, isOpen, onClose }: CustomOrderDetailModalProps) {
  const router = useRouter();
  const [order, setOrder] = useState<CustomOrderWithSignedUrls | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    console.log("custom-orders:modal-open", orderId);

    setLoading(true);
    setError(null);
    
    getCustomOrderById(orderId)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("modal-load-error", err);
        setError("주문 정보를 불러올 수 없습니다.");
        setLoading(false);
      });
  }, [orderId, isOpen]);

  const handleCancel = () => {
    if (!order) return;
    console.log("custom-orders:cancel-attempt", orderId);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    startTransition(async () => {
      console.log("custom-orders:cancel-confirmed", orderId);
      const result = await cancelCustomOrder(orderId);
      
      if (result.ok) {
        console.log("custom-orders:cancel-success");
        setShowCancelConfirm(false);
        onClose();
        router.refresh();
      } else {
        console.log("custom-orders:cancel-failed", result.reason);
        setError(result.reason ?? "취소에 실패했습니다.");
        setShowCancelConfirm(false);
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>주문제작 상세</DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="py-12 text-center text-sm text-gray-500">로딩 중...</div>
          )}

          {error && !loading && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          {order && !loading && (
            <div className="space-y-6">
              {/* 대표 이미지 */}
              <div>
                <h3 className="mb-2 text-sm font-medium">대표 이미지</h3>
                {order.source_image_signed_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.source_image_signed_url}
                    alt="대표 이미지"
                    className="h-auto w-full max-w-md rounded-md border"
                  />
                ) : (
                  <div className="rounded-md border p-6 text-sm text-gray-500">이미지를 표시할 수 없습니다.</div>
                )}
              </div>

              {/* 주문 정보 */}
              <div className="rounded-md border p-4 text-sm">
                <div className="mb-2">
                  <span className="mr-2 inline-block w-24 font-medium text-gray-600">주문 ID</span>
                  <span className="font-mono text-xs">{order.id}</span>
                </div>
                <div className="mb-2">
                  <span className="mr-2 inline-block w-24 font-medium text-gray-600">상태</span>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                      order.status === "cancelled"
                        ? "bg-gray-100 text-gray-600"
                        : order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="mr-2 inline-block w-24 font-medium text-gray-600">사이즈</span>
                  <span>{order.size_preference}</span>
                </div>
                <div className="mb-2">
                  <span className="mr-2 inline-block w-24 font-medium text-gray-600">설명</span>
                  <span className="whitespace-pre-wrap">{order.description}</span>
                </div>
                {order.quoted_price && (
                  <div className="mb-2">
                    <span className="mr-2 inline-block w-24 font-medium text-gray-600">견적 금액</span>
                    <span className="font-semibold">{order.quoted_price.toLocaleString()}원</span>
                  </div>
                )}
                <div className="mb-2">
                  <span className="mr-2 inline-block w-24 font-medium text-gray-600">생성일</span>
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* 참고 이미지 */}
              {order.reference_signed_urls.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">참고 이미지</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {order.reference_signed_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt={`참고 이미지 ${i + 1}`}
                        className="h-auto w-full rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 취소 버튼 */}
              {isCancellable(order.status) && (
                <div className="border-t pt-4">
                  <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
                    {isPending ? "처리 중..." : "주문 취소하기"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 취소 확인 다이얼로그 */}
      {showCancelConfirm && (
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>주문 취소 확인</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                정말로 이 주문을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={isPending}>
                  아니오
                </Button>
                <Button variant="destructive" onClick={handleConfirmCancel} disabled={isPending}>
                  {isPending ? "처리 중..." : "예, 취소합니다"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


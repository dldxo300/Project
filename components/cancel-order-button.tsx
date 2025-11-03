"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelCustomOrder } from "@/actions/custom-order";
import type { CustomOrderStatus } from "@/types/custom-order";
import { isCancellable } from "@/types/custom-order";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * @file components/cancel-order-button.tsx
 * @description 주문 취소 버튼 Component (재사용 가능)
 */

interface CancelOrderButtonProps {
  orderId: string;
  status: CustomOrderStatus;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function CancelOrderButton({ orderId, status, disabled, onSuccess }: CancelOrderButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 취소 가능한 상태가 아니면 렌더링하지 않음
  if (!isCancellable(status)) {
    return null;
  }

  const handleClick = () => {
    console.log("cancel-button:click", orderId);
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    console.log("cancel-button:confirm", orderId);
    startTransition(async () => {
      const result = await cancelCustomOrder(orderId);

      if (result.ok) {
        console.log("cancel-button:success");
        setShowConfirm(false);
        
        if (onSuccess) {
          onSuccess();
        } else {
          // 기본 동작: 목록 페이지로 리다이렉트
          router.push("/my-custom-orders");
          router.refresh();
        }
      } else {
        console.log("cancel-button:failed", result.reason);
        setError(result.reason ?? "취소에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={handleClick}
        disabled={disabled || isPending}
      >
        주문 취소하기
      </Button>

      {/* 취소 확인 다이얼로그 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 취소 확인</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              정말로 이 주문을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.
            </p>
            
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                아니오
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "처리 중..." : "예, 취소합니다"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


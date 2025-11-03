import { getCustomOrderById } from "@/actions/custom-order";
import { ORDER_STATUS_LABEL, isCancellable } from "@/types/custom-order";
import { CancelOrderButton } from "@/components/cancel-order-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * @file app/my-custom-orders/[id]/page.tsx
 * @description 주문제작 상세 페이지 (Server Component)
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomOrderDetailPage(props: PageProps) {
  const { id } = await props.params;
  
  console.log("custom-orders:detail-page", id);
  const order = await getCustomOrderById(id);

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="mb-4 text-xl font-semibold">주문을 찾을 수 없습니다</h1>
        <p className="mb-6 text-sm text-gray-600">
          주문이 존재하지 않거나 접근 권한이 없습니다.
        </p>
        <Link href="/my-custom-orders">
          <Button>목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">주문제작 상세</h1>
        <Link href="/my-custom-orders">
          <Button variant="outline" size="sm">
            목록으로
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* 대표 이미지 */}
        <div>
          <h2 className="mb-2 font-medium">대표 이미지</h2>
          {order.source_image_signed_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.source_image_signed_url}
              alt="대표 이미지"
              className="h-auto w-full rounded-md border"
            />
          ) : (
            <div className="rounded-md border p-6 text-sm text-gray-500">
              이미지를 표시할 수 없습니다.
            </div>
          )}
        </div>

        {/* 주문 정보 */}
        <div>
          <h2 className="mb-2 font-medium">의뢰 정보</h2>
          <div className="rounded-md border p-4 text-sm">
            <div className="mb-2">
              <span className="mr-2 inline-block w-20 text-gray-500">주문 ID</span>
              <span className="font-mono text-xs">{order.id}</span>
            </div>
            <div className="mb-2">
              <span className="mr-2 inline-block w-20 text-gray-500">상태</span>
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
              <span className="mr-2 inline-block w-20 text-gray-500">사이즈</span>
              <span>{order.size_preference}</span>
            </div>
            <div className="mb-2">
              <span className="mr-2 inline-block w-20 text-gray-500">설명</span>
              <span className="whitespace-pre-wrap">{order.description}</span>
            </div>
            {order.quoted_price && (
              <div className="mb-2">
                <span className="mr-2 inline-block w-20 text-gray-500">견적 금액</span>
                <span className="font-semibold">{order.quoted_price.toLocaleString()}원</span>
              </div>
            )}
            <div>
              <span className="mr-2 inline-block w-20 text-gray-500">생성일</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 참고 이미지 */}
      <div className="mt-8">
        <h2 className="mb-2 font-medium">참고 이미지</h2>
        {order.reference_signed_urls.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 참고 이미지가 없습니다.</p>
        ) : (
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
        )}
      </div>

      {/* 취소 버튼 */}
      {isCancellable(order.status) && (
        <div className="mt-8 border-t pt-6">
          <CancelOrderButton orderId={order.id} status={order.status} />
        </div>
      )}
    </div>
  );
}


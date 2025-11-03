import { getMyCustomOrders } from "@/actions/custom-order";
import { CustomOrderList } from "@/components/custom-order-list";
import type { CustomOrderStatus } from "@/types/custom-order";

/**
 * @file app/my-custom-orders/page.tsx
 * @description 나의 주문제작 내역 목록 페이지 (Server Component)
 */

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function MyCustomOrdersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const statusFilter = (searchParams.status || "all") as CustomOrderStatus | "all";

  const orders = await getMyCustomOrders(statusFilter);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">나의 주문제작 내역</h1>
      <CustomOrderList initialOrders={orders} initialStatus={statusFilter} />
    </div>
  );
}


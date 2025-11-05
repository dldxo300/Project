/**
 * @file components/category-section.tsx
 * @description 카테고리별 상품 섹션 컴포넌트
 * 
 * 이 컴포넌트는 특정 카테고리의 상품들을 그리드 형태로 표시합니다.
 * "더보기" 버튼을 통해 섹션을 접고 펼칠 수 있습니다.
 * 
 * 주요 기능:
 * 1. 카테고리명 헤더 표시
 * 2. 상품 카드 그리드 레이아웃
 * 3. 더보기/접기 토글 기능
 * 4. 접힌 상태에서는 상품 숨김
 * 
 * @dependencies
 * - @/components/product-card: 상품 카드 컴포넌트
 * - @/components/ui/button: shadcn/ui Button 컴포넌트
 * - @/types/product: 상품 타입
 */

"use client";

import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import type { Category, ProductWithCategory } from "@/types/product";
import { CATEGORY_LABEL } from "@/types/product";

interface CategorySectionProps {
  category: Category;
  products: ProductWithCategory[];
  /**
   * 초기 펼침 상태 (기본값: true)
   */
  defaultExpanded?: boolean;
}

/**
 * 카테고리별 상품 섹션 컴포넌트
 * 
 * 상태 관리를 위해 Client Component로 구현
 */
export function CategorySection({
  category,
  products,
  defaultExpanded = true,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 카테고리 한글 레이블
  const categoryLabel = CATEGORY_LABEL[category.name] || category.name;

  // 토글 핸들러
  const handleToggle = () => {
    console.log("🔄 [CategorySection] 토글 상태 변경:", {
      category: categoryLabel,
      from: isExpanded,
      to: !isExpanded,
    });
    setIsExpanded(!isExpanded);
  };

  // 상품이 없으면 렌더링하지 않음
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* 카테고리 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {categoryLabel}
          </h2>
          {category.description && (
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>

        {/* 더보기/접기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="flex items-center gap-2"
        >
          <span>{isExpanded ? "접기" : "더보기"}</span>
          {isExpanded ? (
            <LuChevronUp className="w-4 h-4" />
          ) : (
            <LuChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* 상품 그리드 */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* 접힌 상태 메시지 */}
      {!isExpanded && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {products.length}개의 상품이 있습니다. &quot;더보기&quot;를 클릭하여 확인하세요.
        </p>
      )}
    </section>
  );
}


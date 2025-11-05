/**
 * @file app/page.tsx
 * @description 홈페이지 (메인 페이지)
 * 
 * 이 페이지는 플랫폼의 메인 랜딩 페이지입니다.
 * 
 * 주요 섹션:
 * 1. 히어로 섹션: 플랫폼 소개 및 주문제작 CTA
 * 2. 최신 상품 섹션: 최근 등록된 상품 6-8개
 * 3. 카테고리별 추천 섹션: 주요 카테고리별 상품 (더보기 기능)
 * 4. 하단 CTA: 주문제작 유도
 * 
 * @dependencies
 * - @/actions/product: 상품 데이터 페칭
 * - @/components/product-card: 상품 카드
 * - @/components/category-section: 카테고리 섹션
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LuSparkles, LuArrowRight } from "react-icons/lu";
import { getLatestProducts, getAllCategories, getProductsByCategory } from "@/actions/product";
import { ProductCard } from "@/components/product-card";
import { CategorySection } from "@/components/category-section";
import { MAIN_CATEGORIES } from "@/types/product";

export default async function Home() {
  console.log("🏠 [HomePage] 홈페이지 렌더링 시작");

  // 최신 상품 조회
  const latestProducts = await getLatestProducts(8);
  console.log("📦 [HomePage] 최신 상품 조회 완료:", latestProducts.length);

  // 모든 카테고리 조회
  const allCategories = await getAllCategories();
  console.log("📂 [HomePage] 카테고리 조회 완료:", allCategories.length);

  // 주요 카테고리의 상품 조회
  const mainCategoryData = await Promise.all(
    allCategories
      .filter((cat) => MAIN_CATEGORIES.includes(cat.name))
      .map(async (category) => ({
        category,
        products: await getProductsByCategory(category.id, 4),
      }))
  );

  // 나머지 카테고리의 상품 조회
  const otherCategoryData = await Promise.all(
    allCategories
      .filter((cat) => !MAIN_CATEGORIES.includes(cat.name))
      .map(async (category) => ({
        category,
        products: await getProductsByCategory(category.id, 4),
      }))
  );

  console.log("✅ [HomePage] 모든 데이터 로드 완료");

  return (
    <main className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-b from-background to-muted/20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* 아이콘 */}
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                <LuSparkles className="w-10 h-10" />
              </div>
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              나만의 피규어 제작 플랫폼
            </h1>

            {/* 서브 타이틀 */}
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              사진 한 장으로 시작하는
              <br className="hidden sm:block" />
              세상에 하나뿐인 피규어
            </p>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/custom-order">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  <LuSparkles className="w-5 h-5 mr-2" />
                  주문제작 시작하기
                </Button>
              </Link>
              <Link href="#latest-products">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                  작품 둘러보기
                  <LuArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* 안내 텍스트 */}
            <p className="text-sm text-muted-foreground pt-4">
              AI 기술과 전문 작가의 손길로 특별한 피규어를 만들어드립니다
            </p>
          </div>
        </div>
      </section>

      {/* 최신 상품 섹션 */}
      <section id="latest-products" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                최신 작품
              </h2>
              <p className="text-muted-foreground">
                최근에 등록된 새로운 작품들을 만나보세요
              </p>
            </div>
            {/* Phase 4.2에서 구현 예정 */}
            {/* <Link href="/products">
              <Button variant="ghost">
                모든 상품 보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link> */}
          </div>

          {latestProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>아직 등록된 상품이 없습니다.</p>
              <p className="text-sm mt-2">첫 주문제작을 시작해보세요!</p>
            </div>
          )}
        </div>
      </section>

      {/* 카테고리별 추천 섹션 - 주요 카테고리 */}
      {mainCategoryData.filter((item) => item.products.length > 0).length > 0 && (
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                카테고리별 추천
              </h2>
              <p className="text-muted-foreground">
                다양한 카테고리의 작품들을 살펴보세요
              </p>
            </div>

            {mainCategoryData
              .filter((item) => item.products.length > 0)
              .map((item) => (
                <CategorySection
                  key={item.category.id}
                  category={item.category}
                  products={item.products}
                  defaultExpanded={true}
                />
              ))}
          </div>
        </section>
      )}

      {/* 카테고리별 추천 섹션 - 나머지 카테고리 (기본 접힌 상태) */}
      {otherCategoryData.filter((item) => item.products.length > 0).length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {otherCategoryData
              .filter((item) => item.products.length > 0)
              .map((item) => (
                <CategorySection
                  key={item.category.id}
                  category={item.category}
                  products={item.products}
                  defaultExpanded={false}
                />
              ))}
          </div>
        </section>
      )}

      {/* 하단 CTA 섹션 */}
      <section className="py-20 md:py-32 bg-primary/5 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            당신만의 피규어를
            <br />
            만들어보세요
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            특별한 순간을 담은 사진 한 장이면 충분합니다
          </p>
          <Link href="/custom-order">
            <Button size="lg" className="text-lg px-10 py-7 h-auto">
              <LuSparkles className="w-5 h-5 mr-2" />
              지금 바로 시작하기
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

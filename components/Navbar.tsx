/**
 * @file components/Navbar.tsx
 * @description 네비게이션 바 컴포넌트
 * 
 * 플랫폼의 메인 네비게이션 바입니다.
 * 
 * 주요 기능:
 * 1. 브랜드 로고 및 홈 링크
 * 2. 주요 페이지 네비게이션 링크
 * 3. 로그인/로그아웃 상태별 메뉴 표시
 * 4. 사용자 프로필 버튼
 */

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { LuSparkles } from "react-icons/lu";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
        {/* 브랜드 로고 */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
          <LuSparkles className="w-6 h-6 text-primary" />
          <span className="hidden sm:inline">나만의 피규어</span>
          <span className="sm:hidden">피규어</span>
        </Link>

        {/* 네비게이션 링크 */}
        <nav className="flex gap-2 md:gap-4 items-center">
          {/* 로그아웃 상태 */}
          <SignedOut>
            <Link href="/" className="hidden md:inline">
              <Button variant="ghost" size="sm">
                홈
              </Button>
            </Link>
            <SignInButton mode="modal">
              <Button size="sm">로그인</Button>
            </SignInButton>
          </SignedOut>

          {/* 로그인 상태 */}
          <SignedIn>
            <Link href="/" className="hidden lg:inline">
              <Button variant="ghost" size="sm">
                홈
              </Button>
            </Link>
            {/* Phase 4.2에서 구현 예정 */}
            {/* <Link href="/products" className="hidden lg:inline">
              <Button variant="ghost" size="sm">
                상품 둘러보기
              </Button>
            </Link> */}
            <Link href="/custom-order">
              <Button variant="default" size="sm" className="hidden md:flex">
                <LuSparkles className="w-4 h-4 mr-1" />
                주문제작
              </Button>
              <Button variant="default" size="sm" className="md:hidden">
                주문
              </Button>
            </Link>
            <Link href="/my-custom-orders">
              <Button variant="outline" size="sm" className="hidden md:inline">
                나의 주문
              </Button>
            </Link>
            <Link href="/admin/custom-orders">
              <Button variant="outline" size="sm" className="hidden md:inline">
                관리자
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

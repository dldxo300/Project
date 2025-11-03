import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-bold">
        SaaS Template
      </Link>
      <div className="flex gap-4 items-center">
        <SignedOut>
          <SignInButton mode="modal">
            <Button>로그인</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/custom-order">
            <Button variant="outline" size="sm">
              주문제작
            </Button>
          </Link>
          <Link href="/my-custom-orders">
            <Button variant="outline" size="sm">
              나의 주문제작
            </Button>
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;

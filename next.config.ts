import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
  serverActions: {
    bodySizeLimit: "10mb", // 이미지 업로드를 위해 10MB로 증가
  },
};

export default nextConfig;

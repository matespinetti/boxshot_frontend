import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const origin = new URL(apiUrl).origin;
    return [
      {
        source: "/static/:path*",
        destination: `${origin}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;

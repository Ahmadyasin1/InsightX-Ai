import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const isVercel = process.env.VERCEL === "1";

if (isVercel && !apiUrl) {
  console.warn(
    "\n⚠️  [InsightX] NEXT_PUBLIC_API_URL is not set on Vercel.\n" +
      "   The site will deploy, but API calls (login, upload, chat) will fail until you add it\n" +
      "   in Project Settings → Environment Variables and redeploy.\n"
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async rewrites() {
    if (apiUrl) {
      return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
    }
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

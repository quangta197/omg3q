import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [384, 480, 640, 768, 1024, 1280],
    imageSizes: [48, 64, 72, 96, 128, 160, 240, 320],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/accounts/vip-:level(\\d+)",
        destination: "/accounts/vip/:level",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

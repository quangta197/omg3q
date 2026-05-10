import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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

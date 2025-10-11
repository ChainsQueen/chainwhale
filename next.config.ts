import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/chainwhale',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
// Only use static export when explicitly building for GitHub Pages
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Only use static export when explicitly requested
  // This allows API routes to work in development and standard deployments
  ...(isStaticExport ? { output: 'export' } : {}),
  basePath: isProd && isStaticExport ? '/chainwhale' : '',
  images: {
    unoptimized: true,
  },
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;

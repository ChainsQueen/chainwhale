import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  // Only use static export for GitHub Pages deployment
  // For development and Vercel, we need API routes
  ...(isGitHubPages ? { output: 'export' } : {}),
  basePath: isProd && isGitHubPages ? '/chainwhale' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

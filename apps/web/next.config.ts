import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vj/ar-engine', '@vj/shared', '@vj/types'],
};

export default nextConfig;

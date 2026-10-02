import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vj/shared', '@vj/types'],
};

export default nextConfig;

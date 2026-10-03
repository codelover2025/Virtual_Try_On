import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@vj/shared',
    '@vj/types',
    '@vj/ui',
    '@vj/hooks',
    '@vj/api-client',
  ],
};

export default nextConfig;

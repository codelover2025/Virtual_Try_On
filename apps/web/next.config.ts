import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vj/ar-engine', '@vj/shared', '@vj/types'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prefer browser builds for TF.js
    };
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;

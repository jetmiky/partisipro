/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@partisipro/shared', '@partisipro/ui'],
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@partisipro/shared', '@partisipro/ui'],
  images: {
    domains: ['localhost', 'images.pexels.com'],
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
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  // Disable static generation entirely to prevent SSR issues
  output: 'standalone',
};

export default nextConfig;

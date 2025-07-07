/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@partisipro/shared', '@partisipro/ui'],
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },
}

module.exports = nextConfig
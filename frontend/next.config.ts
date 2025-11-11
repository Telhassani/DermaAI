import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },

  // Experimental features
  experimental: {
    // Enable partial prerendering
    ppr: false,
  },

  // Output configuration
  output: 'standalone',

  // TypeScript configuration
  typescript: {
    // Ignore type errors in production build (not recommended for production)
    // ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't run ESLint during build (run separately in CI)
    ignoreDuringBuilds: false,
  },
}

export default nextConfig

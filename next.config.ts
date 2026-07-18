import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development checks
  reactStrictMode: true,

  // Optimize images for Vercel's CDN
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Enable gzip/brotli compression
  compress: true,

  // Powered-by header removal for security
  poweredByHeader: false,

  // Production source maps disabled for faster builds
  productionBrowserSourceMaps: false,

  // Optimize package imports for tree-shaking
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'gsap',
    ],
  },

  // Advanced HTTP headers for caching and security
  async headers() {
    return [

      {
        // Images - long cache (30 days)
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        // Fonts - immutable cache
        source: '/:path*.woff2',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API routes - short cache with revalidation
        source: '/api/resorts',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        // All pages - security headers
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict mode for better type checking
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't ignore ESLint during builds
    ignoreDuringBuilds: false,
  },
  // Image optimization
  images: {
    domains: [], // Add domains if needed for external images
    formats: ['image/webp', 'image/avif'],
  },
  // Note: API body parser config is handled in individual API routes
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Webpack configuration for better performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure experimental features are properly configured for Cloudflare
  experimental: {
    // Enable the new App Router (already using this)
    appDir: true,
  },
  
  // Image optimization configuration for Cloudflare
  images: {
    unoptimized: true, // Required for Cloudflare deployment
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.tcgplayer.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', 
        hostname: '**.cardmarket.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ebay.com', 
        port: '',
        pathname: '/**',
      }
    ],
  },

  // Output configuration for Cloudflare compatibility
  output: 'standalone',
  
  // Disable server-side telemetry for better performance
  telemetry: {
    disabled: true,
  },

  // Environment variable configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300', // Cache API responses
          },
        ],
      },
    ];
  },

  // Redirects for better SEO (if needed)
  async redirects() {
    return [
      // Example redirect - customize as needed
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },

  // Webpack configuration optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimization for Cloudflare Workers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;

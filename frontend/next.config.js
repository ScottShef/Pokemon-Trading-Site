/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization configuration for Cloudflare
  images: {
    unoptimized: true,
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

  // Disable server-side telemetry for better performance
  telemetry: {
    disabled: true,
  },

  // Webpack configuration optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimization for Cloudflare
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

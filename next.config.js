/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      's3.eu-central-2.wasabisys.com',
      'images.unsplash.com',
      'plus.unsplash.com'
    ],
  },
  // Configuration pour éviter les erreurs ChunkLoadError
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Améliorer la stabilité en mode développement
      config.optimization.runtimeChunk = 'single';
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
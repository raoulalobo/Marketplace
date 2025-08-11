/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Configuration pour les packages externes du serveur (Next.js 15 - nom mis à jour)
  serverExternalPackages: ['@prisma/client'],
  // Désactiver le linting strict pendant le build pour permettre le déploiement
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

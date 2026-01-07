import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image configuration for external assets
  images: {
    remotePatterns: [
      // Vendure Engine - Development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/assets/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/assets/**',
      },
      // Vendure Engine - Production (Server IP)
      {
        protocol: 'http',
        hostname: '34.18.154.179',
        port: '3001',
        pathname: '/assets/**',
      },
      // Vendure Engine - Production (Domain)
      {
        protocol: 'https',
        hostname: 'kitvet.com',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: '*.kitvet.com',
        pathname: '/assets/**',
      },
      // Allow any HTTPS image (for fallback)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

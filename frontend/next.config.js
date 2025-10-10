// frontend/next.config.js
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_BACKEND_URL + '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Usa URL de Render por defecto para producción
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://plataforma-cumplimiento-mvp.onrender.com';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
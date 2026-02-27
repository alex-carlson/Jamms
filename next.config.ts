import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), clipboard-read=(self), clipboard-write=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval'
                https://apis.google.com
                https://www.gstatic.com
                https://accounts.google.com
                https://www.youtube.com;
              style-src 'self' 'unsafe-inline'
                https://fonts.googleapis.com
                https://accounts.google.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: http:;
              connect-src 'self'
                https://www.googleapis.com
                https://accounts.google.com
                https://www.youtube.com
                https://www.youtube-nocookie.com
                https://*.supabase.co;
              frame-src 'self'
                https://accounts.google.com
                https://www.youtube.com
                https://www.youtube-nocookie.com;
              object-src 'none';
              base-uri 'self';
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ];
  },
  // Enable experimental features for better iframe support
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
  },
};

export default nextConfig;

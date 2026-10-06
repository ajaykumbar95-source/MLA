const IS_PROD = process.env.NODE_ENV === 'production';

const CORS_ORIGIN_FIRST = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)[0] || '*';

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: IS_PROD ? 'SAMEORIGIN' : 'ALLOWALL',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Content-Security-Policy',
    value: IS_PROD
      ? "default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';"
      : "default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors *;",
  },
];

const corsHeaders = [
  {
    key: 'Access-Control-Allow-Origin',
    value: CORS_ORIGIN_FIRST,
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization',
  },
  {
    key: 'Access-Control-Allow-Credentials',
    value: 'true',
  },
  {
    key: 'Access-Control-Max-Age',
    value: '86400',
  },
];

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
    ],
  },
  serverExternalPackages: ['pg'],
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          ...corsHeaders,
        ],
      },
    ];
  },
};

module.exports = nextConfig;

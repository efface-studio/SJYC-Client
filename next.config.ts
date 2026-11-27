import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.SJYC_RELEASE_BUILD === '1' ? { output: 'standalone' as const } : {}),
  // 개발 표시기가 모바일 하단 탭바를 가린다 (오류 오버레이는 그대로 표시됨)
  devIndicators: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'sjyc\\.efface\\.dev' },
          { type: 'header', key: 'x-forwarded-proto', value: 'http' },
        ],
        destination: 'https://sjyc.efface.dev/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
            : []),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();

  const nonce = randomBytes(16).toString('base64');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const apiOrigin = apiBase && /^https?:\/\//i.test(apiBase) ? new URL(apiBase).origin : '';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "media-src 'self'",
    `connect-src 'self' ${apiOrigin}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  // Next.js가 이 응답의 인라인 부트스트랩과 스크립트 태그에 같은 nonce를 붙인다.
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  const responseHeader =
    process.env.SJYC_CSP_MODE === 'report-only'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
  response.headers.set(responseHeader, policy);
  return response;
}

export const config = {
  matcher: ['/((?!_next/|api/|favicon\\.ico$|media/|brand/|oss/|fonts/).*)'],
};

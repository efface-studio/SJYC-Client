'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/** 예상하지 못한 렌더링 오류 — 내부 오류 내용은 화면에 노출하지 않는다 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: 운영 시 오류 추적 도구(예: Sentry, CloudWatch RUM)로 전송. 개인정보는 포함하지 않는다.
    console.error(error.digest ?? error.name);
  }, [error]);

  return (
    <main
      id="main"
      className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center"
    >
      <h1 className="text-2xl font-bold">일시적인 문제가 발생했습니다</h1>
      <p className="mt-2 text-[15px] text-ink-600">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 센터로 문의해 주세요.
      </p>
      <Button size="lg" className="mt-6" onClick={reset}>
        다시 시도
      </Button>
    </main>
  );
}

'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/api/errors';
import { ToastProvider } from '@/components/ui/toast';
import { SESSION_KEY } from '@/features/auth/session';

/** 4xx 는 재시도해도 결과가 같으므로 재시도하지 않는다 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.code !== 'NETWORK' && error.code !== 'SERVER') return false;
  return failureCount < 2;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    // 어떤 요청이든 UNAUTHENTICATED 를 받으면 세션을 다시 확인 → 보호 화면이 재인증으로 안내한다
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
        void qc.invalidateQueries({ queryKey: SESSION_KEY });
      }
    };
    const qc: QueryClient = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: { retry: shouldRetry, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    return qc;
  });

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

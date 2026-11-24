'use client';

import { useEffect, useRef, useState } from 'react';
import './login-feedback.css';

type Phase = 'idle' | 'loading' | 'success' | 'error';

export function useLoginFeedback() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  return {
    phase,
    attempt,
    edit() {
      if (phase === 'error') setPhase('idle');
    },
    start() {
      setPhase('loading');
    },
    fail() {
      setAttempt((n) => n + 1);
      setPhase('error');
    },
    finish(navigate: () => void) {
      if (!mounted.current) return;
      setPhase('success');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navigate();
        return;
      }
      timer.current = setTimeout(navigate, 400);
    },
  };
}

export function LoginSubmit({
  phase,
  attempt,
  title,
  disabled,
}: {
  phase: Phase;
  attempt: number;
  title: string;
  disabled?: boolean;
}) {
  const busy = phase === 'loading';
  const label = busy
    ? '확인 중'
    : phase === 'success'
      ? '로그인 완료'
      : phase === 'error'
        ? '다시 시도'
        : title;
  return (
    <button
      type="submit"
      className="login-submit"
      data-phase={phase}
      disabled={disabled || busy || phase === 'success'}
      aria-busy={busy || undefined}
    >
      {busy && <span className="login-sweep" aria-hidden />}
      <span aria-live="polite" aria-atomic="true">
        <span className="login-result" key={phase + attempt}>
          {busy && (
            <span className="login-dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          )}
          {phase === 'success' && (
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 10.25 8 14.5 16.5 5.75" />
            </svg>
          )}
          {label}
        </span>
      </span>
    </button>
  );
}

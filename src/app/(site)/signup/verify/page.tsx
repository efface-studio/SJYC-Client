'use client';
import { useId, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { api, errorMessage } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button, buttonClass } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { useSignupPhone } from '@/features/auth/use-signup-phone';
import { SESSION_KEY } from '@/features/auth/session';
import { memberRedirect } from '@/lib/safe-redirect';
import './phone.css';

export default function VerifyPhonePage() {
  const f = useSignupPhone(
      typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
    id = useId(),
    ref = useRef<HTMLInputElement>(null),
    cache = useQueryClient(),
    router = useRouter();
  const [done, setDone] = useState(false);
  const success = f.verify.isSuccess;
  useEffect(() => {
    if (!success) return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1250;
    const timer = setTimeout(() => setDone(true), delay);
    return () => clearTimeout(timer);
  }, [success]);
  const data = f.state.data;
  const phase = success ? 'success' : f.verify.isPending ? 'verifying' : f.verify.isError ? 'error' : 'idle';
  return (
    <main className="phone-verify">
      <title>휴대전화 인증 | 중구청소년센터</title>
      {done ? (
        <>
          <div className="phone-check final">
            <Check aria-hidden />
          </div>
          <h1>가입이 완료되었습니다</h1>
          {f.verify.data?.signedIn ? (
            <Button
              block
              onClick={async () => {
                const session = await api.auth.me();
                if (session) cache.setQueryData(SESSION_KEY, session);
                router.replace(memberRedirect(new URLSearchParams(window.location.search).get('next')));
              }}
            >
              계속하기
            </Button>
          ) : (
            <Link className={buttonClass({ size: 'lg' })} href="/login">
              로그인하기
            </Link>
          )}
        </>
      ) : (
        <>
          <h1>휴대전화 인증</h1>
          {f.state.isPending ? (
            <p role="status">인증 요청을 확인하고 있어요.</p>
          ) : f.state.isError || !data ? (
            <>
              <p role="alert">{errorMessage(f.state.error)}</p>
              <Link href="/signup">회원가입으로 돌아가기</Link>
            </>
          ) : f.editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                f.resend(true);
              }}
            >
              <TextField
                type="tel"
                label="새 휴대전화 번호"
                value={f.number}
                autoComplete="tel-national"
                onChange={(e) => f.setNumber(e.target.value)}
                required
                autoFocus
              />
              <p role="alert">{f.error}</p>
              <Button
                block
                type="submit"
                disabled={!f.canChange || f.send.isPending}
                loading={f.send.isPending}
              >
                새 번호로 코드 받기
              </Button>
              <button type="button" disabled={f.send.isPending} onClick={f.cancel}>
                취소
              </button>
            </form>
          ) : (
            <>
              <div>
                <strong>{data.phone}</strong>
                <button
                  className="phone-edit"
                  onClick={f.edit}
                  disabled={success || f.verify.isPending || f.send.isPending}
                >
                  번호 변경
                </button>
              </div>
              <p id={id + '-hint'}>
                {data.verificationMode === 'preview'
                  ? '테스트 코드 284600을 입력해 주세요.'
                  : '문자로 받은 6자리 코드를 입력해 주세요.'}
              </p>
              <label htmlFor={id}>인증 코드</label>
              <div className="phone-otp" data-phase={phase} aria-busy={f.verify.isPending}>
                <input
                  ref={ref}
                  id={id}
                  value={f.code}
                  onChange={(e) => f.input(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    f.input(e.clipboardData.getData('text'));
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-describedby={id + '-hint'}
                  aria-invalid={f.verify.isError}
                  readOnly={success || f.verify.isPending || f.send.isPending}
                />
                {Array.from({ length: 6 }, (_, i) => (
                  <span
                    aria-hidden
                    key={i}
                    data-current={i === Math.min(f.code.length, 5)}
                    style={
                      {
                        '--index': i,
                        '--travel': (2.5 - i) * 100 + '%',
                        '--gap-travel': (2.5 - i) * 6 + 'px',
                      } as CSSProperties
                    }
                  >
                    {f.code[i]}
                  </span>
                ))}
                {success && (
                  <div className="phone-check">
                    <Check />
                  </div>
                )}
              </div>
              <p role="status" className="phone-feedback">
                {f.error ??
                  (success
                    ? '인증됐어요.'
                    : f.verify.isPending
                      ? '코드 확인 중…'
                      : f.expired
                        ? '입력 시간이 지났어요. 새 코드를 받아 주세요.'
                        : f.send.isSuccess
                          ? '새 코드를 요청했어요.'
                          : '')}
              </p>
              <div className="phone-resend">
                <span>코드가 오지 않았나요?</span>
                <button
                  type="button"
                  onClick={() => f.resend(false)}
                  disabled={!!f.remaining || f.send.isPending || f.verify.isPending || success}
                >
                  {f.send.isPending ? '요청 중…' : f.remaining ? f.remaining + '초 후 재발송' : '코드 재발송'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

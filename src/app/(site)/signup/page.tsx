'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormError, PasswordField, TextField } from '@/components/ui/field';
import { Callout } from '@/components/ui/states';
import { CENTER } from '@/config/center';
import { parseForm, signupSchema, type FieldErrors } from '@/domain/schemas';
import { PENDING_VERIFY_KEY } from '@/features/auth/session';

/** 만 14세 미만은 법정대리인 동의가 필요 — 정확한 판단(생년월일 기준)과 절차는 법률·운영 검토 후 서버에서 확정 */
const MIN_SELF_CONSENT_AGE = 14;

/** 가입 중 입력값을 잃지 않도록 정책 문서는 새 탭으로 연다 */
function PolicyLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="font-semibold underline">
      {children}
      <span className="sr-only">(새 탭)</span>
    </a>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const signup = useMutation({
    mutationFn: api.auth.signup,
    onSuccess: (_res, input) => {
      sessionStorage.setItem(PENDING_VERIFY_KEY, input.email);
      router.push('/signup/verify');
    },
    onError: (error) => {
      if (isApiError(error) && error.fieldErrors) setErrors(error.fieldErrors);
      setFormError(errorMessage(error));
    },
  });

  const setAll = (checked: boolean) => {
    for (const name of ['agreeTerms', 'agreePrivacy', 'agreeMarketing']) {
      const el = formRef.current?.elements.namedItem(name);
      if (el instanceof HTMLInputElement) el.checked = checked;
    }
  };

  return (
    <div className="container-page py-8 md:py-14">
      <title>회원가입 | 중구청소년센터</title>
      <div className="account-sheet mx-auto">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="mt-1 mb-6 text-[15px] text-ink-600">
          가입 후 프로그램 신청과 동아리 가입 신청을 할 수 있습니다.
        </p>

        <form
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (signup.isPending) return;
            setFormError(null);
            const parsed = parseForm(signupSchema, new FormData(e.currentTarget));
            if (!parsed.ok) {
              setErrors(parsed.errors);
              return;
            }
            if (new Date().getFullYear() - parsed.data.birthYear < MIN_SELF_CONSENT_AGE) {
              setErrors({
                birthYear: `만 ${MIN_SELF_CONSENT_AGE}세 미만은 법정대리인 동의가 필요합니다. 센터(${CENTER.tel})로 문의해 주세요.`,
              });
              return;
            }
            setErrors({});
            signup.mutate(parsed.data);
          }}
          className="space-y-4"
        >
          <TextField label="이름" name="name" autoComplete="name" required error={errors.name} />
          <TextField
            label="이메일"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            hint="로그인 아이디로 사용하며, 인증 메일을 보내 드립니다."
            error={errors.email}
          />
          <PasswordField
            label="비밀번호"
            name="password"
            autoComplete="new-password"
            required
            hint="8~64자, 영문과 숫자를 포함해 주세요."
            error={errors.password}
          />
          <PasswordField
            label="비밀번호 확인"
            name="passwordConfirm"
            autoComplete="new-password"
            required
            error={errors.passwordConfirm}
          />
          <TextField
            label="출생 연도"
            name="birthYear"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="예) 2009"
            required
            hint="청소년 대상 프로그램 안내에 사용합니다."
            error={errors.birthYear}
          />

          <fieldset className="rounded-md border border-line p-4">
            <legend className="px-1 text-[15px] font-bold">약관 동의</legend>
            <CheckboxField
              label={<strong>전체 동의 (선택 항목 포함)</strong>}
              onChange={(e) => setAll(e.currentTarget.checked)}
            />
            <div className="mt-1 border-t border-line pt-2">
              <CheckboxField
                name="agreeTerms"
                label={
                  <>
                    [필수] <PolicyLink href="/policies/terms">이용약관</PolicyLink> 동의
                  </>
                }
                error={errors.agreeTerms}
              />
              <CheckboxField
                name="agreePrivacy"
                label={
                  <>
                    [필수] <PolicyLink href="/policies/privacy">개인정보 수집·이용</PolicyLink> 동의
                  </>
                }
                error={errors.agreePrivacy}
              />
              <CheckboxField name="agreeMarketing" label="[선택] 프로그램 소식 안내 수신 동의" />
            </div>
          </fieldset>

          <Callout tone="info">
            만 14세 미만은 법정대리인 동의 절차가 필요합니다. 온라인 동의 절차가 준비되기 전까지 센터로 문의해
            주세요.
          </Callout>

          <FormError message={formError} />
          <Button type="submit" size="lg" block loading={signup.isPending}>
            가입하기
          </Button>
        </form>

        <p className="mt-6 text-center text-[15px] text-ink-700">
          이미 계정이 있나요?{' '}
          <Link href="/login" className="font-semibold text-brand-700 underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

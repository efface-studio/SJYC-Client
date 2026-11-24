'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormError, PasswordField, TextField } from '@/components/ui/field';
import { birthDateError, confirmFeedback, earliestBirthDate } from '@/domain/signup-feedback';
import { SignupEmailField } from '@/features/auth/signup-email-field';
import { SignupPasswordRules } from '@/features/auth/signup-password-rules';
import { todayKst } from '@/lib/format';
import { parseForm, signupSchema, type FieldErrors } from '@/domain/schemas';
import { PENDING_VERIFY_KEY } from '@/features/auth/session';

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

  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const match = confirmFeedback(password, confirmation);

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
          method="post"
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (signup.isPending) return;
            setFormError(null);
            const form = new FormData(e.currentTarget);
            const selected = String(form.get('birthDate') ?? '');
            const dateError = birthDateError(selected, todayKst());
            form.set('birthYear', selected.slice(0, 4));
            const parsed = parseForm(signupSchema, form);
            if (!parsed.ok || dateError) {
              setErrors({ ...(!parsed.ok && parsed.errors), birthYear: dateError ?? '' });
              return;
            }
            setErrors({});
            signup.mutate(parsed.data);
          }}
          className="space-y-4"
        >
          <TextField label="이름" name="name" autoComplete="name" required error={errors.name} />
          <SignupEmailField error={errors.email} onEdit={() => setErrors((old) => ({ ...old, email: '' }))} />
          <div>
            <PasswordField
              label="비밀번호"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((old) => ({ ...old, password: '', passwordConfirm: '' }));
              }}
              aria-describedby="signup-password-rules"
              error={errors.password}
            />
            <SignupPasswordRules password={password} />
          </div>
          <PasswordField
            label="비밀번호 확인"
            name="passwordConfirm"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => {
              setConfirmation(e.target.value);
              setErrors((old) => ({ ...old, passwordConfirm: '' }));
            }}
            hint={match === '일치합니다.' ? match : undefined}
            error={errors.passwordConfirm || (match !== '일치합니다.' ? match : undefined)}
          />
          <TextField
            label="생년월일"
            type="date"
            name="birthDate"
            autoComplete="bday"
            min={earliestBirthDate}
            max={todayKst()}
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setErrors((old) => ({ ...old, birthYear: '' }));
            }}
            required
            error={errors.birthYear}
          />

          <TextField
            label="휴대전화 (선택)"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="010-1234-5678"
            error={errors.phone}
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

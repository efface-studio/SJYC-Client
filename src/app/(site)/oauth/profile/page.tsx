'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormError, TextField } from '@/components/ui/field';
import type { SocialDraft } from '@/domain/social-profile';
import { memberRedirect } from '@/lib/safe-redirect';
import { todayKst } from '@/lib/format';

function ProfileForm({ draft }: { draft: SocialDraft }) {
  const router = useRouter();
  const [name, setName] = useState(draft.name),
    [email, setEmail] = useState(draft.email),
    [phone, setPhone] = useState(draft.phone),
    [birthDate, setBirthDate] = useState(draft.birthDate);
  const [terms, setTerms] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [marketing, setMarketing] = useState(false);
  const address = email.trim().toLowerCase();
  const save = useMutation({
    mutationFn: api.auth.saveSocialProfile,
    onSuccess: () =>
      router.replace(
        '/signup/verify?next=' +
          encodeURIComponent(memberRedirect(new URLSearchParams(window.location.search).get('next'))),
      ),
  });
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!save.isPending)
          save.mutate({
            name,
            email: address,
            phone,
            birthDate,
            agreeTerms: terms,
            agreePrivacy: privacy,
            agreeMarketing: marketing,
          });
      }}
    >
      <TextField
        label="이름"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        minLength={2}
        maxLength={20}
      />
      <TextField
        label="휴대전화"
        required
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <TextField
        label="생년월일"
        required
        type="date"
        autoComplete="bday"
        min="1920-01-01"
        max={todayKst()}
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />
      <TextField
        label="이메일"
        required
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
      />
      {draft.needsConsent && (
        <fieldset className="border-t border-line pt-3">
          <legend className="font-bold">약관 동의</legend>
          <CheckboxField
            required
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            label={
              <span>
                [필수]{' '}
                <Link href="/policies/terms" target="_blank" className="underline">
                  이용약관
                </Link>{' '}
                동의
              </span>
            }
          />
          <CheckboxField
            required
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            label={
              <span>
                [필수]{' '}
                <Link href="/policies/privacy" target="_blank" className="underline">
                  개인정보 수집·이용
                </Link>{' '}
                동의
              </span>
            }
          />
          <CheckboxField
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            label="[선택] 프로그램 소식 수신"
          />
        </fieldset>
      )}
      <FormError message={save.isError ? errorMessage(save.error) : null} />
      <Button type="submit" size="lg" loading={save.isPending}>
        확인하고 계속하기
      </Button>
    </form>
  );
}
export default function SocialProfilePage() {
  const query = useQuery({
    queryKey: ['oauth-onboarding'],
    queryFn: api.auth.socialDraft,
    retry: false,
    gcTime: 0,
  });
  return (
    <main className="container-page py-10">
      <div className="account-sheet mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-bold">회원 정보 확인</h1>
        {query.isPending ? (
          <p role="status">정보를 불러오는 중입니다.</p>
        ) : query.isError ? (
          <>
            <p role="alert">{errorMessage(query.error)}</p>
            <Link className="underline" href="/login">
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-ink-600">
              가져온 정보는 수정할 수 있습니다. 비어 있는 항목을 입력해 주세요.
            </p>
            <ProfileForm draft={query.data} />
          </>
        )}
      </div>
    </main>
  );
}

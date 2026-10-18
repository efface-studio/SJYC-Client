'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button, buttonClass } from '@/components/ui/button';
import { CheckboxField, FormError, TextField } from '@/components/ui/field';
import { Callout } from '@/components/ui/states';
import { parseForm, withdrawSchema, type FieldErrors } from '@/domain/schemas';

export default function WithdrawPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const withdraw = useMutation({ mutationFn: () => api.me.withdraw() });

  if (withdraw.isSuccess) {
    // 세션 캐시를 여기서 비우면 RequireAuth 가 결과 안내 전에 로그인 화면으로 보낸다.
    // 서버 세션은 이미 종료됐으므로, 안내 후 전체 새로고침(<a href>)으로 캐시를 함께 정리한다.
    return (
      <Callout tone="info" title="탈퇴가 완료되었습니다">
        그동안 이용해 주셔서 감사합니다.{' '}
        <a href="/" className="font-semibold underline">
          홈으로 이동
        </a>
      </Callout>
    );
  }

  return (
    <>
      <title>회원 탈퇴 | 중구청소년센터</title>
      <h2 className="text-xl font-bold">회원 탈퇴</h2>
      <Callout tone="warning" className="mt-4" title="탈퇴 전에 확인해 주세요">
        <ul className="list-disc pl-5">
          <li>진행 중인 프로그램 신청과 동아리 활동 정보는 더 이상 확인할 수 없습니다.</li>
          <li>관계 법령·운영 정책에 따라 일정 기간 보관해야 하는 정보는 해당 기간 후 파기됩니다.</li>
          <li>같은 이메일로 다시 가입할 수 있는 시점은 운영 정책에 따릅니다.</li>
        </ul>
      </Callout>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (withdraw.isPending) return;
          const parsed = parseForm(withdrawSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          withdraw.mutate();
        }}
        className="mt-6 space-y-4"
      >
        <TextField
          label='확인을 위해 "탈퇴합니다"를 입력해 주세요'
          name="confirmText"
          autoComplete="off"
          required
          error={errors.confirmText}
        />
        <CheckboxField
          name="agreeWithdraw"
          label="위 내용을 확인했으며 탈퇴에 동의합니다."
          error={errors.agreeWithdraw}
        />
        <FormError message={withdraw.isError ? errorMessage(withdraw.error) : null} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Link href="/my/profile" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            취소
          </Link>
          <Button type="submit" variant="destructive" size="lg" loading={withdraw.isPending}>
            탈퇴하기
          </Button>
        </div>
      </form>
    </>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Button, buttonClass } from '@/components/ui/button';
import { CheckboxField, FormError, TextAreaField, TextField } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Callout, ErrorState, ListSkeleton } from '@/components/ui/states';
import { parseForm, programApplySchema, type FieldErrors } from '@/domain/schemas';
import { RequireAuth } from '@/features/auth/guards';
import { useSession } from '@/features/auth/session';
import { formatPeriod } from '@/lib/format';

function ApplyForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const program = useQuery({ queryKey: ['program', id], queryFn: () => api.programs.get(id) });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const apply = useMutation({
    mutationFn: (input: Parameters<typeof api.programs.apply>[1]) => api.programs.apply(id, input),
    onSuccess: (application) => {
      void qc.invalidateQueries({ queryKey: ['programs'] });
      void qc.invalidateQueries({ queryKey: ['program', id] });
      void qc.invalidateQueries({ queryKey: ['my-applications'] });
      router.replace(`/my/applications/${application.id}?done=1`);
    },
    onError: (error) => {
      if (isApiError(error) && error.fieldErrors) setErrors(error.fieldErrors);
      setFormError(errorMessage(error));
    },
  });

  if (program.isPending) return <ListSkeleton rows={2} />;
  if (program.isError) return <ErrorState error={program.error} onRetry={() => void program.refetch()} />;

  const p = program.data;
  if (p.recruitStatus !== 'open') {
    return (
      <Callout tone="warning" title="지금은 신청할 수 없습니다">
        모집 기간이 아니거나 정원이 마감되었습니다.{' '}
        <Link href={`/programs/${p.id}`} className="font-semibold underline">
          프로그램 상세로 돌아가기
        </Link>
      </Callout>
    );
  }

  return (
    <>
      <title>{`신청 - ${p.title} | 중구청소년센터`}</title>
      <div className="mb-6 rounded-md bg-surface-muted p-4">
        <p className="font-bold">{p.title}</p>
        <p className="mt-1 text-sm text-ink-600">
          {formatPeriod(p.startsAt, p.endsAt)} · {p.place}
        </p>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (apply.isPending) return;
          setFormError(null);
          const parsed = parseForm(programApplySchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          apply.mutate({ ...parsed.data, phone: parsed.data.phone.replace(/-/g, '') });
        }}
        className="space-y-5"
      >
        <div>
          <p className="mb-1.5 text-[15px] font-semibold">신청자</p>
          <p className="flex h-12 items-center rounded-md bg-surface-muted px-3 text-base">
            {session?.user.name}
          </p>
          <p className="mt-1.5 text-sm text-ink-600">회원 정보의 이름으로 신청합니다.</p>
        </div>
        <TextField
          label="연락처"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={session?.user.phone ?? ''}
          placeholder="010-1234-5678"
          hint="프로그램 안내 문자를 받을 휴대전화 번호"
          error={errors.phone}
        />
        <TextAreaField
          label="요청 사항 (선택)"
          name="note"
          rows={3}
          maxLength={300}
          hint="참여에 필요한 배려 사항 등이 있으면 적어 주세요. (300자 이내)"
          error={errors.note}
        />

        <fieldset className="rounded-md border border-line p-4">
          <legend className="px-1 text-[15px] font-bold">개인정보 수집·이용 동의 (필수)</legend>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-700">
            <dt className="font-semibold">수집 항목</dt>
            <dd>이름, 연락처, 요청 사항</dd>
            <dt className="font-semibold">이용 목적</dt>
            <dd>프로그램 신청 접수, 참여 안내 및 연락</dd>
            <dt className="font-semibold">보유 기간</dt>
            <dd>
              센터{' '}
              <a href="/policies/privacy" target="_blank" rel="noopener" className="underline">
                개인정보처리방침
                <span className="sr-only">(새 탭)</span>
              </a>
              에 따름
            </dd>
          </dl>
          <p className="mt-2 text-sm text-ink-600">동의하지 않을 수 있으며, 이 경우 신청이 제한됩니다.</p>
          <CheckboxField
            className="mt-3"
            name="agreePrivacy"
            label="위 내용을 확인했으며 동의합니다."
            error={errors.agreePrivacy}
          />
        </fieldset>

        <FormError message={formError} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={`/programs/${p.id}`} className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            취소
          </Link>
          <Button type="submit" size="lg" loading={apply.isPending}>
            신청하기
          </Button>
        </div>
      </form>
    </>
  );
}

export default function ProgramApplyPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="프로그램 신청"
          breadcrumbs={[{ label: '프로그램', href: '/programs' }, { label: '신청' }]}
        />
        <RequireAuth>
          <ApplyForm />
        </RequireAuth>
      </div>
    </div>
  );
}

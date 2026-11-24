'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { DateField, FormError, TextAreaField } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { POLICY_TITLE } from '@/domain/labels';
import { parseForm, policyFormSchema, type FieldErrors, type PolicyFormInput } from '@/domain/schemas';
import type { PolicyDoc } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, toDateInput, todayKst } from '@/lib/format';

function PolicyEditor({ doc }: { doc: PolicyDoc }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState<PolicyFormInput | null>(null);
  const publish = useMutation({
    mutationFn: (input: PolicyFormInput) => api.admin.policies.update(doc.key, input),
    onSuccess: () => {
      setPending(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'policies'] });
      void qc.invalidateQueries({ queryKey: ['policy'] });
      void qc.invalidateQueries({ queryKey: ['policies'] });
      toast.success(`${POLICY_TITLE[doc.key]} 개정본을 게시했습니다.`);
    },
    onError: (e) => {
      setPending(null);
      setErrors(serverFieldErrors(e));
    },
  });

  return (
    <form
      noValidate
      aria-labelledby="editor-title"
      className="mt-8 max-w-4xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (publish.isPending) return;
        const parsed = parseForm(policyFormSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        setPending(parsed.data);
      }}
    >
      <h2 id="editor-title" className="mb-4 border-b border-ink-900 pb-2 text-base font-bold">
        {POLICY_TITLE[doc.key]} 개정
      </h2>
      <DateField
        label="시행일"
        name="effectiveAt"
        required
        defaultValue={doc.effectiveAt ? toDateInput(doc.effectiveAt) : todayKst()}
        error={errors.effectiveAt}
        className="sm:w-56"
      />
      <TextAreaField
        label="본문"
        name="body"
        required
        rows={24}
        maxLength={50000}
        defaultValue={doc.body}
        error={errors.body}
        hint="일반 텍스트로 게시됩니다. 센터가 확정한 문안만 등록하세요."
        className="mt-5"
      />
      <div className="mt-4">
        <FormError message={publish.isError ? errorMessage(publish.error) : null} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="submit" loading={publish.isPending}>
          개정본 게시
        </Button>
      </div>
      <ConfirmDialog
        open={pending !== null}
        title={`${POLICY_TITLE[doc.key]} 개정본을 게시할까요?`}
        description={
          <>
            개정본을 게시하면 사용자 화면에 즉시 반영됩니다. 시행일:{' '}
            <strong className="tabular-nums">{pending?.effectiveAt}</strong>
          </>
        }
        confirmLabel="게시"
        loading={publish.isPending}
        onConfirm={() => pending && publish.mutate(pending)}
        onClose={() => setPending(null)}
      />
    </form>
  );
}

function Policies() {
  const lp = useListParams();
  const docs = useQuery({ queryKey: ['admin', 'policies'], queryFn: () => api.admin.policies.list() });
  const selected = lp.get('doc');

  return (
    <QueryState
      query={docs}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState title="정책 문서가 없습니다" />}
    >
      {(d) => {
        const doc = d.find((x) => x.key === selected);
        return (
          <>
            <ul className="console-surface max-w-4xl divide-y divide-line">
              {d.map((x) => (
                <li
                  key={x.key}
                  className={cn(
                    'flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3',
                    x.key === selected && 'bg-surface-admin',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{POLICY_TITLE[x.key]}</p>
                    <p className="text-sm text-ink-600 tabular-nums">
                      시행일 {x.effectiveAt ? formatDate(x.effectiveAt) : '없음'} · 최종 수정{' '}
                      {formatDateTime(x.updatedAt)}
                    </p>
                  </div>
                  {x.confirmed ? (
                    <Badge tone="success">확정</Badge>
                  ) : (
                    <Badge tone="warning">확정본 미등록</Badge>
                  )}
                  <Link
                    href={x.key === selected ? lp.pathname : `${lp.pathname}?doc=${x.key}`}
                    aria-current={x.key === selected ? 'true' : undefined}
                    className="inline-flex min-h-11 items-center font-semibold text-brand-700 hover:underline"
                  >
                    {x.key === selected ? '닫기' : '편집'}
                    <span className="sr-only">: {POLICY_TITLE[x.key]}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {doc && <PolicyEditor key={`${doc.key}-${doc.updatedAt}`} doc={doc} />}
          </>
        );
      }}
    </QueryState>
  );
}

export default function AdminPoliciesPage() {
  return (
    <AdminPage
      title="정책 문서"
      permission="policy.manage"
      docTitle="정책 문서 관리"
      description="이용약관·개인정보처리방침 등은 센터가 확정한 문안만 게시합니다."
    >
      <Policies />
    </AdminPage>
  );
}

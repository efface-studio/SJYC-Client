'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { managerEmailSchema, parseValues } from '@/domain/schemas';
import type { ClubManager } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { serverFieldErrors } from './form-utils';

/** 동아리별 담당자 지정·해제 (센터 직원 이상) — 담당자는 그 동아리의 회원·가입·출석·소식·소개를 관리한다 */
export function ClubManagers({ clubId, clubName }: { clubId: string; clubName: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const key = ['admin', 'club', clubId, 'managers'];
  const managers = useQuery({ queryKey: key, queryFn: () => api.admin.clubs.managers(clubId) });
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [removing, setRemoving] = useState<ClubManager | null>(null);

  const assign = useMutation({
    mutationFn: (value: string) => api.admin.clubs.assignManager(clubId, value),
    onSuccess: (m) => {
      void qc.invalidateQueries({ queryKey: key });
      setEmail('');
      setError(undefined);
      toast.success(`${m.name}님을 담당자로 지정했습니다. 본인에게 알림이 갑니다.`);
    },
    onError: (e) => setError(serverFieldErrors(e).email ?? errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (m: ClubManager) => api.admin.clubs.removeManager(clubId, m.userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      setRemoving(null);
      toast.success('담당자 지정을 해제했습니다.');
    },
    onError: (e) => {
      setRemoving(null);
      toast.error(errorMessage(e));
    },
  });

  return (
    <section aria-labelledby="club-managers" className="console-surface mb-8 max-w-3xl p-4 sm:p-5">
      <h2 id="club-managers" className="text-base font-bold">
        동아리 담당자
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        담당자는 관리자 화면의{' '}
        <Link href={`/admin/my-clubs/${clubId}`} className="underline">
          동아리 운영
        </Link>
        에서 이 동아리의 회원·가입 신청·출석·소식·소개만 관리합니다.
      </p>

      {managers.isPending ? (
        <ListSkeleton rows={1} />
      ) : managers.isError ? (
        <ErrorState error={managers.error} onRetry={() => void managers.refetch()} />
      ) : managers.data.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-600">지정된 담당자가 없습니다.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {managers.data.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm break-all text-ink-600">
                  {m.email} · {formatDate(m.assignedAt)} 지정
                </p>
              </div>
              <Button variant="tertiary" size="sm" className="text-danger-700" onClick={() => setRemoving(m)}>
                해제
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        noValidate
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start"
        onSubmit={(e) => {
          e.preventDefault();
          if (assign.isPending) return;
          const parsed = parseValues(managerEmailSchema, { email });
          if (!parsed.ok) {
            setError(parsed.errors.email);
            return;
          }
          assign.mutate(parsed.data.email);
        }}
      >
        <TextField
          label="담당자로 지정할 회원 이메일"
          type="email"
          name="managerEmail"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          className="flex-1"
        />
        <Button type="submit" loading={assign.isPending} className="sm:mt-[30px]">
          담당자 지정
        </Button>
      </form>

      <ConfirmDialog
        open={removing !== null}
        title="담당자 지정을 해제할까요?"
        description={
          removing && (
            <>
              <strong>{removing.name}</strong>님은 더 이상 {clubName}을(를) 운영할 수 없습니다.
            </>
          )
        }
        confirmLabel="해제"
        destructive
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing)}
      />
    </section>
  );
}

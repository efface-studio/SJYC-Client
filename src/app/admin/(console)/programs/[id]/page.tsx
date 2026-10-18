'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { ProgramForm } from '@/components/admin/program-form';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { RECRUIT_STATUS } from '@/domain/labels';
import type { FieldErrors, ProgramFormInput } from '@/domain/schemas';
import { formatDateTime } from '@/lib/format';

function EditProgram() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const program = useQuery({ queryKey: ['admin', 'program', id], queryFn: () => api.admin.programs.get(id) });

  const update = useMutation({
    mutationFn: (input: ProgramFormInput) => api.admin.programs.update(id, input),
    onMutate: () => setServerErrors({}),
    onSuccess: (p) => {
      qc.setQueryData(['admin', 'program', id], p);
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['programs'] });
      void qc.invalidateQueries({ queryKey: ['program', id] });
      toast.success('프로그램을 저장했습니다.');
    },
    onError: (e) => setServerErrors(serverFieldErrors(e)),
  });

  const remove = useMutation({
    mutationFn: () => api.admin.programs.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'], predicate: (q) => q.queryKey[1] !== 'program' });
      void qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('프로그램을 삭제했습니다.');
      router.replace('/admin/programs');
    },
    onError: (e) => {
      setConfirmDelete(false);
      toast.error(errorMessage(e));
    },
  });

  return (
    <QueryState query={program} notFound="프로그램을 찾을 수 없습니다">
      {(p) => (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
            <Badge tone={RECRUIT_STATUS[p.recruitStatus].tone}>{RECRUIT_STATUS[p.recruitStatus].text}</Badge>
            <span className="tabular-nums">
              신청 {p.appliedCount}/{p.capacity}명
            </span>
            <span className="tabular-nums">최종 수정 {formatDateTime(p.updatedAt)}</span>
            <Link
              href={`/admin/applications?programId=${p.id}`}
              className="inline-flex min-h-11 items-center font-semibold text-brand-700 hover:underline"
            >
              이 프로그램 신청자 보기
            </Link>
          </div>
          <ProgramForm
            key={p.updatedAt}
            initial={p}
            submitLabel="저장"
            pending={update.isPending}
            serverErrors={serverErrors}
            formError={update.isError ? errorMessage(update.error) : null}
            onSubmit={(input) => update.mutate(input)}
            extraActions={
              <Button variant="secondary" className="text-danger-700" onClick={() => setConfirmDelete(true)}>
                삭제
              </Button>
            }
          />
          <ConfirmDialog
            open={confirmDelete}
            title="프로그램을 삭제할까요?"
            description={
              <>
                <strong>{p.title}</strong> 프로그램을 삭제합니다. 되돌릴 수 없습니다. 신청 내역이 있으면
                삭제할 수 없으니 게시 상태를 &lsquo;비공개&rsquo;로 바꾸세요.
              </>
            }
            confirmLabel="삭제"
            destructive
            loading={remove.isPending}
            onConfirm={() => remove.mutate()}
            onClose={() => setConfirmDelete(false)}
          />
        </>
      )}
    </QueryState>
  );
}

export default function AdminProgramEditPage() {
  return (
    <AdminPage
      title="프로그램 수정"
      permission="program.write"
      breadcrumbs={[{ label: '프로그램 관리', href: '/admin/programs' }, { label: '수정' }]}
    >
      <EditProgram />
    </AdminPage>
  );
}

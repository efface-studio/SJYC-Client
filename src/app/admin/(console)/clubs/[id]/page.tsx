'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { ClubForm } from '@/components/admin/club-form';
import { ClubManagers } from '@/components/admin/club-managers';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { QueryState } from '@/components/admin/query-state';
import { useToast } from '@/components/ui/toast';
import type { ClubFormInput, FieldErrors } from '@/domain/schemas';

function EditClub() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const club = useQuery({ queryKey: ['admin', 'club', id], queryFn: () => api.admin.clubs.get(id) });

  const update = useMutation({
    mutationFn: (input: ClubFormInput) => api.admin.clubs.update(id, input),
    onMutate: () => setServerErrors({}),
    onSuccess: (c) => {
      qc.setQueryData(['admin', 'club', id], c);
      void qc.invalidateQueries({ queryKey: ['admin', 'clubs'] });
      void qc.invalidateQueries({ queryKey: ['clubs'] });
      void qc.invalidateQueries({ queryKey: ['club', id] });
      toast.success('동아리 정보를 저장했습니다.');
    },
    onError: (e) => setServerErrors(serverFieldErrors(e)),
  });

  return (
    <QueryState query={club} notFound="동아리를 찾을 수 없습니다">
      {(c) => (
        <>
          <p className="mb-5 text-sm text-ink-600 tabular-nums">현재 회원 {c.memberCount}명</p>
          <ClubManagers clubId={c.id} clubName={c.name} />
          <ClubForm
            key={JSON.stringify(c)}
            initial={c}
            submitLabel="저장"
            pending={update.isPending}
            serverErrors={serverErrors}
            formError={update.isError ? errorMessage(update.error) : null}
            onSubmit={(input) => update.mutate(input)}
          />
        </>
      )}
    </QueryState>
  );
}

export default function AdminClubEditPage() {
  return (
    <AdminPage
      view="editor"
      title="동아리 수정"
      permission="club.manage"
      breadcrumbs={[{ label: '동아리 관리', href: '/admin/clubs' }, { label: '수정' }]}
    >
      <EditClub />
    </AdminPage>
  );
}

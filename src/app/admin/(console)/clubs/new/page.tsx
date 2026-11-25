'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { ClubForm } from '@/components/admin/club-form';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { useToast } from '@/components/ui/toast';
import type { FieldErrors } from '@/domain/schemas';

function NewClub() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const create = useMutation({
    mutationFn: api.admin.clubs.create,
    onMutate: () => setServerErrors({}),
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'clubs'] });
      void qc.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('동아리를 등록했습니다.');
      router.replace(`/admin/clubs/${c.id}`);
    },
    onError: (e) => setServerErrors(serverFieldErrors(e)),
  });

  return (
    <ClubForm
      submitLabel="등록"
      pending={create.isPending || create.isSuccess}
      serverErrors={serverErrors}
      formError={create.isError ? errorMessage(create.error) : null}
      onSubmit={(input) => create.mutate(input)}
    />
  );
}

export default function AdminClubNewPage() {
  return (
    <AdminPage
      view="editor"
      title="동아리 등록"
      permission="club.manage"
      breadcrumbs={[{ label: '동아리 관리', href: '/admin/clubs' }, { label: '등록' }]}
    >
      <NewClub />
    </AdminPage>
  );
}

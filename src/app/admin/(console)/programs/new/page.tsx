'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { ProgramForm } from '@/components/admin/program-form';
import { useToast } from '@/components/ui/toast';
import type { FieldErrors } from '@/domain/schemas';

function NewProgram() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const create = useMutation({
    mutationFn: api.admin.programs.create,
    onMutate: () => setServerErrors({}),
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('프로그램을 등록했습니다.');
      router.replace(`/admin/programs/${p.id}`);
    },
    onError: (e) => setServerErrors(serverFieldErrors(e)),
  });

  return (
    <ProgramForm
      submitLabel="등록"
      pending={create.isPending || create.isSuccess}
      serverErrors={serverErrors}
      formError={create.isError ? errorMessage(create.error) : null}
      onSubmit={(input) => create.mutate(input)}
    />
  );
}

export default function AdminProgramNewPage() {
  return (
    <AdminPage
      view="editor"
      title="프로그램 등록"
      permission="program.write"
      breadcrumbs={[{ label: '프로그램 관리', href: '/admin/programs' }, { label: '등록' }]}
    >
      <NewProgram />
    </AdminPage>
  );
}

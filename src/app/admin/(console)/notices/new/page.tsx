'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { NoticeForm } from '@/components/admin/notice-form';
import { useToast } from '@/components/ui/toast';
import type { FieldErrors } from '@/domain/schemas';

function NewNotice() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const create = useMutation({
    mutationFn: api.admin.notices.create,
    onMutate: () => setServerErrors({}),
    onSuccess: (n) => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['notices'] });
      toast.success('공지를 등록했습니다.');
      router.replace(`/admin/notices/${n.id}`);
    },
    onError: (e) => setServerErrors(serverFieldErrors(e)),
  });

  return (
    <NoticeForm
      submitLabel="등록"
      pending={create.isPending || create.isSuccess}
      serverErrors={serverErrors}
      formError={create.isError ? errorMessage(create.error) : null}
      onSubmit={(input) => create.mutate(input)}
    />
  );
}

export default function AdminNoticeNewPage() {
  return (
    <AdminPage
      view="editor"
      title="공지 등록"
      permission="notice.write"
      breadcrumbs={[{ label: '공지 관리', href: '/admin/notices' }, { label: '등록' }]}
    >
      <NewNotice />
    </AdminPage>
  );
}

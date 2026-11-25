'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { NoticeForm } from '@/components/admin/notice-form';
import { QueryState } from '@/components/admin/query-state';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import type { FieldErrors, NoticeFormInput } from '@/domain/schemas';
import { formatDateTime } from '@/lib/format';

function EditNotice() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notice = useQuery({ queryKey: ['admin', 'notice', id], queryFn: () => api.admin.notices.get(id) });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin'] });
    void qc.invalidateQueries({ queryKey: ['notices'] });
    void qc.invalidateQueries({ queryKey: ['notice', id] });
  };

  const update = useMutation({
    mutationFn: (input: NoticeFormInput) => api.admin.notices.update(id, input),
    onMutate: () => setServerErrors({}),
    onSuccess: (n) => {
      qc.setQueryData(['admin', 'notice', id], n);
      invalidate();
      toast.success('공지를 저장했습니다.');
    },
    onError: (e) => setServerErrors(serverFieldErrors(e)),
  });

  const remove = useMutation({
    mutationFn: () => api.admin.notices.remove(id),
    onSuccess: () => {
      // 삭제된 상세 조회는 다시 불러오지 않는다
      void qc.invalidateQueries({ queryKey: ['admin'], predicate: (q) => q.queryKey[1] !== 'notice' });
      void qc.invalidateQueries({ queryKey: ['notices'] });
      toast.success('공지를 삭제했습니다.');
      router.replace('/admin/notices');
    },
    onError: (e) => {
      setConfirmDelete(false);
      toast.error(errorMessage(e));
    },
  });

  return (
    <QueryState query={notice} notFound="공지를 찾을 수 없습니다">
      {(n) => (
        <>
          <p className="mb-4 text-sm text-ink-600 tabular-nums">
            최종 수정 {formatDateTime(n.updatedAt)}
            {n.publishedAt && ` · 게시 ${formatDateTime(n.publishedAt)}`}
          </p>
          <NoticeForm
            key={n.updatedAt}
            initial={n}
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
            title="공지를 삭제할까요?"
            description={
              <>
                <strong>{n.title}</strong> 공지를 삭제합니다. 삭제하면 사용자 화면에서 바로 사라지며 되돌릴 수
                없습니다. 잠시 내리려면 상태를 &lsquo;비공개&rsquo;로 바꾸세요.
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

export default function AdminNoticeEditPage() {
  return (
    <AdminPage
      view="editor"
      title="공지 수정"
      permission="notice.write"
      breadcrumbs={[{ label: '공지 관리', href: '/admin/notices' }, { label: '수정' }]}
    >
      <EditNotice />
    </AdminPage>
  );
}

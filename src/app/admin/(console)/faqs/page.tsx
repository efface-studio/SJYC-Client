'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, type Column } from '@/components/admin/data-list';
import { FaqDialog } from '@/components/admin/faq-dialog';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { INQUIRY_CATEGORY_LABEL } from '@/domain/labels';
import type { Faq } from '@/domain/types';

/** 열린 모달의 대상 — faq: null 이면 새 등록 */
type Editing = { faq: Faq | null } | null;

function FaqList() {
  const qc = useQueryClient();
  const toast = useToast();
  const faqs = useQuery({ queryKey: ['admin', 'faqs'], queryFn: () => api.admin.faqs.list() });
  const [editing, setEditing] = useState<Editing>(null);
  // 모달을 열 때마다 key 를 바꿔 이전 입력·오류를 비운다 (닫을 때는 마운트를 유지해 포커스 복원)
  const [openCount, setOpenCount] = useState(0);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const open = (faq: Faq | null) => {
    setOpenCount((c) => c + 1);
    setEditing({ faq });
  };

  const remove = useMutation({
    mutationFn: (id: string) => api.admin.faqs.remove(id),
    onSuccess: () => {
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      void qc.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ를 삭제했습니다.');
    },
    onError: (e) => {
      setDeleting(null);
      toast.error(errorMessage(e));
    },
  });

  const columns: Column<Faq>[] = [
    {
      key: 'question',
      header: '질문',
      primary: true,
      cell: (f) => (
        <button
          type="button"
          onClick={() => open(f)}
          className="text-left font-semibold text-ink-900 hover:text-brand-700 hover:underline"
        >
          {f.question}
        </button>
      ),
    },
    {
      key: 'category',
      header: '분류',
      cell: (f) => INQUIRY_CATEGORY_LABEL[f.category],
      className: 'whitespace-nowrap',
    },
    { key: 'order', header: '순서', cell: (f) => f.order, className: 'tabular-nums' },
    {
      key: 'published',
      header: '게시',
      status: true,
      cell: (f) => (f.published ? <Badge tone="success">게시</Badge> : <Badge tone="neutral">숨김</Badge>),
    },
    {
      key: 'actions',
      header: '관리',
      cell: (f) => (
        <span className="flex gap-2">
          <Button size="sm" variant="secondary" className="min-h-11" onClick={() => open(f)}>
            수정
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-11 text-danger-700"
            onClick={() => setDeleting(f)}
          >
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open(null)}>FAQ 등록</Button>
      </div>
      <QueryState
        query={faqs}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="등록된 FAQ가 없습니다" />}
      >
        {(d) => (
          <DataList
            caption="FAQ 목록 (표시 순서대로)"
            rows={d}
            columns={columns}
            rowLabel={(f) => f.question}
          />
        )}
      </QueryState>

      <FaqDialog
        key={openCount}
        open={editing !== null}
        faq={editing?.faq ?? null}
        nextOrder={Math.max(0, ...(faqs.data?.map((f) => f.order) ?? [])) + 1}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="FAQ를 삭제할까요?"
        description={
          <>
            <strong>{deleting?.question}</strong> 항목을 삭제합니다. 되돌릴 수 없습니다. 잠시 내리려면
            &lsquo;게시&rsquo;를 해제하세요.
          </>
        }
        confirmLabel="삭제"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default function AdminFaqsPage() {
  return (
    <AdminPage
      title="FAQ"
      permission="inquiry.answer"
      docTitle="FAQ 관리"
      breadcrumbs={[{ label: '문의', href: '/admin/inquiries' }, { label: 'FAQ' }]}
    >
      <FaqList />
    </AdminPage>
  );
}

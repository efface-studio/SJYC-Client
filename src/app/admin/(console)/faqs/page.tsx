'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { ChevronDown } from 'lucide-react';
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
          <ol className="faq-library" aria-label="FAQ 목록 (표시 순서대로)">
            {d.map((f) => (
              <li key={f.id}>
                <details>
                  <summary>
                    <span className="faq-order" aria-label={'표시 순서 ' + f.order}>
                      {f.order}
                    </span>
                    <div>
                      <small>{INQUIRY_CATEGORY_LABEL[f.category]}</small>
                      <strong>{f.question}</strong>
                    </div>
                    <Badge tone={f.published ? 'success' : 'neutral'}>{f.published ? '게시' : '숨김'}</Badge>
                    <ChevronDown aria-hidden size={16} />
                  </summary>
                  <div className="faq-answer">
                    <p>{f.answer}</p>
                    <div>
                      <Button size="sm" variant="secondary" onClick={() => open(f)}>
                        수정
                      </Button>
                      <Button size="sm" variant="tertiary" onClick={() => setDeleting(f)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
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
      view="library"
      title="FAQ"
      permission="inquiry.answer"
      docTitle="FAQ 관리"
      breadcrumbs={[{ label: '문의', href: '/admin/inquiries' }, { label: 'FAQ' }]}
    >
      <FaqList />
    </AdminPage>
  );
}

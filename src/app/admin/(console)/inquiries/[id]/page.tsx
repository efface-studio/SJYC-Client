'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormError, TextAreaField } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { INQUIRY_CATEGORY_LABEL, INQUIRY_STATUS } from '@/domain/labels';
import { answerSchema, parseForm, type FieldErrors } from '@/domain/schemas';
import type { Inquiry } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

function AnswerForm({ inquiry }: { inquiry: Inquiry }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(inquiry.answer === null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const answer = useMutation({
    mutationFn: (body: string) => api.admin.inquiries.answer(inquiry.id, body),
    onSuccess: (x) => {
      qc.setQueryData(['admin', 'inquiry', inquiry.id], x);
      void qc.invalidateQueries({ queryKey: ['admin'], predicate: (q) => q.queryKey[1] !== 'inquiry' });
      void qc.invalidateQueries({ queryKey: ['my-inquiries'] });
      setEditing(false);
      toast.success(inquiry.answer ? '답변을 수정했습니다.' : '답변을 등록했습니다.');
    },
    onError: (e) => setErrors(serverFieldErrors(e)),
  });

  if (!editing && inquiry.answer) {
    return (
      <section aria-labelledby="answer-title" className="mt-8 max-w-3xl">
        <div className="flex items-center justify-between gap-2 border-b border-ink-900 pb-2">
          <h2 id="answer-title" className="text-base font-bold">
            답변
          </h2>
          <Button variant="secondary" size="sm" className="min-h-11" onClick={() => setEditing(true)}>
            답변 수정
          </Button>
        </div>
        <p className="mt-2 text-sm text-ink-600 tabular-nums">
          {inquiry.answer.answeredBy} · {formatDateTime(inquiry.answer.answeredAt)}
        </p>
        <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{inquiry.answer.body}</div>
      </section>
    );
  }

  return (
    <form
      noValidate
      aria-labelledby="answer-title"
      className="mt-8 max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (answer.isPending) return;
        const parsed = parseForm(answerSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        answer.mutate(parsed.data.body);
      }}
    >
      <h2 id="answer-title" className="mb-3 border-b border-ink-900 pb-2 text-base font-bold">
        {inquiry.answer ? '답변 수정' : '답변 작성'}
      </h2>
      <TextAreaField
        label="답변 내용"
        name="body"
        required
        rows={10}
        maxLength={5000}
        defaultValue={inquiry.answer?.body}
        error={errors.body}
        hint="작성자에게 그대로 표시됩니다. 개인정보는 적지 마세요."
      />
      <div className="mt-3">
        <FormError message={answer.isError ? errorMessage(answer.error) : null} />
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {inquiry.answer && (
          <Button variant="secondary" onClick={() => setEditing(false)} disabled={answer.isPending}>
            취소
          </Button>
        )}
        <Button type="submit" loading={answer.isPending}>
          {inquiry.answer ? '답변 저장' : '답변 등록'}
        </Button>
      </div>
    </form>
  );
}

function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const inquiry = useQuery({
    queryKey: ['admin', 'inquiry', id],
    queryFn: () => api.admin.inquiries.get(id),
  });

  return (
    <QueryState query={inquiry} notFound="문의를 찾을 수 없습니다">
      {(x) => (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600">
            <Badge tone={INQUIRY_STATUS[x.status].tone}>{INQUIRY_STATUS[x.status].text}</Badge>
            <span>{INQUIRY_CATEGORY_LABEL[x.category]}</span>
            <span>{x.authorName}</span>
            <span className="tabular-nums">{formatDateTime(x.createdAt)}</span>
          </div>
          <h2 className="mt-2 text-lg font-bold">{x.title}</h2>
          <div className="mt-3 max-w-3xl border-y border-line bg-surface px-4 py-4 text-[15px] leading-relaxed whitespace-pre-line">
            {x.body}
          </div>
          <AnswerForm key={x.answer?.answeredAt ?? 'new'} inquiry={x} />
        </>
      )}
    </QueryState>
  );
}

export default function AdminInquiryDetailPage() {
  return (
    <AdminPage
      title="문의 상세"
      permission="inquiry.answer"
      breadcrumbs={[{ label: '문의', href: '/admin/inquiries' }, { label: '상세' }]}
    >
      <InquiryDetail />
    </AdminPage>
  );
}

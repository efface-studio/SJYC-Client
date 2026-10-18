'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldMessages } from '@/components/ui/field';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { attendanceRate } from '@/domain/attendance';
import { ATTENDANCE_STATUS, ATTENDANCE_TARGET_LABEL } from '@/domain/labels';
import { checkInSchema, parseValues } from '@/domain/schemas';
import type { MyAttendance } from '@/domain/types';
import { formatDate } from '@/lib/format';

function CheckInForm() {
  const qc = useQueryClient();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const checkIn = useMutation({
    mutationFn: (value: string) => api.me.checkIn({ code: value }),
    onSuccess: (a) => {
      setCode('');
      setError(undefined);
      void qc.invalidateQueries({ queryKey: ['me', 'attendance'] });
      toast.success(`${a.targetName} ${a.title} 출석이 확인되었습니다.`);
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <form
      noValidate
      className="border border-line p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (checkIn.isPending) return;
        const parsed = parseValues(checkInSchema, { code });
        if (!parsed.ok) {
          setError(parsed.errors.code);
          return;
        }
        checkIn.mutate(parsed.data.code);
      }}
    >
      <label htmlFor="check-in-code" className="block text-base font-bold">
        출석 코드 입력
      </label>
      <p id="check-in-hint" className="mt-1 text-sm text-ink-600">
        담당 선생님이 알려준 4자리 숫자를 입력하세요. 코드는 연 뒤 10분 동안만 쓸 수 있습니다.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          id="check-in-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'check-in-hint check-in-code-error' : 'check-in-hint'}
          placeholder="0000"
          className="h-14 w-40 rounded-md border border-line-strong bg-surface text-center text-2xl font-bold tracking-[0.5em] tabular-nums placeholder:text-ink-600/40 focus:border-brand-700 focus:outline-none aria-invalid:border-danger-700"
        />
        <Button type="submit" size="lg" loading={checkIn.isPending} className="flex-1 sm:flex-none">
          출석하기
        </Button>
      </div>
      <FieldMessages errorId="check-in-code-error" error={error} />
    </form>
  );
}

function groupByTarget(items: MyAttendance[]) {
  const groups = new Map<string, MyAttendance[]>();
  for (const a of items) {
    const key = `${a.targetType}:${a.targetId}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.values()];
}

function History() {
  const list = useQuery({ queryKey: ['me', 'attendance'], queryFn: () => api.me.attendance() });
  if (list.isPending) return <ListSkeleton rows={3} />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
  if (list.data.length === 0) {
    return (
      <EmptyState
        title="출석 기록이 없습니다"
        description="가입한 동아리나 승인된 프로그램의 출석부가 만들어지면 여기에 표시됩니다."
      />
    );
  }
  return (
    <div className="space-y-8">
      {groupByTarget(list.data).map((items) => {
        const first = items[0]!;
        const count = (s: string) => items.filter((a) => a.status === s).length;
        const rate = attendanceRate({
          present: count('present'),
          late: count('late'),
          absent: count('absent'),
          excused: count('excused'),
        });
        return (
          <section key={`${first.targetType}:${first.targetId}`} aria-labelledby={`att-${first.targetId}`}>
            <div className="flex items-end justify-between gap-3 border-b-2 border-ink-900 pb-2">
              <div>
                <p className="text-sm text-ink-600">{ATTENDANCE_TARGET_LABEL[first.targetType]}</p>
                <h2 id={`att-${first.targetId}`} className="text-lg font-bold">
                  {first.targetName}
                </h2>
              </div>
              <p className="text-right">
                <span className="block text-sm text-ink-600">출석률</span>
                <strong className="text-xl tabular-nums">{rate === null ? '—' : `${rate}%`}</strong>
              </p>
            </div>
            <ul className="divide-y divide-line">
              {items.map((a) => (
                <li key={a.sessionId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-ink-600 tabular-nums">
                      {formatDate(`${a.date}T00:00:00+09:00`)}
                    </p>
                  </div>
                  {a.status ? (
                    <Badge tone={ATTENDANCE_STATUS[a.status].tone}>{ATTENDANCE_STATUS[a.status].text}</Badge>
                  ) : (
                    <Badge>미확인</Badge>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function MyAttendancePage() {
  return (
    <div className="space-y-8">
      <title>출석 | 중구청소년센터</title>
      <CheckInForm />
      <History />
    </div>
  );
}

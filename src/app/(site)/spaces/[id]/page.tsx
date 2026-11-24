'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Button, buttonClass } from '@/components/ui/button';
import {
  CheckboxField,
  DateField,
  FieldMessages,
  FormError,
  TextAreaField,
  TextField,
} from '@/components/ui/field';
import '@/components/site/directories.css';
import { SpacePhoto } from '@/components/site/space-photo';
import { PageHeader } from '@/components/ui/page-header';
import { Callout, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { parseForm, reservationSchema, type FieldErrors } from '@/domain/schemas';
import {
  addDays,
  firstReservableDate,
  RESERVATION_MAX_DAYS_AHEAD,
  RESERVATION_MAX_HOURS,
} from '@/domain/space';
import type { Space, TimeSlot } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';
import { todayKst } from '@/lib/format';

interface Range {
  start: number;
  end: number;
}

/** 탭 한 번 = 시작, 같은 날 뒤쪽 칸을 탭 = 끝. 중간에 예약된 칸이 있거나 최대 시간을 넘으면 새로 시작 */
function nextRange(slots: TimeSlot[], current: Range | null, i: number): Range | null {
  if (current && current.start === i && current.end === i) return null;
  if (!current || current.start !== current.end || i < current.start) return { start: i, end: i };
  const span = slots.slice(current.start, i + 1);
  if (span.every((s) => s.available) && span.length <= RESERVATION_MAX_HOURS)
    return { start: current.start, end: i };
  return { start: i, end: i };
}

function SlotPicker({
  slots,
  range,
  onChange,
  error,
}: {
  slots: TimeSlot[];
  range: Range | null;
  onChange: (r: Range | null) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[15px] font-semibold">
        이용 시간 <span className="text-danger-700">*</span>
      </legend>
      <p className="mb-2 text-sm text-ink-600">
        시작 시간을 누른 뒤 끝 시간을 누르세요. (최대 {RESERVATION_MAX_HOURS}시간)
      </p>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {slots.map((s, i) => {
          const selected = !!range && i >= range.start && i <= range.end;
          return (
            <button
              key={s.start}
              type="button"
              disabled={!s.available}
              aria-pressed={selected}
              aria-label={`${s.start}부터 ${s.end}까지 ${s.available ? (selected ? '선택됨' : '예약 가능') : '예약됨'}`}
              onClick={() => onChange(nextRange(slots, range, i))}
              className={cn(
                'h-12 rounded-sm border text-[15px] font-semibold tabular-nums',
                selected && 'border-ink-900 bg-ink-900 text-white',
                !selected && s.available && 'border-line-strong bg-surface hover:border-ink-900',
                !s.available && 'cursor-not-allowed border-line bg-surface-muted text-ink-600 line-through',
              )}
            >
              {s.start}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-2 text-[15px] font-semibold tabular-nums">
        {range
          ? `${slots[range.start]?.start} – ${slots[range.end]?.end} (${range.end - range.start + 1}시간)`
          : '선택한 시간이 없습니다.'}
      </p>
      <FieldMessages error={error} errorId={error ? 'slot-error' : undefined} />
    </fieldset>
  );
}

function ReservationForm({ space }: { space: Space }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: session } = useSession();
  const minDate = addDays(todayKst(), 1);
  const maxDate = addDays(todayKst(), RESERVATION_MAX_DAYS_AHEAD);
  const [date, setDate] = useState(() => firstReservableDate(todayKst()));
  const [range, setRange] = useState<Range | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const slots = useQuery({
    queryKey: ['space-availability', space.id, date],
    queryFn: () => api.spaces.availability(space.id, date),
    enabled: !!date,
  });

  const reserve = useMutation({
    mutationFn: (input: Parameters<typeof api.spaces.reserve>[1]) => api.spaces.reserve(space.id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-reservations'] });
      void qc.invalidateQueries({ queryKey: ['space-availability', space.id] });
      toast.success('예약 신청을 보냈습니다. 담당자 확인 후 확정됩니다.');
      router.push('/my#reservations');
    },
    onError: (e) => {
      if (isApiError(e) && e.fieldErrors) setErrors(e.fieldErrors);
      if (isApiError(e, 'CONFLICT')) void slots.refetch();
    },
  });

  if (!session) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/spaces/${space.id}`)}`}
        className={buttonClass({ size: 'lg', block: true })}
      >
        로그인하고 예약 신청하기
      </Link>
    );
  }

  const selectedStart = range ? slots.data?.[range.start]?.start : undefined;
  const selectedEnd = range ? slots.data?.[range.end]?.end : undefined;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (reserve.isPending) return;
        const parsed = parseForm(reservationSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        reserve.mutate(parsed.data);
      }}
      className="space-y-5"
    >
      <DateField
        label="이용 날짜"
        name="date"
        required
        min={minDate}
        max={maxDate}
        value={date}
        onValueChange={(next) => {
          setDate(next);
          setRange(null);
        }}
        error={errors.date}
      />
      <input type="hidden" name="startTime" value={selectedStart ?? ''} />
      <input type="hidden" name="endTime" value={selectedEnd ?? ''} />

      {slots.isPending ? (
        <ListSkeleton rows={1} label="예약 가능 시간 확인 중" />
      ) : slots.isError ? (
        <ErrorState error={slots.error} onRetry={() => void slots.refetch()} />
      ) : slots.data.length === 0 ? (
        <Callout tone="warning">선택한 날짜는 예약할 수 없는 날입니다. (일요일 등)</Callout>
      ) : (
        <SlotPicker
          slots={slots.data}
          range={range}
          onChange={setRange}
          error={errors.startTime ?? errors.endTime}
        />
      )}

      <TextField
        label="이용 인원"
        name="headcount"
        inputMode="numeric"
        pattern="[0-9]*"
        required
        hint={`최대 ${space.capacity}명`}
        error={errors.headcount}
      />
      <TextField
        label="연락처"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        defaultValue={session.user.phone ?? ''}
        placeholder="010-1234-5678"
        error={errors.phone}
      />
      <TextAreaField
        label="이용 목적"
        name="purpose"
        rows={3}
        maxLength={300}
        required
        error={errors.purpose}
      />
      <CheckboxField
        name="agreePrivacy"
        label="[필수] 예약 확인·연락을 위해 이름과 연락처를 수집·이용하는 데 동의합니다."
        error={errors.agreePrivacy}
      />
      <FormError message={reserve.isError ? errorMessage(reserve.error) : null} />
      <Button type="submit" size="lg" block loading={reserve.isPending}>
        예약 신청
      </Button>
    </form>
  );
}

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const space = useQuery({ queryKey: ['space', id], queryFn: () => api.spaces.get(id) });

  return (
    <div className="directory-detail directory-spaces">
      <div className="directory-content">
        {space.isPending ? (
          <ListSkeleton rows={2} />
        ) : space.isError ? (
          isApiError(space.error, 'NOT_FOUND') ? (
            <EmptyState title="공간을 찾을 수 없습니다" />
          ) : (
            <ErrorState error={space.error} onRetry={() => void space.refetch()} />
          )
        ) : (
          <>
            <title>{`${space.data.name} 예약 | 중구청소년센터`}</title>
            <PageHeader
              breadcrumbs={[{ label: '공간 예약', href: '/spaces' }, { label: space.data.floor }]}
              title={space.data.name}
              description={`${space.data.floor} · 최대 ${space.data.capacity}명 · ${space.data.description}`}
            />
            <div className="reserve-layout">
              <SpacePhoto space={space.data} />
              <section className="reserve-panel" aria-label="예약 신청">
                <h2>예약 신청</h2>
                {space.data.reservable ? (
                  <ReservationForm space={space.data} />
                ) : (
                  <Callout tone="warning" title="현재 예약을 받지 않는 공간입니다">
                    시설 점검 등으로 예약이 중지되었습니다. 자세한 내용은 공지사항을 확인해 주세요.
                  </Callout>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

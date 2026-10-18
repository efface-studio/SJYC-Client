import { Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import {
  CENTER,
  CENTER_SERVICES,
  DESK_HOURS,
  DESK_HOURS_NOTE,
  DIRECTIONS,
  FLOORS,
  OPERATING_HOURS,
  VERIFIED_AT,
  type HoursRow,
} from '@/config/center';

export const metadata: Metadata = { title: '센터 안내' };

const TOC = [
  ['intro', '센터 소개'],
  ['hours', '운영시간'],
  ['location', '오시는 길'],
  ['floors', '층별 안내'],
  ['contact', '문의'],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t-2 border-ink-900 pt-3 pb-10"
    >
      <h2 id={`${id}-title`} className="mb-4 text-xl font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Rows({ rows, wide = false }: { rows: HoursRow[]; wide?: boolean }) {
  return (
    <dl
      className={
        wide
          ? 'divide-y divide-line border-b border-line'
          : 'grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 text-[15px] md:grid-cols-[96px_1fr]'
      }
    >
      {rows.map((r) =>
        wide ? (
          <div key={r.label} className="py-3 md:grid md:grid-cols-[240px_1fr] md:gap-4">
            <dt className="font-bold">{r.label}</dt>
            <dd className="mt-0.5 text-[15px] text-ink-700 md:mt-0">{r.value}</dd>
          </div>
        ) : (
          <div key={r.label} className="contents">
            <dt className="font-semibold text-ink-600">{r.label}</dt>
            <dd className="tabular-nums">{r.value}</dd>
          </div>
        ),
      )}
    </dl>
  );
}

export default function AboutPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="센터 안내"
          description={`${CENTER.formalName} · 정보 확인일 ${VERIFIED_AT}. 운영 사정에 따라 바뀔 수 있으니 방문 전 전화로 확인해 주세요.`}
        />

        <nav aria-label="이 페이지 목차" className="-mx-4 mb-6 scrollbar-none overflow-x-auto px-4">
          <ul className="flex border-b border-line">
            {TOC.map(([id, label]) => (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  className="flex h-11 items-center px-3 text-[15px] font-semibold text-ink-700 hover:text-ink-900"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Section id="intro" title="센터 소개">
          <p className="mb-5 text-[17px] leading-relaxed font-semibold">{CENTER.slogan}</p>
          <Rows rows={CENTER_SERVICES} wide />
          <p className="mt-3 text-[15px]">
            센터 행사 사진과 영상은{' '}
            <Link href="/gallery" className="font-semibold text-brand-700 underline">
              센터 소식 · 갤러리
            </Link>
            에서 볼 수 있습니다.
          </p>
        </Section>

        <Section id="hours" title="운영시간">
          <Rows rows={OPERATING_HOURS} />
          <h3 className="mt-6 mb-2 font-bold">안내데스크 방문 접수</h3>
          <Rows rows={DESK_HOURS} />
          <p className="mt-2 text-sm text-ink-600">{DESK_HOURS_NOTE}</p>
          <p className="mt-3 text-[15px]">
            프로그램 신청은{' '}
            <Link href="/programs" className="font-semibold text-brand-700 underline">
              프로그램
            </Link>
            에서, 공간 이용은{' '}
            <Link href="/spaces" className="font-semibold text-brand-700 underline">
              공간 예약
            </Link>
            에서 온라인으로 신청할 수 있습니다.
          </p>
        </Section>

        <Section id="location" title="오시는 길">
          <p className="mb-4 text-base font-bold">
            ({CENTER.postalCode}) {CENTER.address}
          </p>
          <Rows rows={DIRECTIONS} />
        </Section>

        <Section id="floors" title="층별 안내">
          <ul className="divide-y divide-line border-b border-line">
            {FLOORS.map((f) => (
              <li key={f.floor} className="grid grid-cols-[48px_1fr] gap-3 py-3">
                <span className="text-base font-extrabold text-brand-700">{f.floor}</span>
                <span className="text-[15px] text-ink-700">{f.spaces.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="contact" title="문의">
          <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 text-[15px] tabular-nums md:grid-cols-[96px_1fr]">
            <dt className="font-semibold text-ink-600">대표번호</dt>
            <dd>{CENTER.telDisplay}</dd>
            <dt className="font-semibold text-ink-600">팩스</dt>
            <dd>{CENTER.fax}</dd>
          </dl>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <a
              href={`tel:${CENTER.tel}`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-700 font-semibold text-white hover:bg-brand-800"
            >
              <Phone aria-hidden className="size-5" />
              전화 걸기
            </a>
            <Link
              href="/qna"
              className="flex min-h-12 items-center justify-center rounded-md border border-line-strong font-semibold hover:bg-surface-muted"
            >
              자주 묻는 질문 · 1:1 문의
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}

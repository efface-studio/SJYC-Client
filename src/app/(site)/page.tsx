'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore, type ReactNode } from 'react';
import { api } from '@/api';
import { CenterFilm } from '@/components/site/center-film';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { CENTER, DESK_HOURS, hoursOn } from '@/config/center';
import { todayKst } from '@/lib/format';
import { NoticeItem } from '@/features/notices/notice-item';
import { ProgramRow, useCategoryName } from '@/features/programs/program-card';

function Section({
  title,
  more,
  children,
}: {
  title: string;
  more: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="site-section-title">
        <h2>{title}</h2>
        <Link href={more.href}>{more.label}</Link>
      </div>
      {children}
    </section>
  );
}

function watchDate(update: () => void) {
  const timer = window.setInterval(update, 60000);
  window.addEventListener('focus', update);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', update);
  };
}

function TodayHours() {
  const day = useSyncExternalStore(watchDate, todayKst, () => '');
  if (!day)
    return (
      <div className="visit-hours" aria-busy="true">
        오늘 운영시간 확인 중
      </div>
    );
  const now = new Date(`${day}T12:00:00+09:00`);
  const today = hoursOn(now);
  const date = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(now);
  const desk = DESK_HOURS.find((d) => d.label === (today.weekday === '토' ? '토요일' : '평일'));
  return (
    <div className="visit-hours">
      <p>
        <Clock3 size={16} aria-hidden />
        {date} 운영시간
      </p>
      <strong className={today.open ? undefined : 'closed-hours'}>{today.hours}</strong>
      {desk && today.weekday !== '일' && <p>안내데스크 {desk.value}</p>}
      <p>
        공휴일·임시 휴관은 <Link href="/notices">공지사항</Link>을 확인해 주세요.
      </p>
    </div>
  );
}

const ACTIVITIES = [
  { href: '/programs', label: '프로그램 찾기', image: '/media/program-studio.webp' },
  { href: '/spaces', label: '공간 예약', image: '/media/spaces-studio.webp' },
  { href: '/clubs', label: '동아리 가입', image: '/media/clubs-studio.webp' },
];

export default function HomePage() {
  const programs = useQuery({
    queryKey: ['programs', { recruitStatus: 'open', pageSize: 5 }],
    queryFn: () => api.programs.list({ recruitStatus: 'open', pageSize: 5 }),
  });
  const notices = useQuery({
    queryKey: ['notices', { pageSize: 5 }],
    queryFn: () => api.notices.list({ pageSize: 5 }),
  });
  const categoryName = useCategoryName();
  return (
    <div className="home-page">
      <CenterFilm />
      <div className="home-content container-page" id="explore">
        <nav className="activity-index" aria-label="센터 이용 바로가기">
          {ACTIVITIES.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="activity-photo" style={{ backgroundImage: `url(${item.image})` }} />
              <span>
                {item.label}
                <ArrowUpRight size={23} aria-hidden />
              </span>
            </Link>
          ))}
        </nav>
        <div className="home-bulletin">
          <Section title="모집 중인 프로그램" more={{ href: '/programs', label: '전체 프로그램' }}>
            {programs.isPending ? (
              <ListSkeleton rows={3} />
            ) : programs.isError ? (
              <ErrorState error={programs.error} onRetry={() => void programs.refetch()} />
            ) : !programs.data.items.length ? (
              <EmptyState
                title="지금 모집 중인 프로그램이 없습니다"
                description="모집 예정 프로그램은 전체 프로그램에서 확인할 수 있습니다."
              />
            ) : (
              <ul>
                {programs.data.items.map((p) => (
                  <li key={p.id}>
                    <ProgramRow program={p} categoryName={categoryName(p.categoryId)} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <div>
            <Section title="공지사항" more={{ href: '/notices', label: '전체 공지' }}>
              {notices.isPending ? (
                <ListSkeleton rows={3} />
              ) : notices.isError ? (
                <ErrorState error={notices.error} onRetry={() => void notices.refetch()} />
              ) : !notices.data.items.length ? (
                <EmptyState title="등록된 공지가 없습니다" />
              ) : (
                <ul>
                  {notices.data.items.map((n) => (
                    <NoticeItem key={n.id} notice={n} />
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
        <aside className="visit-info" aria-label="센터 방문 정보">
          <TodayHours />
          <div>
            <h2>오시는 길</h2>
            <p>{CENTER.address}</p>
            <Link href="/about#location">
              <MapPin aria-hidden size={16} /> {CENTER.nearestStation}
            </Link>
          </div>
          <div>
            <h2>센터 대표전화</h2>
            <a href={`tel:${CENTER.tel}`}>{CENTER.telDisplay}</a>
          </div>
        </aside>
        <nav className="home-extra" aria-label="센터 소식과 문의">
          <Link href="/programs/calendar">프로그램 일정</Link>
          <Link href="/gallery">센터 소식·갤러리</Link>
          <Link href="/qna">질문·문의</Link>
          <Link href="/about">센터 안내</Link>
        </nav>
      </div>
    </div>
  );
}

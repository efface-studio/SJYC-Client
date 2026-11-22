'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock3, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { api } from '@/api';
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

function VisitToday() {
  const [showPhoto, setShowPhoto] = useState(true);
  return (
    <section className="visit-board" aria-labelledby="visit-title">
      <div className="visit-copy">
        <h1 id="visit-title">{CENTER.name}</h1>
        <p className="visit-location">
          <MapPin size={16} aria-hidden />
          {CENTER.nearestStation}
        </p>
        <TodayHours />
        <div className="visit-actions">
          <Link href="/programs" className="visit-primary">
            프로그램 찾기
          </Link>
          <Link href="/about#location">오시는 길</Link>
        </div>
      </div>
      {showPhoto && (
        <figure className="visit-photo">
          <img
            src="https://www.j-youth.org/kor/images/sub/info_00_01.jpg"
            alt="약수역 인근 중구청소년센터 건물 전경"
            width={910}
            height={514}
            referrerPolicy="no-referrer"
            fetchPriority="high"
            onError={() => setShowPhoto(false)}
          />
          <figcaption>중구청소년센터 시설안내</figcaption>
        </figure>
      )}
    </section>
  );
}

const SERVICES = [
  { href: '/spaces', label: '공간 예약' },
  { href: '/clubs', label: '동아리 가입' },
  { href: '/programs/calendar', label: '프로그램 일정' },
  { href: '/gallery', label: '센터 소식·갤러리' },
  { href: '/qna', label: '질문·문의' },
  { href: '/about', label: '센터 안내' },
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
    <div className="home-page container-page">
      <VisitToday />
      <nav className="service-links" aria-label="센터 이용 바로가기">
        {SERVICES.map((s) => (
          <Link key={s.href} href={s.href}>
            {s.label}
            <ChevronRight size={15} aria-hidden />
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
          <div className="home-contact">
            <Phone size={18} aria-hidden />
            <span>센터 대표전화</span>
            <a href={`tel:${CENTER.tel}`}>{CENTER.telDisplay}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

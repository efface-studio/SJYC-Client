'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Images,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { api } from '@/api';
import { CenterFilm } from '@/components/site/center-film';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useSiteSettings } from '@/features/settings/use-settings';
import { homeHoursOn } from '@/config/center';
import { orderedKeys } from '@/config/site-settings';
import { HOME_SECTIONS } from '@/domain/site-settings';
import { todayKst } from '@/lib/format';
import { NoticeItem } from '@/features/notices/notice-item';
import { remainingSeats } from '@/domain/program';
import { daysUntil, formatShortDate } from '@/lib/format';
import { useCategoryName } from '@/features/programs/program-card';
import './home.css';

function Section({
  title,
  more,
  children,
  className,
}: {
  title: string;
  more: { href: string; label: string };
  children: ReactNode;
  className: string;
}) {
  return (
    <section aria-label={title} className={className}>
      <div className="home-section-heading">
        <h2>{title}</h2>
        <Link href={more.href}>
          {more.label}
          <ArrowRight size={17} aria-hidden />
        </Link>
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
  const settings = useSiteSettings();
  const day = useSyncExternalStore(watchDate, todayKst, () => '');
  if (!day)
    return (
      <div className="visit-hours" aria-busy="true">
        오늘 운영시간 확인 중
      </div>
    );
  const now = new Date(`${day}T12:00:00+09:00`);
  const today = homeHoursOn(now, settings);
  const date = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(now);
  const desk = today.weekday === '토' ? settings.deskSaturday : settings.deskWeekday;
  return (
    <div className="visit-hours">
      <p>
        <Clock3 size={16} aria-hidden />
        {date} 운영시간
      </p>
      <strong className={today.open ? undefined : 'closed-hours'}>{today.hours}</strong>
      {desk && today.weekday !== '일' && <p>안내데스크 {desk}</p>}
      <p>
        공휴일·임시 휴관은 <Link href="/notices">공지사항</Link>을 확인해 주세요.
      </p>
    </div>
  );
}

const ACTIVITIES = [
  { href: '/programs', label: '프로그램 찾기', image: '/media/program-studio.webp' },
  { href: '/spaces', label: '공간 예약', image: '/media/spaces/gym.webp' },
  { href: '/clubs', label: '동아리 가입', image: '/media/clubs-studio.webp' },
];

export default function HomePage() {
  const center = useSiteSettings();
  const photos = [center.programImage, center.spaceImage, center.clubImage];
  const programs = useQuery({
    queryKey: ['programs', { recruitStatus: 'open', pageSize: 5 }],
    queryFn: () => api.programs.list({ recruitStatus: 'open', pageSize: 5 }),
  });
  const notices = useQuery({
    queryKey: ['notices', { pageSize: 5 }],
    queryFn: () => api.notices.list({ pageSize: 5 }),
  });
  const categoryName = useCategoryName();
  const sections = {
    services: (
      <nav className="home-services" aria-labelledby="home-services-title">
        <h2 id="home-services-title">센터 이용 바로가기</h2>
        <div className="home-service-grid">
          {ACTIVITIES.map((item, index) => (
            <Link key={item.href} href={item.href} className="home-service">
              <Image
                src={photos[index]!}
                alt=""
                width={720}
                height={400}
                sizes="(max-width: 639px) 88vw, (max-width: 959px) 45vw, 38vw"
              />
              <span>
                {item.label}
                <ArrowUpRight aria-hidden size={24} />
              </span>
            </Link>
          ))}
        </div>
      </nav>
    ),
    programs: (
      <section className="home-recruit" aria-labelledby="recruit-heading">
        <div className="recruit-lead">
          <h2 id="recruit-heading">모집 중인 프로그램</h2>
          <Link href="/programs">
            전체 프로그램 <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <div className="recruit-list">
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
            <ul className="home-program-board">
              {programs.data.items.map((p) => (
                <li key={p.id}>
                  <Link href={'/programs/' + p.id} className="recruit-ticket">
                    <div className="ticket-heading">
                      <span>{categoryName(p.categoryId)}</span>
                      <strong>
                        {daysUntil(p.recruitEndsAt) <= 0 ? '오늘 마감' : 'D-' + daysUntil(p.recruitEndsAt)}
                      </strong>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.target}</p>
                    <div className="ticket-stub">
                      <span>
                        <strong>{remainingSeats(p)}석</strong> 남음
                      </span>
                      <time dateTime={p.recruitEndsAt}>{formatShortDate(p.recruitEndsAt)} 마감</time>
                      <ArrowUpRight size={16} aria-hidden />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    ),
    news: (
      <div className="home-news-visit">
        <Section className="home-news" title="공지사항" more={{ href: '/notices', label: '전체 공지' }}>
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
        <aside className="visit-info" aria-label="센터 방문 정보">
          <div className="visit-photo">
            <Image
              src="/media/center-exterior.webp"
              width={910}
              height={514}
              alt="중구청소년센터 정문"
              sizes="(min-width:800px) 28vw, 90vw"
            />
            <h2>방문 안내</h2>
          </div>
          <TodayHours />
          <div>
            <h3>
              <MapPin aria-hidden size={16} />
              오시는 길
            </h3>
            <p>{center.address}</p>
            <Link href="/about#location">
              {center.nearestStation} <ArrowUpRight aria-hidden size={15} />
            </Link>
          </div>
          <div>
            <h3>
              <Phone aria-hidden size={16} />
              센터 대표전화
            </h3>
            <a href={`tel:${center.tel}`}>{center.telDisplay}</a>
          </div>
        </aside>
      </div>
    ),
    more: (
      <nav className="home-extra" aria-label="센터 소식과 문의">
        <Link href="/programs/calendar">
          <CalendarDays aria-hidden />
          프로그램 일정
          <ArrowRight aria-hidden />
        </Link>
        <Link href="/gallery">
          <Images aria-hidden />
          센터 소식·갤러리
          <ArrowRight aria-hidden />
        </Link>
        <Link href="/qna">
          <MessageCircle aria-hidden />
          질문·문의
          <ArrowRight aria-hidden />
        </Link>
        <Link href="/about">
          <MapPin aria-hidden />
          센터 안내
          <ArrowRight aria-hidden />
        </Link>
      </nav>
    ),
  };
  return (
    <div className="home-page">
      <CenterFilm />
      <div className="home-explore" id="explore">
        {orderedKeys(center.homeOrder, HOME_SECTIONS).map((key) => (
          <Fragment key={key}>{sections[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}

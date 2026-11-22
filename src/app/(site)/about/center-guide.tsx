'use client';
import { ArrowDown, ArrowUpRight, Clock3, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSiteSettings } from '@/features/settings/use-settings';
import { displayHours, settingsRows } from '@/config/site-settings';
import type { HoursRow } from '@/config/center';

import { profileTopics } from './profile-topics';

const TOC = [
  ['intro', '센터 소개'],
  ['hours', '운영시간'],
  ['location', '오시는 길'],
  ['floors', '층별 안내'],
] as const;

function Rows({ rows }: { rows: HoursRow[] }) {
  return (
    <dl className="guide-rows">
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CenterGuide() {
  const center = useSiteSettings();
  const hours = [
    { label: '평일', value: displayHours(center.weekdayHours) },
    { label: '토요일', value: displayHours(center.saturdayHours) },
    {
      label: '일요일',
      value:
        displayHours(center.sundayHours) + (center.closedSunday === 'second' ? ' (매월 둘째 주 휴관)' : ''),
    },
  ];
  const desk = [
    { label: '평일', value: displayHours(center.deskWeekday) },
    { label: '토요일', value: displayHours(center.deskSaturday) },
  ];
  return (
    <div className="center-guide">
      <header className="guide-opening">
        <div className="guide-wrap guide-hero">
          <div>
            <p className="guide-place">
              <MapPin size={17} aria-hidden />
              {center.name}
            </p>
            <h1>센터 안내</h1>
            <p className="guide-slogan">{center.slogan}</p>
            <a className="guide-action" href="#location">
              찾아오는 길 <ArrowDown size={17} aria-hidden />
            </a>
          </div>
          <Image
            src="/media/center-exterior.webp"
            alt="나무 사이로 보이는 중구청소년센터 정문과 건물 전경"
            width={910}
            height={514}
            priority
            sizes="(min-width: 800px) 49vw, 94vw"
          />
        </div>
      </header>
      <nav aria-label="이 페이지 목차" className="guide-nav guide-wrap">
        {TOC.map(([id, label]) => (
          <a key={id} href={'#' + id}>
            {label}
          </a>
        ))}
      </nav>
      <div className="guide-wrap guide-visit">
        <section id="hours">
          <Clock3 aria-hidden />
          <h2>운영시간</h2>
          <Rows rows={hours} />
          <h3>안내데스크 방문 접수</h3>
          <Rows rows={desk} />
          <p className="guide-note">{center.deskNote}</p>
        </section>
        <section id="location">
          <MapPin aria-hidden />
          <h2>오시는 길</h2>
          <address>
            ({center.postalCode}) {center.address}
          </address>
          <Rows rows={settingsRows(center.directions)} />
        </section>
      </div>
      <section className="guide-building" id="floors">
        <div className="guide-wrap guide-split">
          <div>
            <h2>층별 안내</h2>
            <Link className="guide-underlink" href="/spaces">
              공간 예약 <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
          <ol>
            {settingsRows(center.floors).map((f) => (
              <li key={f.label}>
                <strong>{f.label}</strong>
                <span>{f.value}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="intro" className="guide-wrap guide-split guide-services">
        <div>
          <h2>센터 소개</h2>
          <p>{center.formalName}</p>
        </div>
        <div>
          <nav className="profile-index" aria-label="센터 소개 상세">
            {profileTopics.map((t) => (
              <Link key={t.slug} href={'/about/' + t.slug}>
                {t.name}
                <ArrowUpRight size={17} aria-hidden />
              </Link>
            ))}
          </nav>
          <Rows rows={settingsRows(center.services)} />
          <div className="guide-links">
            <Link className="guide-underlink" href="/programs">
              프로그램 찾기 <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link className="guide-underlink" href="/gallery">
              센터 소식·갤러리 <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link className="guide-underlink" href="/qna">
              자주 묻는 질문·1:1 문의 <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

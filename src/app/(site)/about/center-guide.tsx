import { ArrowDown, ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CENTER,
  CENTER_SERVICES,
  DESK_HOURS,
  DESK_HOURS_NOTE,
  DIRECTIONS,
  FLOORS,
  OPERATING_HOURS,
  type HoursRow,
} from '@/config/center';

const TOC = [
  ['intro', '센터 소개'],
  ['hours', '운영시간'],
  ['location', '오시는 길'],
  ['floors', '층별 안내'],
  ['contact', '문의'],
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
  return (
    <div className="center-guide">
      <header className="guide-opening">
        <div className="guide-wrap guide-hero">
          <div>
            <p className="guide-place">
              <MapPin size={17} aria-hidden />
              서울 중구 · 약수역
            </p>
            <h1>센터 안내</h1>
            <p className="guide-slogan">{CENTER.slogan}</p>
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
          <Rows rows={OPERATING_HOURS} />
          <h3>안내데스크 방문 접수</h3>
          <Rows rows={DESK_HOURS} />
          <p className="guide-note">{DESK_HOURS_NOTE}</p>
        </section>
        <section id="location">
          <MapPin aria-hidden />
          <h2>오시는 길</h2>
          <address>
            ({CENTER.postalCode}) {CENTER.address}
          </address>
          <Rows rows={DIRECTIONS} />
          <a className="guide-underlink" href={`tel:${CENTER.tel}`}>
            대표전화 {CENTER.telDisplay}
            <Phone size={15} aria-hidden />
          </a>
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
            {FLOORS.map((f) => (
              <li key={f.floor}>
                <strong>{f.floor}</strong>
                <span>{f.spaces.join(' · ')}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="intro" className="guide-wrap guide-split guide-services">
        <div>
          <h2>센터 소개</h2>
          <p>{CENTER.formalName}</p>
        </div>
        <div>
          <Rows rows={CENTER_SERVICES} />
          <div className="guide-links">
            <Link className="guide-underlink" href="/programs">
              프로그램 찾기 <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link className="guide-underlink" href="/gallery">
              센터 소식·갤러리 <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      <section id="contact" className="guide-contact">
        <div className="guide-wrap">
          <div>
            <h2>센터 문의</h2>
            <a href={`tel:${CENTER.tel}`}>{CENTER.telDisplay}</a>
            <p>팩스 {CENTER.fax}</p>
          </div>
          <Link href="/qna" className="guide-action">
            자주 묻는 질문·1:1 문의 <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}

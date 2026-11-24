import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  CalendarDays,
  Flag,
  HeartHandshake,
  Landmark,
  UsersRound,
  Vote,
} from 'lucide-react';
import { profileTopics } from '../profile-topics';
import '../about.css';

type Topic = (typeof profileTopics)[number]['slug'];
type Props = { params: Promise<{ topic: string }> };
export function generateStaticParams() {
  return profileTopics.map((t) => ({ topic: t.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const entry = profileTopics.find((t) => t.slug === topic);
  return { title: entry ? entry.name + ' · 센터 소개' : '센터 소개' };
}

const network = [
  [
    '수탁 운영',
    '광진구 청소년상담복지센터 · 광진구 청소년지원센터(꿈드림) · 광진구 5호점 우리동네키움센터 · 송파구립 마천청소년센터 · 가평군 설악·조종·가평 청소년문화의집 · 가평군 청소년상담복지센터 · 중구청소년센터 · 하남시 청소년수련관 · 하남시 학교밖청소년지원센터 · 하남시 안전체험장',
  ],
  ['자매 기관', '대원교육장학재단 · 대원교육그룹(Daewon Kinder Academy)'],
  ['후원·협력', '우리은행 · 감성스토리교육협회 · 양구군 · 연합투데이'],
  ['협력 학교', '학교법인 대원학원 · 대원국제중학교 · 대원외국어고등학교 · 대원고등학교 · 대원여자고등학교'],
];
const teams = [
  ['경영전략팀', '예산·회계, 인사와 행정, 시설 안전 및 이용 환경을 관리합니다.'],
  ['미래인재지원팀', '창업·미디어·미래기술 활동, 청소년 공간, 학교 밖 청소년 상담과 자립을 지원합니다.'],
  ['참여플랫폼조성팀', '청소년관장과 참여위원회, 동아리 연합, 청소년 전용공간과 정책 제안 활동을 맡습니다.'],
  ['교육문화팀', '생활체육·평생교육, 시설 대관, 방과후아카데미와 청소년 상담을 운영합니다.'],
  ['진로직업체험센터', '학교와 지역 일터를 연결해 직업 현장 체험, 진로 동아리와 박람회를 운영합니다.'],
];

function Facts({ rows }: { rows: string[][] }) {
  return (
    <dl className="guide-rows">
      {rows.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Foundation() {
  return (
    <>
      <section className="foundation-lead">
        <div className="foundation-logo">
          <Image src="/media/about/foundation.webp" width={270} height={47} alt="행복함께나누는재단" />
        </div>
        <div>
          <h2>청소년의 배움과 활동을 지원합니다</h2>
          <p>
            행복함께나누는재단은 경제적 여건에 관계없이 청소년이 재능을 발견하고 사회에 기여할 수 있도록
            교육과 체험 기회를 마련합니다.
          </p>
        </div>
      </section>
      <Facts
        rows={[
          ['설립일', '2011년 4월 21일'],
          ['이사장', '이지윤'],
          ['소재지', '서울특별시 광진구 용마산로22길 26'],
        ]}
      />
      <section>
        <h2>주요 사업</h2>
        <div className="foundation-work">
          <div>
            <HeartHandshake aria-hidden />
            <h3>인성·창의 활동</h3>
            <p>융합교육, DMZ 생태·문화 탐방, 안보 체험, 해외 봉사, 유스히어로 시상</p>
          </div>
          <div>
            <BookOpen aria-hidden />
            <h3>교육·활동 지원</h3>
            <p>
              토요행복학교 영어 멘토링, 지역아동센터 연합 활동, 저소득 가정 청소년 교육·활동비, 청소년
              오케스트라 지원
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2>함께하는 기관</h2>
        <div className="network-directory">
          {network.map(([group, orgs]) => (
            <details key={group} open={group === '수탁 운영'}>
              <summary>{group}</summary>
              <p>{orgs}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function YouthDirector() {
  return (
    <>
      <section className="council-mandate">
        <div>
          <span>제3대 청소년관장</span>
          <h2>
            청소년이 뽑은
            <br />
            센터의 대표
          </h2>
          <p>임기 2026년 4월 — 2027년 2월</p>
        </div>
        <div>
          <Flag aria-hidden />
          <h3>이번 임기 공약</h3>
          <ul>
            <li>청소년 소통창구 ‘다 이루어질 라미’ 운영</li>
            <li>방학 중 스포츠 대회 두 차례 개최</li>
          </ul>
          <p>정책 제안 주제는 공식 소개에서 선정 중으로 안내하고 있습니다.</p>
        </div>
      </section>
      <section>
        <h2>선거와 역할</h2>
        <ol className="election-steps">
          <li>
            <UsersRound aria-hidden />
            <h3>후보 등록</h3>
            <p>
              중구 거주 또는 관내 학교에 다니는 15~24세 청소년. 중구 꿈드림 소속 청소년도 참여할 수 있습니다.
            </p>
          </li>
          <li>
            <Vote aria-hidden />
            <h3>대표 선출</h3>
            <p>매년 선거인단 150명을 모집해 온라인과 현장에서 투표합니다.</p>
          </li>
          <li>
            <AudioLines aria-hidden />
            <h3>운영 참여</h3>
            <p>지역 청소년 의견을 모아 정책을 제안하고 공약을 실천합니다.</p>
          </li>
        </ol>
      </section>
      <section>
        <h2>지난 임기</h2>
        <Facts
          rows={[
            [
              '제2대 · 2025.4~2026.3',
              '세대가 함께하는 요리와 중·고등학생 체육대회를 기획하고 중구 외국인 청소년 지원을 제안했습니다.',
            ],
            [
              '제1대 · 2024.6~2025.3',
              '가족 운동회와 주민 간담회를 공약으로 내걸고 청소년 교통비 지원을 제안했습니다.',
            ],
          ]}
        />
      </section>
    </>
  );
}

const history = [
  [
    '2026',
    '스마트 스터디룸 개소. 청소년수련시설 평가와 진로직업체험지원센터 성과 점검에서 우수 등급을 받았습니다.',
  ],
  ['2025', '남산자락숲길 오리엔티어링, 루틴랩, 청소년 정책 캠프 등 센터 활동이 여러 기관에서 선정됐습니다.'],
  [
    '2024',
    '첫 명예 청소년관장이 취임하고 청소년 특성화 활동과 방과후아카데미 운영이 우수 사례로 선정됐습니다.',
  ],
  [
    '2023',
    '지역 청소년 기관들과 활동 교류를 확대하고 D.D 프로젝트로 한국청소년활동진흥원 우수상을 받았습니다.',
  ],
  ['2022', '지역 연계 활동이 서울 구립 청소년시설 평가에서 최우수상을 받았습니다.'],
  ['2021', '청소년수련시설 종합평가 최우수 등급을 받았습니다.'],
  ['2020', '청소년 인성 활동이 우수 프로그램으로 선정되고 성동교육복지센터와 협약을 맺었습니다.'],
  ['2019', '보훈 테마활동과 꿈드림봉사단의 활동이 표창을 받았습니다.'],
  ['2018', '청소년 국제 교류 분야에서 서울시청소년시설협회 최우수기관으로 선정됐습니다.'],
  ['2017', '청소년 교류 자치기구 US가 푸른성장대상을 받았습니다.'],
  ['2016', '청소년 문화예술 분야에서 구립 청소년시설 우수프로그램 최우수기관에 선정됐습니다.'],
  ['2015', '지역사회 활동 분야 최우수기관으로 선정됐습니다.'],
  ['2014', '도담도담 봉사단의 동네 놀이터 프로젝트가 여성가족부 장관상을 받았습니다.'],
  ['2013', '한국청소년활동진흥원이 센터 활동을 우수 청소년 프로그램으로 선정했습니다.'],
  ['2012', '서울 구립 청소년시설 인센티브 평가에서 최우수기관에 선정됐습니다.'],
  ['2011', '미로찾기 프로그램이 여성가족부 장관상을 받았습니다.'],
  ['2010', '전국 방과후아카데미 평가에서 우수기관에 선정됐습니다.'],
  ['2009', '전국 청소년센터 평가에서 최우수기관에 선정됐습니다.'],
  ['2008', '보건복지가족부 장관 표창을 받았습니다.'],
  ['2007', '전국 청소년방과후아카데미 우수기관으로 선정됐습니다.'],
  ['2006', '청소년 별난시장이 수련활동 프로그램 확산 사업에서 최우수 프로그램에 선정됐습니다.'],
  ['2005', '청소년 방과후아카데미 시범사업을 맡았습니다.'],
  ['2004', '중구청소년자원봉사단이 전국 자원봉사대회에서 수상했습니다.'],
  ['2003', '청소년운영위원회 시밀레가 출범했습니다.'],
  ['2002', '첫 청소년 배낭여행으로 오사카·교토·나라를 찾았습니다.'],
  ['2001', '중구청소년센터가 문을 열었습니다.'],
];

function History() {
  const eras = [
    { id: 'recent', label: '2020–2026', from: 2020, to: 2026 },
    { id: 'tens', label: '2010–2019', from: 2010, to: 2019 },
    { id: 'opening', label: '2001–2009', from: 2001, to: 2009 },
  ];
  return (
    <div className="history-layout">
      <aside>
        <CalendarDays aria-hidden />
        <h2>연도 찾기</h2>
        <nav aria-label="연혁 시기">
          {eras.map((e) => (
            <a href={'#' + e.id} key={e.id}>
              {e.label}
              <ArrowRight size={15} aria-hidden />
            </a>
          ))}
        </nav>
      </aside>
      <div>
        {eras.map((e) => (
          <section key={e.id} id={e.id} aria-label={e.label + '년 연혁'}>
            <ol className="timeline">
              {history
                .filter(([year]) => Number(year) >= e.from && Number(year) <= e.to)
                .map(([year, event]) => (
                  <li key={year}>
                    <time dateTime={year}>{year}</time>
                    <p>{event}</p>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function Organization() {
  return (
    <>
      <section className="org-lead">
        <Landmark size={30} aria-hidden />
        <div>
          <h2>센터 운영 체계</h2>
          <p>관장과 부장이 센터 운영을 총괄하고, 각 팀이 사업과 시설을 맡습니다.</p>
        </div>
      </section>
      <section className="org-directory">
        <h2>팀별 담당 업무</h2>
        <dl>
          {teams.map(([team, role]) => (
            <div key={team}>
              <dt>{team}</dt>
              <dd>{role}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function Character() {
  return (
    <>
      <section className="rami-stage">
        <div>
          <p>중구청소년센터 공식 캐릭터</p>
          <h2>라미</h2>
          <p>
            이름은 ‘동그라미’에서 따왔습니다. 2020년 센터 캐릭터 공모전에 참여한 중구 청소년의 작품입니다.
          </p>
        </div>
        <Image src="/media/about/rami.webp" alt="리본과 새싹을 단 라미" width={209} height={356} />
      </section>
      <section>
        <h2>라미에 담긴 뜻</h2>
        <dl className="rami-key">
          {[
            ['무지개색', '꿈꿀 수 있는 다양한 미래'],
            ['리본', '무한한 가능성과 성장'],
            ['새싹', '계속해서 자라나는 청소년'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2>활동하는 라미</h2>
        <picture className="rami-poses">
          <source
            media="(max-width: 600px)"
            srcSet="/media/about/rami-poses-mobile.webp"
            width={504}
            height={552}
          />
          <Image
            unoptimized
            src="/media/about/rami-poses.webp"
            width={908}
            height={278}
            alt="라미의 동작과 표정 모음"
          />
        </picture>
      </section>
    </>
  );
}

function Greeting() {
  return (
    <section className="welcome-letter">
      <figure>
        <Image
          src="/media/about/welcome.webp"
          width={880}
          height={530}
          alt="중구청소년센터 앞에서 바라본 건물"
          priority
        />
        <figcaption>서울 중구 · 중구청소년센터</figcaption>
      </figure>
      <div>
        <h2>
          청소년이 새로운 활동을
          <br />
          시작하는 곳
        </h2>
        <p>중구청소년센터는 서울특별시 중구가 세우고 행복함께나누는재단이 운영하는 청소년 시설입니다.</p>
        <p>
          문화예술, 청소년 정책, 디지털 기술, 창업까지, 청소년이 직접 기획하고 자기 재능을 펼칠 수 있는 자리를
          마련합니다. 센터의 지도자들도 그 과정에서 청소년과 함께 배웁니다.
        </p>
        <p className="letter-source">중구청소년센터 직원 인사말에서</p>
      </div>
    </section>
  );
}

function ProfileBody({ topic }: { topic: Topic }) {
  switch (topic) {
    case 'foundation':
      return <Foundation />;
    case 'greeting':
      return <Greeting />;
    case 'youth-director':
      return <YouthDirector />;
    case 'history':
      return <History />;
    case 'organization':
      return <Organization />;
    case 'character':
      return <Character />;
  }
}

export default async function Page({ params }: Props) {
  const { topic } = await params;
  const index = profileTopics.findIndex((t) => t.slug === topic);
  const entry = profileTopics[index];
  if (!entry) notFound();
  const next = profileTopics[(index + 1) % profileTopics.length]!;
  return (
    <div className="center-guide profile-page">
      <div className="guide-wrap">
        <Link className="guide-underlink" href="/about#intro">
          <ArrowLeft size={16} aria-hidden />
          센터 안내
        </Link>
        <div className="profile-content">
          <aside className="profile-rail">
            <p>센터 소개</p>
            <nav className="profile-nav" aria-label="센터 소개 메뉴">
              {profileTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={'/about/' + t.slug}
                  aria-current={entry.slug === t.slug ? 'page' : undefined}
                >
                  {t.name}
                </Link>
              ))}
            </nav>
          </aside>
          <article>
            <header>
              <h1>{entry.name}</h1>
            </header>
            <ProfileBody topic={entry.slug} />
            <footer className="profile-footer">
              <a
                className="guide-underlink"
                href={'https://www.j-youth.org/kor/about/' + entry.page + '.php'}
              >
                {entry.name} 공식 원문 <ArrowUpRight size={16} aria-hidden />
              </a>
              <Link href={'/about/' + next.slug}>
                {next.name}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}

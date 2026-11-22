import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
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
      <Image
        className="profile-foundation"
        src="/media/about/foundation.webp"
        width={360}
        height={120}
        alt="행복함께나누는재단"
      />
      <h2>행복함께나누는재단</h2>
      <Facts
        rows={[
          ['설립일', '2011년 4월 21일'],
          ['이사장', '이지윤'],
          ['법인 소재지', '서울특별시 광진구 용마산로22길 26'],
        ]}
      />
      <h2>설립 목적과 비전</h2>
      <p>
        경제적 여건에 관계없이 청소년이 자신의 재능을 발견하고 사회에 기여할 수 있도록 교육과 체험 기회를
        마련합니다. 특히 저소득층과 교육 기회가 부족한 청소년을 꾸준히 지원합니다.
      </p>
      <h2>주요 사업</h2>
      <Facts
        rows={[
          ['인성·창의 활동', '융합교육, DMZ 생태·문화 탐방, 안보 체험, 해외 봉사, 유스히어로 시상'],
          [
            '교육·활동 지원',
            '토요행복학교 영어 멘토링, 지역아동센터 연합 활동, 저소득 가정 청소년 교육·활동비, 청소년 오케스트라 지원',
          ],
        ]}
      />
      <h2>함께하는 기관</h2>
      <Facts rows={network} />
    </>
  );
}

function YouthDirector() {
  return (
    <>
      <p>청소년이 직접 뽑은 대표가 센터 운영에 참여하고 지역 청소년의 의견을 정책으로 제안합니다.</p>
      <h2>선거와 역할</h2>
      <Facts
        rows={[
          [
            '후보 자격',
            '중구에 살거나 중구 소재 학교에 다니는 15~24세 청소년. 중구 꿈드림 소속 청소년도 참여할 수 있습니다.',
          ],
          ['선출', '매년 150명의 선거인단을 모집해 온라인과 현장에서 투표합니다.'],
          ['활동', '공약 이행, 지역 청소년 대표 활동, 센터 운영 참여와 청소년 정책 제안'],
        ]}
      />
      <h2>역대 청소년관장</h2>
      <Facts
        rows={[
          [
            '제3대 · 2026.4~2027.2',
            '소통창구 ‘다 이루어질 라미’와 방학 중 스포츠 대회 2회를 공약으로 제시했습니다. 공식 소개에는 정책 제안 주제가 선정 중으로 안내돼 있습니다.',
          ],
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

function ProfileBody({ topic }: { topic: Topic }) {
  switch (topic) {
    case 'foundation':
      return <Foundation />;
    case 'greeting':
      return (
        <>
          <h2>청소년과 함께 만드는 센터</h2>
          <p>
            서울특별시 중구가 설립한 중구청소년센터는 청소년이 새로운 활동을 시작하고 자기 관심사를 발견할 수
            있는 공간입니다. 운영은 행복함께나누는재단이 맡고 있습니다.
          </p>
          <p>
            센터 직원들은 문화예술, 청소년 정책, 디지털 기술, 창업을 비롯한 다양한 활동에서 청소년이 직접
            기획하고 재능을 펼칠 기회를 만들고 있습니다.
          </p>
        </>
      );
    case 'youth-director':
      return <YouthDirector />;
    case 'history':
      return (
        <>
          <h2>연도별 주요 기록</h2>
          <Facts rows={history} />
        </>
      );
    case 'organization':
      return (
        <>
          <h2>센터 운영과 담당 업무</h2>
          <p>
            관장과 부장을 중심으로 각 팀이 프로그램과 시설을 운영합니다. 담당자별 업무와 직통번호는 공식 직원
            안내에서 확인할 수 있습니다.
          </p>
          <Facts rows={teams} />
        </>
      );
    case 'character':
      return (
        <>
          <h2>중구 청소년이 만든 라미</h2>
          <Image
            src="/media/about/rami.webp"
            alt="중구청소년센터 공식 캐릭터 라미"
            width={680}
            height={340}
            className="profile-character"
          />
          <p>
            2020년 센터 캐릭터 공모전에서 중구 청소년이 디자인한 라미가 선정됐습니다. 이름은 ‘동그라미’에서
            따왔습니다.
          </p>
          <Facts
            rows={[
              ['무지개색', '청소년이 꿈꾸는 다양한 미래'],
              ['리본', '가능성과 성장'],
              ['새싹', '계속해서 자라나는 청소년'],
            ]}
          />
          <h2>라미의 다양한 모습</h2>
          <picture>
            <source media="(max-width: 600px)" srcSet="/media/about/rami-poses-mobile.webp" />
            <img src="/media/about/rami-poses.webp" alt="라미의 동작과 표정 모음" loading="lazy" />
          </picture>
        </>
      );
  }
}

export default async function Page({ params }: Props) {
  const { topic } = await params;
  const entry = profileTopics.find((t) => t.slug === topic);
  if (!entry) notFound();
  return (
    <div className="center-guide profile-page">
      <div className="guide-wrap">
        <Link className="guide-underlink" href="/about#intro">
          <ArrowLeft size={16} aria-hidden />
          센터 안내
        </Link>
        <header>
          <p>센터 소개</p>
          <h1>{entry.name}</h1>
        </header>
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
        <article>
          <ProfileBody topic={entry.slug} />
          <a className="guide-underlink" href={'https://www.j-youth.org/kor/about/' + entry.page + '.php'}>
            {entry.name} 공식 원문 <ArrowUpRight size={16} aria-hidden />
          </a>
        </article>
      </div>
    </div>
  );
}

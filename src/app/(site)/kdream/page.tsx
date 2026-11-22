import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Phone } from 'lucide-react';
import { CENTER } from '@/config/center';
import './kdream.css';

export const metadata: Metadata = {
  title: '중구 꿈드림',
  description:
    '학교 밖 청소년을 위한 상담, 검정고시, 진로 체험부터 건강과 급식까지. 중구 꿈드림의 프로그램과 이용 방법을 확인하세요.',
};

const fields = [
  {
    id: 'counsel',
    name: '상담',
    title: '마음 편히 이야기하고 싶어요',
    icon: '💬',
    body: '개인 상담에서 생활과 관계에 대한 고민을 나눠요. 필요하면 심리검사와 전문 상담을 연결해 드려요.',
  },
  {
    id: 'study',
    name: '교육',
    title: '다시 공부를 시작하고 싶어요',
    icon: '📚',
    body: '검정고시 교재와 일대일 멘토링으로 기초부터 준비해요. 학업 중단을 고민하는 학생은 숙려 기간 중 상담도 받을 수 있어요.',
  },
  {
    id: 'career',
    name: '진로·자립',
    title: '나에게 맞는 일을 찾고 싶어요',
    icon: '🧭',
    body: '직업 체험과 창업 활동으로 관심 있는 일을 직접 해 봐요. 자격증 준비, 직업훈련 연계와 근로 권익 교육도 이용할 수 있어요.',
  },
  {
    id: 'life',
    name: '건강·생활',
    title: '일상을 함께 돌보고 싶어요',
    icon: '🌱',
    body: '센터 방문 식사와 비대면 급식을 지원해요. 무료 건강검진은 만 9~18세가 신청할 수 있어요. 문화 체험과 동아리에서는 또래를 만나요.',
  },
] as const;

const stories = [
  {
    photo: 'education',
    name: '일대일 학습 멘토링',
    alt: '책상에 마주 앉아 교재를 함께 보는 멘토와 청소년',
    detail: '검정고시와 기초학습을 내 진도에 맞춰 준비해요.',
  },
  {
    photo: 'career',
    name: '진로와 직업 체험',
    alt: '직접 구운 빵을 들고 모인 꿈드림 직업 체험 참가자들',
    detail: '관심 있는 직업을 경험하며 나에게 맞는 일을 찾아봐요.',
  },
  {
    photo: 'culture',
    name: '문화 체험과 동아리',
    alt: '현장 체험 공간에서 함께 기념사진을 찍는 꿈드림 참가자들',
    detail: '공연, 나들이, 동아리 활동을 하며 또래와 시간을 보내요.',
  },
] as const;

export default function KdreamPage() {
  return (
    <div className="kdream">
      <section className="dream-intro" aria-labelledby="dream-title">
        <div className="dream-wrap dream-opening">
          <div>
            <p className="dream-kicker">중구학교밖청소년지원센터</p>
            <h1 id="dream-title">
              중구 <em>꿈드림</em>
            </h1>
            <p className="dream-lead">
              학교 밖에서 시작하는 공부와 일상,
              <br />
              꿈드림에서 함께 준비해요.
            </p>
            <a className="dream-primary" href="#participate">
              이용 방법 보기 <ArrowDown size={18} aria-hidden />
            </a>
          </div>
          <Image
            className="dream-cover"
            src="/media/kdream/intro.webp"
            alt="중구 꿈드림 상담 공간 입구"
            width={760}
            height={458}
            priority
            sizes="(min-width: 850px) 49vw, 92vw"
          />
        </div>
      </section>

      <section className="dream-fields" aria-labelledby="fields-title">
        <div className="dream-wrap">
          <h2 id="fields-title">
            지금 내게 <em>필요한 지원</em>은?
          </h2>
          <div className="dream-grid">
            {fields.map((f) => (
              <a href={'#' + f.id} className="dream-tile" key={f.id}>
                <span className="dream-category">{f.name}</span>
                <strong>{f.title}</strong>
                <span className="dream-object" aria-hidden>
                  {f.icon}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="dream-wrap dream-stories" aria-labelledby="stories-title">
        <h2 id="stories-title">꿈드림에서는 이렇게 지내요</h2>
        <div className="dream-photos">
          {stories.map((s) => (
            <figure key={s.photo}>
              <Image
                src={'/media/kdream/' + s.photo + '.webp'}
                alt={s.alt}
                width={760}
                height={540}
                sizes="(min-width: 768px) 32vw, 90vw"
              />
              <figcaption>
                <h3>{s.name}</h3>
                <p>{s.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <div className="dream-wrap dream-details">
        <section aria-labelledby="support-title">
          <h2 id="support-title">분야별 지원 안내</h2>
          <dl>
            {fields.map((f) => (
              <div id={f.id} key={f.id}>
                <dt>{f.name}</dt>
                <dd>{f.body}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section id="participate" aria-labelledby="join-title">
          <h2 id="join-title">꿈드림 이용 방법</h2>
          <dl>
            <div>
              <dt>참여 대상</dt>
              <dd>
                만 9~24세 학교 밖 청소년. 초·중학교 장기 결석(3개월 이상)이나 취학 유예, 고등학교
                미진학·자퇴·제적에 해당하거나 학업 중단을 고민하는 청소년도 상담할 수 있어요.
              </dd>
            </div>
            <div>
              <dt>시간·비용</dt>
              <dd>
                평일 09:00–18:00, 법정공휴일 휴관
                <br />
                연중 상시 모집 · 전액 무료
              </dd>
            </div>
            <div>
              <dt>참여 순서</dt>
              <dd>
                전화·방문 또는 청소년1388에서 신청하면 초기 상담을 진행해요. 필요한 지원을 연결하고 참여
                후에도 상담을 이어가요.
              </dd>
            </div>
            <div>
              <dt>방문·문의</dt>
              <dd>
                {CENTER.address}
                <br />
                <a href="tel:0222500543">02-2250-0543</a> · <a href="tel:0222500544">02-2250-0544</a>
                <br />
                <Link className="dream-directions" href="/about#location">
                  오시는 길 <ArrowRight size={15} aria-hidden />
                </Link>
              </dd>
            </div>
          </dl>
          <div className="dream-actions">
            <a
              className="dream-primary"
              href="https://www.1388.go.kr/ind/YTOSP_SC_IND_01"
              target="_blank"
              rel="noopener noreferrer"
            >
              청소년1388 온라인 신청 <ArrowUpRight size={17} aria-hidden />
              <span className="sr-only">새 창</span>
            </a>
            <a href="tel:0222500543" className="dream-call">
              <Phone size={16} aria-hidden />
              전화 문의
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

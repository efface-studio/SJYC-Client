import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ZoomIn } from 'lucide-react';
import '../about.css';
import './cafe.css';

// 안내·사진·메뉴판 출처: https://www.j-youth.org/kor/about/facilities03.php
const media = '/media/about/cafe-lala';

export const metadata: Metadata = {
  title: '카페 라라 · 센터 안내',
  description: '중구청소년센터 지하 1층 카페 라라의 공간 사진, 운영시간, 메뉴와 회원 혜택을 확인하세요.',
};

export default function CafeLalaPage() {
  return (
    <article className="center-guide cafe-page">
      <div className="guide-wrap cafe-wrap">
        <Link className="guide-underlink cafe-back" href="/about#floors">
          <ArrowLeft size={16} aria-hidden /> 센터 안내
        </Link>
        <header className="cafe-heading">
          <div>
            <h1>카페 라라</h1>
            <p>
              센터 지하 1층에서 음료와 디저트를 즐길 수 있는 카페입니다. 중구 안팎의 어린이와 청소년, 지역
              주민 누구나 들러 쉬어 갈 수 있습니다.
            </p>
          </div>
          <Image
            src={media + '/wordmark.webp'}
            width={910}
            height={200}
            alt="라미라운지 카페 라라 로고"
            sizes="(max-width: 700px) 70vw, 320px"
          />
        </header>
        <div className="cafe-photos">
          <figure>
            <Image
              src={media + '/lounge.webp'}
              width={445}
              height={250}
              sizes="(max-width: 600px) 92vw, 520px"
              alt="노란 벤치와 원형 테이블이 놓인 카페 라라의 좌석 공간"
              priority
            />
            <figcaption>라운지 좌석</figcaption>
          </figure>
          <figure>
            <Image
              src={media + '/counter.webp'}
              width={445}
              height={250}
              sizes="(max-width: 600px) 92vw, 520px"
              alt="음료를 주문하는 카운터와 디저트 진열대"
            />
            <figcaption>주문 카운터</figcaption>
          </figure>
        </div>
        <div className="cafe-visit">
          <section aria-labelledby="cafe-info">
            <h2 id="cafe-info">이용 안내</h2>
            <dl className="guide-rows">
              <div>
                <dt>운영시간</dt>
                <dd>
                  <strong>화요일–토요일 08:30–19:30</strong>
                  <br />
                  일요일·월요일·법정공휴일은 쉽니다.
                </dd>
              </div>
              <div>
                <dt>위치</dt>
                <dd>
                  중구청소년센터 지하 1층
                  <br />
                  약수역 5번 출구에서 도보 약 3분
                </dd>
              </div>
              <div>
                <dt>회원 혜택</dt>
                <dd>
                  초등학교 1학년부터 만 24세까지는 10% 할인과 포인트 적립을 받을 수 있습니다. 그 외 회원은
                  10%를 포인트로 적립합니다.
                </dd>
              </div>
              <div>
                <dt>청소년 회원</dt>
                <dd>가입할 때 카운터에 청소년 회원 등급 적용을 요청해 주세요.</dd>
              </div>
              <div>
                <dt>카페 문의</dt>
                <dd>
                  <a className="guide-underlink" href="tel:0222500570">
                    02-2250-0570
                  </a>
                </dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="cafe-menu">
            <h2 id="cafe-menu">메뉴</h2>
            <p>
              아메리카노는 따뜻하게 1,500원, 차갑게 2,000원입니다. 라테와 에이드, 차, 쿠키와 샌드위치도
              준비되어 있습니다.
            </p>
            <a className="cafe-menu-link" href={media + '/menu.jpg'}>
              <Image
                src={media + '/menu.jpg'}
                width={608}
                height={758}
                sizes="(max-width: 600px) 88vw, 380px"
                alt="카페 라라 음료와 디저트 가격표"
              />
              <span>
                <ZoomIn size={17} aria-hidden /> 메뉴판 크게 보기
              </span>
            </a>
          </section>
        </div>
      </div>
    </article>
  );
}

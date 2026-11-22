'use client';

import { ArrowDown, ArrowUpRight, Pause, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CENTER } from '@/config/center';

const MOVIE = '/media/center-film.mp4';
const PLAYBACK_RATE = 1.2;
const POSTER = '/media/center-film-poster.webp';

export function CenterFilm() {
  const film = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = film.current;
    if (!video) return;
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const followPreference = () => {
      if (motion.matches) video.pause();
      else {
        if (!video.src) video.src = MOVIE;
        void video.play().catch(() => {});
      }
    };
    followPreference();
    motion.addEventListener('change', followPreference);
    return () => motion.removeEventListener('change', followPreference);
  }, []);

  function toggle() {
    const video = film.current;
    if (!video) return;
    if (video.paused) {
      if (!video.src) video.src = MOVIE;
      void video.play().catch(() => {});
    } else video.pause();
  }

  return (
    <section className="center-film" aria-labelledby="film-title">
      <video
        ref={film}
        muted
        playsInline
        loop
        preload="none"
        poster={POSTER}
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        hidden={failed}
      />
      <h1 id="film-title">
        <Image
          src="/brand/logo-on-dark.png"
          alt={CENTER.formalName}
          width={300}
          height={50}
          unoptimized
          priority
        />
      </h1>
      <div className="film-controls container-page">
        <a href="#explore" className="film-explore">
          <ArrowDown aria-hidden size={17} /> 센터 둘러보기
        </a>
        <div className="film-tools">
          {!failed && (
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? '배경 영상 일시정지' : '배경 영상 재생'}
            >
              {playing ? <Pause aria-hidden size={17} /> : <Play aria-hidden size={17} />}
            </button>
          )}
          <Link href="https://www.youtube.com/watch?v=XFs71iyvkv0" target="_blank" rel="noopener noreferrer">
            원본 영상 <ArrowUpRight aria-hidden size={15} />
            <span className="sr-only">(새 창)</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

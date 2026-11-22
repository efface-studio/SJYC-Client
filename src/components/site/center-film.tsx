'use client';

import { ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/features/settings/use-settings';

const PLAYBACK_RATE = 1.2;

export function CenterFilm() {
  const settings = useSiteSettings();
  const movie = settings.film;
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
        if (video.getAttribute('src') !== movie) video.src = movie;
        void video.play().catch(() => {});
      }
    };
    followPreference();
    motion.addEventListener('change', followPreference);
    return () => motion.removeEventListener('change', followPreference);
  }, [movie]);

  function toggle() {
    const video = film.current;
    if (!video) return;
    if (video.paused) {
      if (video.getAttribute('src') !== movie) video.src = movie;
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
        poster={settings.poster}
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        hidden={failed}
      />
      <h1 id="film-title">
        <Image
          src={settings.heroLogo}
          alt={settings.formalName}
          width={474}
          height={75}
          unoptimized
          priority
        />
      </h1>
      <span className="film-scroll-cue" aria-hidden="true">
        <ArrowDown size={24} strokeWidth={1.5} />
      </span>
      {!failed && (
        <button type="button" className="film-playback sr-only" onClick={toggle}>
          {playing ? '배경 영상 일시정지' : '배경 영상 재생'}
        </button>
      )}
    </section>
  );
}

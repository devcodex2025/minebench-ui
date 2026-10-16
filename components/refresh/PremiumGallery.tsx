'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import '@/components/reactbits/ScreenshotCarousel.css';

import wallet from '@/public/screenshots/premium/wallet-and-pool.png';
import pool from '@/public/screenshots/premium/pool-selection.png';
import stratum from '@/public/screenshots/premium/custom-stratum.png';

type ScreenshotItem = { src: string; width: number; height: number; alt: string };

const screenshots: ScreenshotItem[] = [
  { src: wallet.src, width: wallet.width, height: wallet.height, alt: 'MineBench Premium wallet and pool settings' },
  { src: pool.src, width: pool.width, height: pool.height, alt: 'MineBench Premium pool selection' },
  { src: stratum.src, width: stratum.width, height: stratum.height, alt: 'MineBench Premium custom Stratum settings' },
];

const loadCarousel = () => import('@/components/reactbits/ScreenshotCarousel');

export default function PremiumGallery() {
  const [activated, setActivated] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [Carousel, setCarousel] = useState<ComponentType<{ items: ScreenshotItem[] }> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || activated) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActivated(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(root);
    return () => observer.disconnect();
  }, [activated]);

  useEffect(() => {
    if (!activated || Carousel) return;
    setLoadError(false);
    loadCarousel()
      .then((module) => setCarousel(() => module.default))
      .catch(() => setLoadError(true));
  }, [activated, Carousel, loadAttempt]);

  const first = screenshots[0];
  return (
    <div ref={rootRef}>
      {Carousel ? <Carousel items={screenshots} /> : (
        <section className="premium-gallery rb-screenshot-carousel" aria-label="Premium screenshots" aria-roledescription="carousel">
          <div className="rb-screenshot-window relative" style={{ aspectRatio: Math.min(...screenshots.map(item => item.width / item.height)) }}>
          <Image src={first.src} alt={first.alt} width={first.width} height={first.height} sizes="(max-width: 768px) 92vw, 860px" className="absolute inset-0 h-full w-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-sm font-semibold text-white">{first.alt}</p>
            <button type="button" onClick={() => { setLoadAttempt((attempt) => attempt + 1); setActivated(true); }} className="mt-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              {loadError ? 'Retry gallery' : activated ? 'Loading gallery…' : 'Explore gallery'}
            </button>
          </div>
          </div>
          <div className="rb-screenshot-controls" aria-hidden="true"><button type="button" disabled>‹</button><div className="rb-screenshot-dots"><button type="button" disabled><span /></button><button type="button" disabled><span /></button><button type="button" disabled><span /></button></div><button type="button" disabled>›</button></div>
        </section>
      )}
    </div>
  );
}

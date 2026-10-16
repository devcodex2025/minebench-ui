'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import type { ShaderSlide } from './ShaderScreenshotSlider';

type DeferredScreenshotGalleryProps = {
  slides: ShaderSlide[];
};

export default function DeferredScreenshotGallery({ slides }: DeferredScreenshotGalleryProps) {
  const [activated, setActivated] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [Slider, setSlider] = useState<ComponentType<{ slides: ShaderSlide[] }> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || activated) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [activated]);

  useEffect(() => {
    if (!activated || Slider) return;
    setLoadError(false);
    import('./ShaderScreenshotSlider')
      .then((module) => setSlider(() => module.default))
      .catch(() => setLoadError(true));
  }, [activated, Slider, loadAttempt]);

  const firstSlide = slides[0];
  if (!firstSlide) return null;

  return (
    <div className="relative">
      {Slider ? (
        <Slider slides={slides} />
      ) : (
        <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-zinc-950/85 p-4 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.9)] sm:p-6">
          <div className="relative mx-auto mt-8 w-full max-w-[1180px] pt-20 sm:pt-16">
            <div ref={rootRef} className="relative mx-auto aspect-[16/10] w-[86%] overflow-hidden rounded-[1.8rem] border border-white/10 bg-zinc-900/90 md:w-1/2">
              <Image
                src={firstSlide.src}
                alt={firstSlide.title}
                fill
                sizes="(max-width: 768px) 92vw, 860px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.02),rgba(7,9,12,0.82))]" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-yellow-300">{firstSlide.eyebrow}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-white">{firstSlide.title}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">{firstSlide.description}</p>
                <button
                  type="button"
                  onClick={() => { setLoadAttempt((attempt) => attempt + 1); setActivated(true); }}
                  className="pointer-events-auto mt-4 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 backdrop-blur-sm"
                >
                  {loadError ? 'Retry screenshots' : activated ? 'Loading screenshots…' : 'Explore screenshots'}
                </button>
              </div>
            </div>
            <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center text-center">
              <div className="mt-6 flex items-center justify-center gap-4" aria-hidden="true">
                <span className="h-12 w-12 rounded-full border border-white/10 bg-white/5" />
                <span className="h-2.5 w-8 rounded-full bg-yellow-400" />
                <span className="h-12 w-12 rounded-full border border-white/10 bg-white/5" />
              </div>
              <div className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Drag or tap</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

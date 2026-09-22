'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import clsx from 'clsx';

export type ShowcaseSlide = {
  src: string;
  title: string;
  caption: string;
  eyebrow?: string;
};

type AppShowcaseCarouselProps = {
  slides: ShowcaseSlide[];
  className?: string;
  compact?: boolean;
};

export default function AppShowcaseCarousel({
  slides,
  className,
  compact = false,
}: AppShowcaseCarouselProps) {
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 4200,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      loop: true,
      skipSnaps: false,
    },
    [autoplay]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className={clsx('surface-panel overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
        <div>
          <p className="section-kicker">Product Screens</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Benchmark flow, live pool data, and miner controls
          </h3>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={scrollPrev}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[hsl(var(--accent))] hover:bg-white/10"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={scrollNext}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[hsl(var(--accent))] hover:bg-white/10"
          >
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-4 pb-4 pt-4 sm:px-6 sm:pb-6" ref={emblaRef}>
        <div className="-ml-4 flex">
          {slides.map((slide, index) => (
            <div
              key={`${slide.src}-${slide.title}`}
              className={clsx(
                'min-w-0 flex-[0_0_88%] pl-4 md:flex-[0_0_62%]',
                compact && 'md:flex-[0_0_52%]'
              )}
            >
              <article className="group h-full rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-white/8 bg-[hsl(var(--panel-strong))]">
                  <Image
                    src={slide.src}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,15,0.02),rgba(8,10,15,0.55))]" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent))] backdrop-blur-sm">
                    {slide.eyebrow ?? 'MineBench'}
                  </div>
                </div>
                <div className="px-2 pb-2 pt-4">
                  <h4 className="text-lg font-semibold tracking-tight text-white">
                    {slide.title}
                  </h4>
                  <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[hsl(var(--text-muted))]">
                    {slide.caption}
                  </p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-2">
          {slides.map((slide, index) => (
            <button
              key={`${slide.title}-dot`}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={clsx(
                'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all',
                selectedIndex === index
                  ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-ink))]'
                  : 'border-white/10 bg-white/5 text-[hsl(var(--text-muted))] hover:border-white/20 hover:text-white'
              )}
            >
              {slide.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={scrollPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[hsl(var(--accent))]"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={scrollNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[hsl(var(--accent))]"
          >
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { ArrowLeft, ArrowsOutSimple, CaretLeft, CaretRight } from '@phosphor-icons/react';
import clsx from 'clsx';

export type ShaderSlide = {
  description: string;
  eyebrow: string;
  src: string;
  title: string;
};

type ShaderScreenshotSliderProps = {
  slides: ShaderSlide[];
};

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

const SIDE_DRAG_DISTANCE = 220;
const SIDE_DRAG_COMMIT = 120;
const DRAG_SPRING = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

export default function ShaderScreenshotSlider({
  slides,
}: ShaderScreenshotSliderProps) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<'left' | 'right' | null>(null);
  const suppressNextClickRef = useRef(false);
  const leftDragX = useMotionValue(0);
  const rightDragX = useMotionValue(0);
  const leftDragProgress = useTransform(leftDragX, [0, SIDE_DRAG_DISTANCE], [0, 1]);
  const rightDragProgress = useTransform(rightDragX, [-SIDE_DRAG_DISTANCE, 0], [1, 0]);
  const activeDragProgress = useTransform(() =>
    Math.max(leftDragProgress.get(), rightDragProgress.get())
  );
  const leftAutoX = useTransform(leftDragProgress, [0, 1], [0, 176]);
  const rightAutoX = useTransform(rightDragProgress, [0, 1], [0, -176]);
  const centerShiftX = useTransform(
    () => (leftDragProgress.get() - rightDragProgress.get()) * 112
  );
  const centerScale = useTransform(() => 1 - activeDragProgress.get() * 0.18);
  const centerOpacity = useTransform(() => 1 - activeDragProgress.get() * 0.42);
  const centerRotateY = useTransform(
    () => (rightDragProgress.get() - leftDragProgress.get()) * 16
  );
  const leftScale = useTransform(leftDragProgress, [0, 1], [0.91, 1.08]);
  const leftY = useTransform(leftDragProgress, [0, 1], [34, 6]);
  const leftRotateY = useTransform(leftDragProgress, [0, 1], [26, 0]);
  const leftRotateZ = useTransform(leftDragProgress, [0, 1], [-2.5, 0]);
  const leftOpacity = useTransform(leftDragProgress, [0, 1], [0.58, 1]);
  const rightScale = useTransform(rightDragProgress, [0, 1], [0.91, 1.08]);
  const rightY = useTransform(rightDragProgress, [0, 1], [34, 6]);
  const rightRotateY = useTransform(rightDragProgress, [0, 1], [-26, 0]);
  const rightRotateZ = useTransform(rightDragProgress, [0, 1], [2.5, 0]);
  const rightOpacity = useTransform(rightDragProgress, [0, 1], [0.58, 1]);

  const visibleSlides = useMemo(() => {
    if (slides.length === 0) {
      return [];
    }

    return [
      { index: wrapIndex(activeIndex - 1, slides.length), slot: 'left' as const },
      { index: activeIndex, slot: 'center' as const },
      { index: wrapIndex(activeIndex + 1, slides.length), slot: 'right' as const },
    ];
  }, [activeIndex, slides.length]);

  const resetSideDragPreview = (instant = false) => {
    if (instant) {
      leftDragX.set(0);
      rightDragX.set(0);
      return;
    }

    animate(leftDragX, 0, DRAG_SPRING);
    animate(rightDragX, 0, DRAG_SPRING);
  };

  const markDragInteraction = () => {
    suppressNextClickRef.current = true;
  };

  const goTo = (index: number) => {
    const next = wrapIndex(index, slides.length);
    if (next === activeIndex) {
      return;
    }

    resetSideDragPreview(true);
    setDraggingSlot(null);
    const forwardSteps = wrapIndex(next - activeIndex, slides.length);
    const backwardSteps = wrapIndex(activeIndex - next, slides.length);
    setDirection(forwardSteps <= backwardSteps ? 1 : -1);
    setActiveIndex(next);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 4) {
      suppressNextClickRef.current = true;
    }

    if (Math.abs(info.offset.x) < 80) {
      return;
    }

    goTo(activeIndex + (info.offset.x < 0 ? 1 : -1));
  };

  const handleSideDragEnd = (
    slot: 'left' | 'right',
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setDraggingSlot(null);
    if (Math.abs(info.offset.x) > 4) {
      suppressNextClickRef.current = true;
    }

    const shouldCommit =
      slot === 'left' ? info.offset.x > SIDE_DRAG_COMMIT : info.offset.x < -SIDE_DRAG_COMMIT;

    if (shouldCommit) {
      goTo(activeIndex + (slot === 'left' ? -1 : 1));
      return;
    }

    resetSideDragPreview();
  };

  const goPrevious = () => {
    goTo(activeIndex - 1);
  };

  const goNext = () => {
    goTo(activeIndex + 1);
  };

  const openExpanded = (index: number) => {
    setExpandedIndex(index);
  };

  const openExpandedFromClick = (
    index: number,
    event: ReactMouseEvent<HTMLButtonElement>
  ) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    openExpanded(index);
  };

  const closeExpanded = () => {
    setExpandedIndex(null);
  };

  const stepExpanded = (delta: number) => {
    setExpandedIndex((current) => {
      if (current === null) {
        return current;
      }

      return wrapIndex(current + delta, slides.length);
    });
  };

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[activeIndex];
  const expandedSlide = expandedIndex === null ? null : slides[expandedIndex];
  const leftVisibleSlide = visibleSlides[0];
  const centerVisibleSlide = visibleSlides[1];
  const rightVisibleSlide = visibleSlides[2];
  const leftSlide = slides[leftVisibleSlide.index];
  const centerSlide = slides[centerVisibleSlide.index];
  const rightSlide = slides[rightVisibleSlide.index];

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-zinc-950/85 p-4 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.9)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        animate={
          reducedMotion
            ? undefined
            : {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }
        }
        transition={{
          duration: 14,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{
          backgroundImage:
            'linear-gradient(120deg, transparent 10%, rgba(250,204,21,0.18) 42%, transparent 62%)',
          backgroundSize: '180% 180%',
        }}
      />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-300 backdrop-blur-sm">
          <ArrowsOutSimple size={16} weight="bold" className="text-yellow-300" />
          Click any slide to expand
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 z-20 max-w-[19rem] pr-4 sm:max-w-[21rem]">
          <div className="rounded-[1.35rem] border border-white/10 bg-black/30 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              Active screen
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-[1.35rem]">
              {activeSlide.title}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-zinc-400 sm:text-[13px]">
              {activeSlide.description}
            </p>
          </div>
        </div>

        <div
          className="relative mx-auto mt-8 w-full max-w-[1180px] pt-20 sm:pt-16"
          style={{ perspective: '2200px' }}
        >
          <div className="mx-auto w-[86%] md:hidden">
            {visibleSlides
              .filter(({ slot }) => slot === 'center')
              .map(({ index, slot }) => {
                const slide = slides[index];

                return (
                  <motion.button
                    key={`${slot}-${slide.src}-mobile`}
                    type="button"
                    onClick={(event) => openExpandedFromClick(index, event)}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.08}
                    onDragStart={markDragInteraction}
                    onDragEnd={handleDragEnd}
                    initial={
                      reducedMotion
                        ? false
                        : {
                            opacity: 0.7,
                            scale: 0.95,
                          }
                    }
                    animate={{
                      opacity: 1,
                      rotateY: 0,
                      scale: 1,
                      y: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 180,
                      damping: 24,
                      mass: 0.9,
                    }}
                    className="relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-zinc-900/90 text-left shadow-[0_24px_80px_-34px_rgba(0,0,0,0.92)] cursor-grab active:cursor-grabbing"
                    style={{ transformStyle: 'preserve-3d' }}
                    aria-label={`Open ${slide.title}`}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.8rem]">
                      <Image
                        src={slide.src}
                        alt={slide.title}
                        fill
                        sizes="86vw"
                        className="rounded-[1.8rem] object-cover scale-[1.02] transition-transform duration-700"
                        priority
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.02),rgba(7,9,12,0.78))]" />
                      <motion.div
                        aria-hidden
                        className="absolute inset-0 mix-blend-screen"
                        animate={
                          reducedMotion
                            ? undefined
                            : {
                                opacity: [0.36, 0.6, 0.36],
                                x: direction >= 0 ? ['-6%', '8%', '-6%'] : ['6%', '-8%', '6%'],
                              }
                        }
                        transition={{
                          duration: 7.2,
                          ease: 'easeInOut',
                          repeat: Infinity,
                        }}
                        style={{
                          background:
                            'radial-gradient(circle at 18% 18%, rgba(250,204,21,0.28), transparent 30%), linear-gradient(130deg, transparent 22%, rgba(255,255,255,0.12) 48%, transparent 72%)',
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                        <div className="inline-flex rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-300 backdrop-blur-sm">
                          {slide.eyebrow}
                        </div>
                        <p className="mt-3 max-w-[18ch] text-lg font-semibold tracking-tight text-white sm:text-xl">
                          {slide.title}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-200">
                          <ArrowsOutSimple size={14} weight="bold" />
                          Expand
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
          </div>

          <div className="hidden items-end justify-center gap-5 md:flex lg:gap-6">
            <motion.div
              key={`left-${leftSlide.src}-desktop`}
              className={clsx('relative w-[28%] shrink-0', draggingSlot === 'left' ? 'z-40' : 'z-10')}
              style={{
                x: leftAutoX,
                opacity: leftOpacity,
                scale: leftScale,
                y: leftY,
                rotateY: leftRotateY,
                rotateZ: leftRotateZ,
                transformOrigin: 'right center',
                transformStyle: 'preserve-3d',
              }}
            >
              <motion.button
                type="button"
                onClick={(event) => openExpandedFromClick(leftVisibleSlide.index, event)}
                drag="x"
                dragMomentum={false}
                dragConstraints={{ left: 0, right: SIDE_DRAG_DISTANCE }}
                dragElastic={0.12}
                onDragStart={() => {
                  markDragInteraction();
                  setDraggingSlot('left');
                }}
                onDragEnd={(event, info) => handleSideDragEnd('left', event, info)}
                className="relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-zinc-900/90 text-left shadow-[0_24px_80px_-34px_rgba(0,0,0,0.92)] cursor-grab active:cursor-grabbing"
                style={{
                  x: leftDragX,
                }}
                aria-label={`Open ${leftSlide.title}`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.8rem]">
                  <Image
                    src={leftSlide.src}
                    alt={leftSlide.title}
                    fill
                    sizes="(max-width: 1024px) 24vw, 22vw"
                    className="rounded-[1.8rem] object-cover scale-[1.08] saturate-[0.8] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.02),rgba(7,9,12,0.78))]" />
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 mix-blend-screen"
                    animate={
                      reducedMotion
                        ? undefined
                        : {
                            opacity: [0.36, 0.6, 0.36],
                            x: direction >= 0 ? ['-6%', '8%', '-6%'] : ['6%', '-8%', '6%'],
                          }
                    }
                    transition={{
                      duration: 7.2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                    style={{
                      background:
                        'radial-gradient(circle at 18% 18%, rgba(250,204,21,0.28), transparent 30%), linear-gradient(130deg, transparent 22%, rgba(255,255,255,0.12) 48%, transparent 72%)',
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <div className="inline-flex rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-300 backdrop-blur-sm">
                      {leftSlide.eyebrow}
                    </div>
                    <p className="mt-3 max-w-[18ch] text-lg font-semibold tracking-tight text-white sm:text-xl">
                      {leftSlide.title}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-200">
                      <ArrowsOutSimple size={14} weight="bold" />
                      Expand
                    </div>
                  </div>
                </div>
              </motion.button>
            </motion.div>

            <motion.div
              key={`center-${centerSlide.src}-desktop-wrapper`}
              className="relative z-30 w-[50%] shrink-0"
              style={{
                x: centerShiftX,
                scale: centerScale,
                opacity: centerOpacity,
                rotateY: centerRotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              <motion.button
                type="button"
                onClick={(event) => openExpandedFromClick(centerVisibleSlide.index, event)}
                drag="x"
                dragMomentum={false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragStart={markDragInteraction}
                onDragEnd={handleDragEnd}
                className="relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-zinc-900/90 text-left shadow-[0_24px_80px_-34px_rgba(0,0,0,0.92)] cursor-grab active:cursor-grabbing"
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center center',
                }}
                aria-label={`Open ${centerSlide.title}`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.8rem]">
                  <Image
                    src={centerSlide.src}
                    alt={centerSlide.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 48vw"
                    className="rounded-[1.8rem] object-cover scale-[1.02] transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.02),rgba(7,9,12,0.78))]" />
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 mix-blend-screen"
                    animate={
                      reducedMotion
                        ? undefined
                        : {
                            opacity: [0.36, 0.6, 0.36],
                            x: direction >= 0 ? ['-6%', '8%', '-6%'] : ['6%', '-8%', '6%'],
                          }
                    }
                    transition={{
                      duration: 7.2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                    style={{
                      background:
                        'radial-gradient(circle at 18% 18%, rgba(250,204,21,0.28), transparent 30%), linear-gradient(130deg, transparent 22%, rgba(255,255,255,0.12) 48%, transparent 72%)',
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <div className="inline-flex rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-300 backdrop-blur-sm">
                      {centerSlide.eyebrow}
                    </div>
                    <p className="mt-3 max-w-[18ch] text-lg font-semibold tracking-tight text-white sm:text-xl">
                      {centerSlide.title}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-200">
                      <ArrowsOutSimple size={14} weight="bold" />
                      Expand
                    </div>
                  </div>
                </div>
              </motion.button>
            </motion.div>

            <motion.div
              key={`right-${rightSlide.src}-desktop`}
              className={clsx('relative w-[28%] shrink-0', draggingSlot === 'right' ? 'z-40' : 'z-10')}
              style={{
                x: rightAutoX,
                opacity: rightOpacity,
                scale: rightScale,
                y: rightY,
                rotateY: rightRotateY,
                rotateZ: rightRotateZ,
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
              }}
            >
              <motion.button
                type="button"
                onClick={(event) => openExpandedFromClick(rightVisibleSlide.index, event)}
                drag="x"
                dragMomentum={false}
                dragConstraints={{ left: -SIDE_DRAG_DISTANCE, right: 0 }}
                dragElastic={0.12}
                onDragStart={() => {
                  markDragInteraction();
                  setDraggingSlot('right');
                }}
                onDragEnd={(event, info) => handleSideDragEnd('right', event, info)}
                className="relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-zinc-900/90 text-left shadow-[0_24px_80px_-34px_rgba(0,0,0,0.92)] cursor-grab active:cursor-grabbing"
                style={{
                  x: rightDragX,
                }}
                aria-label={`Open ${rightSlide.title}`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.8rem]">
                  <Image
                    src={rightSlide.src}
                    alt={rightSlide.title}
                    fill
                    sizes="(max-width: 1024px) 24vw, 22vw"
                    className="rounded-[1.8rem] object-cover scale-[1.08] saturate-[0.8] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.02),rgba(7,9,12,0.78))]" />
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 mix-blend-screen"
                    animate={
                      reducedMotion
                        ? undefined
                        : {
                            opacity: [0.36, 0.6, 0.36],
                            x: direction >= 0 ? ['-6%', '8%', '-6%'] : ['6%', '-8%', '6%'],
                          }
                    }
                    transition={{
                      duration: 7.2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                    style={{
                      background:
                        'radial-gradient(circle at 18% 18%, rgba(250,204,21,0.28), transparent 30%), linear-gradient(130deg, transparent 22%, rgba(255,255,255,0.12) 48%, transparent 72%)',
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <div className="inline-flex rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-300 backdrop-blur-sm">
                      {rightSlide.eyebrow}
                    </div>
                    <p className="mt-3 max-w-[18ch] text-lg font-semibold tracking-tight text-white sm:text-xl">
                      {rightSlide.title}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-200">
                      <ArrowsOutSimple size={14} weight="bold" />
                      Expand
                    </div>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center text-center">
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrevious}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black active:scale-[0.97]"
              aria-label="Previous screenshot"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <div className="flex items-center justify-center gap-2">
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => goTo(index)}
                    className={clsx(
                      'h-2.5 rounded-full transition-all duration-300',
                      isActive
                        ? 'w-8 bg-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.4)]'
                        : 'w-2.5 bg-white/22 hover:bg-white/50'
                    )}
                    aria-label={`Go to ${slide.title}`}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black active:scale-[0.97]"
              aria-label="Next screenshot"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>

          <div className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Drag or tap
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expandedSlide && expandedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/92 px-4 py-8 backdrop-blur-xl sm:py-10 md:px-10 md:py-14"
            onClick={closeExpanded}
          >
            <motion.div
              key={expandedSlide.src}
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
              className="relative flex min-h-full w-full max-w-6xl flex-col items-center justify-center py-4 sm:py-6"
            >
              <motion.button
                type="button"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                onClick={(event) => {
                  event.stopPropagation();
                  closeExpanded();
                }}
                className="mb-4 inline-flex h-12 self-start items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-white transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black sm:mb-5"
                aria-label="Close expanded screenshot"
              >
                <ArrowLeft size={18} weight="bold" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                  Close
                </span>
              </motion.button>

              <div className="relative w-full">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    stepExpanded(-1);
                  }}
                  className="absolute left-3 top-1/2 z-[10000] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-[0_16px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black md:-left-6"
                  aria-label="Previous expanded screenshot"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    stepExpanded(1);
                  }}
                  className="absolute right-3 top-1/2 z-[10000] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-[0_16px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black md:-right-6"
                  aria-label="Next expanded screenshot"
                >
                  <CaretRight size={20} weight="bold" />
                </button>

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-[0_40px_120px_-42px_rgba(0,0,0,0.95)]">
                  <Image
                    src={expandedSlide.src}
                    alt={expandedSlide.title}
                    fill
                    sizes="90vw"
                    className="rounded-[2rem] object-cover scale-[1.015]"
                    priority
                  />
                </div>
              </div>
              <div className="mt-4 w-full rounded-[1.6rem] border border-white/10 bg-black/28 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm sm:p-6">
                <div className="inline-flex rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-300 backdrop-blur-sm">
                  {expandedSlide.eyebrow}
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {expandedSlide.title}
                </p>
                <p className="mt-2 max-w-[70ch] text-sm leading-6 text-zinc-300">
                  {expandedSlide.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

'use client';

// Adapted from React Bits, commit 3a1c7f2f9f94ed833934ab5c2635760b9e644583.
// MIT + Commons Clause: vendor/REACT-BITS-LICENSE.md.
import { animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

type CountUpProps = { to: number; format: (value: number) => string; className?: string };

export default function CountUp({ to, format, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.textContent = format(to);
    if (started.current) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    const finish = () => {
      started.current = true;
      stop?.();
      observer?.disconnect();
      element.textContent = format(to);
    };
    const preference = () => { if (media.matches) finish(); };
    if (media.matches || !('IntersectionObserver' in window)) {
      finish();
      return;
    }
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      observer?.disconnect();
      const controls = animate(0, to, {
        duration: 0.5, ease: 'easeOut',
        onUpdate: value => { element.textContent = format(value); },
        onComplete: () => { element.textContent = format(to); }
      });
      stop = () => controls.stop();
    });
    observer.observe(element);
    media.addEventListener('change', preference);
    return () => {
      stop?.();
      observer?.disconnect();
      media.removeEventListener('change', preference);
      element.textContent = format(to);
    };
  }, [to, format]);
  return <span className={className}><span ref={ref} aria-hidden="true">{format(to)}</span><span className="sr-only">{to.toLocaleString('en-US')}</span></span>;
}

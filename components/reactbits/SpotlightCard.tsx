'use client';

// Adapted from React Bits, commit 3a1c7f2f9f94ed833934ab5c2635760b9e644583.
// MIT + Commons Clause: vendor/REACT-BITS-LICENSE.md.
import { useEffect, useRef, type HTMLAttributes } from 'react';
import './SpotlightCard.css';

export default function SpotlightCard({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      element.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    };
    const sync = () => {
      element.removeEventListener('pointermove', move);
      if (media.matches) element.addEventListener('pointermove', move, { passive: true });
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      element.removeEventListener('pointermove', move);
      media.removeEventListener('change', sync);
    };
  }, []);
  return <div ref={ref} className={`rb-spotlight-card ${className}`} {...props}>{children}</div>;
}

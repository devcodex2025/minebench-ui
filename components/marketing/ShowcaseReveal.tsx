'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function ShowcaseReveal({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setRevealed(true);
      observer.disconnect();
    }, { rootMargin: '64px' });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} className="relative overflow-hidden rounded-[20px]">
      {children}
      <div
        className={`pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(250,204,21,0.16),transparent_34%,rgba(255,255,255,0.08),transparent_68%)] transition-opacity duration-700 ${revealed ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      />
    </div>
  );
}

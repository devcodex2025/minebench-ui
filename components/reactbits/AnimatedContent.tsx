'use client';

// Adapted from React Bits, commit 3a1c7f2f9f94ed833934ab5c2635760b9e644583.
// MIT + Commons Clause: vendor/REACT-BITS-LICENSE.md.
import { useEffect, useRef, type HTMLAttributes } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type AnimatedContentProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'li';
  distance?: number;
  duration?: number;
  delay?: number;
  blur?: boolean;
};

export default function AnimatedContent({ as: Tag = 'div', distance = 14, duration = 0.4, delay = 0, blur = false, children, ...props }: AnimatedContentProps) {
  const ref = useRef<HTMLElement | null>(null);
  const entered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || entered.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (entered.current) return;
      const tween = gsap.fromTo(element,
        { opacity: 0, y: distance, filter: blur ? 'blur(6px)' : 'none' },
        { opacity: 1, y: 0, filter: 'none', duration, delay, ease: 'power2.out',
          clearProps: 'opacity,transform,filter',
          scrollTrigger: { trigger: element, start: 'top 95%', once: true,
            onEnter: () => { entered.current = true; } }
        });
      const reveal = () => {
        entered.current = true;
        tween.scrollTrigger?.kill();
        tween.progress(1).pause();
      };
      const revealAnchor = () => {
        let id = window.location.hash.slice(1);
        try { id = decodeURIComponent(id); } catch { /* Invalid fragment: use literal. */ }
        const target = id ? document.getElementById(id) : null;
        if (target && (element.contains(target) || target.contains(element))) reveal();
      };
      const revealSearch = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') reveal();
      };
      element.addEventListener('focusin', reveal);
      element.addEventListener('beforematch', reveal);
      window.addEventListener('hashchange', revealAnchor);
      window.addEventListener('keydown', revealSearch);
      revealAnchor();
      if (element.contains(document.activeElement)) reveal();
      return () => {
        element.removeEventListener('focusin', reveal);
        element.removeEventListener('beforematch', reveal);
        window.removeEventListener('hashchange', revealAnchor);
        window.removeEventListener('keydown', revealSearch);
      };
    });
    return () => media.revert();
  }, [distance, duration, delay, blur]);

  return <Tag ref={(node: HTMLElement | null) => { ref.current = node; }} {...props}>{children}</Tag>;
}

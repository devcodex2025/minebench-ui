'use client';

// Adapted from React Bits FadeContent (David Haz). See LICENSE.md.
// https://reactbits.dev/animations/fade-content
import { useEffect, useRef, type HTMLAttributes } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type FadeContentProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section';
  blur?: boolean;
  duration?: number;
  delay?: number;
};

export default function FadeContent({ as: Tag = 'div', blur = false, duration = 0.7, delay = 0, children, ...props }: FadeContentProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const tween = gsap.fromTo(element,
        { opacity: 0, y: 20, filter: blur ? 'blur(6px)' : 'none' },
        {
          opacity: 1, y: 0, filter: 'none', duration, delay, ease: 'power2.out',
          clearProps: 'opacity,transform,filter',
          scrollTrigger: { trigger: element, start: 'top 95%', once: true },
        });
      // Anchor navigation and keyboard focus must expose content immediately.
      const reveal = () => { tween.progress(1); };
      const revealAnchor = () => {
        if (window.location.hash && element.id === window.location.hash.slice(1)) reveal();
      };
      element.addEventListener('focusin', reveal);
      window.addEventListener('hashchange', revealAnchor);
      revealAnchor();
      return () => {
        element.removeEventListener('focusin', reveal);
        window.removeEventListener('hashchange', revealAnchor);
      };
    });
    return () => media.revert();
  }, [blur, duration, delay]);

  return <Tag ref={node => { ref.current = node; }} {...props}>{children}</Tag>;
}

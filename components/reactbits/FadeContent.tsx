'use client';

// Adapted from React Bits, commit 3a1c7f2f9f94ed833934ab5c2635760b9e644583.
// MIT + Commons Clause: vendor/REACT-BITS-LICENSE.md.
import AnimatedContent, { type AnimatedContentProps } from './AnimatedContent';

type FadeContentProps = Omit<AnimatedContentProps, 'distance' | 'as'> & {
  as?: 'div' | 'section';
};

export default function FadeContent(props: FadeContentProps) {
  return <AnimatedContent distance={12} duration={0.4} {...props} />;
}

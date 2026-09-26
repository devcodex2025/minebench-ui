import { cx } from '@/utils/cx';

/**
 * Small status indicator: a colour-coded dot with an optional text label.
 *
 * The dot pulses only for users who have not requested reduced motion
 * (`motion-safe:`), so state is always carried by colour and label and never
 * by motion alone. Prefer passing `label` wherever the dot is not already
 * explained by adjacent text.
 */
export type StatusTone = 'live' | 'ok' | 'warn' | 'idle';

const TONE: Record<StatusTone, { dot: string; text: string }> = {
  live: { dot: 'bg-yellow-400', text: 'text-yellow-400' },
  ok: { dot: 'bg-green-500', text: 'text-green-400' },
  warn: { dot: 'bg-red-500', text: 'text-red-400' },
  idle: { dot: 'bg-zinc-600', text: 'text-zinc-500' },
};

export interface StatusDotProps {
  /** Colour semantics of the indicator. Defaults to `live`. */
  tone?: StatusTone;
  /** Optional visible label, rendered beside the dot. */
  label?: string;
  /** Whether the dot may pulse. Honours `prefers-reduced-motion`. */
  pulse?: boolean;
  /** Extra classes, merged onto the dot (use for size overrides). */
  className?: string;
}

export function StatusDot({ tone = 'live', label, pulse = true, className }: StatusDotProps) {
  const colors = TONE[tone];
  const dot = (
    <span
      aria-hidden="true"
      className={cx('h-2 w-2 shrink-0 rounded-full', colors.dot, pulse && 'motion-safe:animate-pulse', className)}
    />
  );

  if (!label) return dot;

  return (
    <span className="inline-flex items-center gap-1.5">
      {dot}
      <span className={cx('font-bold', colors.text)}>{label}</span>
    </span>
  );
}

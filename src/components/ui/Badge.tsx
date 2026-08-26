import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent-soft text-accent-strong',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-soft text-muted',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

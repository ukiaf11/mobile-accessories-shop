import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useMotionPreference } from '../../hooks/useMotionPreference';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Centres the heading block; used for full-width marketing sections. */
  centered?: boolean;
}

export function Section({
  id, eyebrow, title, description, children, actions, className, centered,
}: SectionProps) {
  const { entrance } = useMotionPreference();

  return (
    <section id={id} className={cn('scroll-mt-24 py-14 sm:py-20', className)}>
      <div className="container-page">
        <motion.div
          {...entrance}
          className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
            centered && 'sm:flex-col sm:items-center sm:text-center',
          )}
        >
          <div className={cn('max-w-2xl', centered && 'mx-auto text-center')}>
            {eyebrow && (
              <p className="mb-2.5 text-xs font-bold tracking-[0.18em] text-accent-strong uppercase">
                {eyebrow}
              </p>
            )}
            <h2 className="text-2xl font-extrabold text-balance sm:text-3xl lg:text-4xl">{title}</h2>
            {description && (
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </motion.div>

        <div className="mt-8 sm:mt-10">{children}</div>
      </div>
    </section>
  );
}

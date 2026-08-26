import { useReducedMotion } from 'framer-motion';

/**
 * Motion levels from blueprint 03_UI_UX_BLUEPRINT.md section 13.
 * Every value collapses to a no-op when the OS asks for reduced motion.
 *
 * Two things matter here for performance:
 *
 * 1. **Stable identities.** This used to build a fresh object graph on every call, at ~18
 *    call sites (once per card, once per section). `reduced` itself never changes between
 *    renders, so the new identities bought nothing while defeating memoisation of every
 *    motion prop they fed. Both shapes are module constants now.
 *
 * 2. **A prefetch band.** `viewport.amount: 0.25` meant an element had to be a quarter
 *    on screen before its animation could even start — so it was guaranteed to be visibly
 *    blank for the whole delay + duration. `margin` starts the animation ~320px before the
 *    element scrolls into view, so it has finished by the time anyone can see it. That,
 *    plus shorter durations, is what removes the perceived load delay.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const FULL = {
  reduced: false,
  /** Level 2: section entrance. Starts before the element is on screen. */
  entrance: {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0 as const, margin: '0px 0px 320px 0px' },
    transition: { duration: 0.3, ease: EASE },
  },
  /** Level 1: hover lift. Only used where a CSS transition cannot reach. */
  lift: { y: -6, transition: { duration: 0.2 } },
  /** Level 1: button press. */
  tap: { scale: 0.97 },
} as const;

const REDUCED = {
  reduced: true,
  entrance: {
    initial: { opacity: 1 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0 as const },
  },
  lift: {},
  tap: {},
} as const;

export function useMotionPreference(): typeof FULL | typeof REDUCED {
  return useReducedMotion() ? REDUCED : FULL;
}

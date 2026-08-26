import { useReducedMotion } from 'framer-motion';

/**
 * Motion levels from blueprint 03_UI_UX_BLUEPRINT.md section 13.
 * Every value collapses to a no-op when the OS asks for reduced motion.
 */
export function useMotionPreference() {
  const reduced = useReducedMotion() ?? false;

  return {
    reduced,
    /** Level 2: section and card entrance. */
    entrance: reduced
      ? { initial: { opacity: 1 }, whileInView: { opacity: 1 }, viewport: { once: true } }
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
        },
    /** Level 1: hover lift on cards. */
    lift: reduced ? {} : { y: -6, transition: { duration: 0.2 } },
    /** Level 1: button press. */
    tap: reduced ? {} : { scale: 0.97 },
  };
}

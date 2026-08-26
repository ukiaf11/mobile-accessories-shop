import { useEffect, useRef } from 'react';
import { lockScroll, unlockScroll } from '../lib/scroll-lock';

/**
 * Dialog behaviour required by blueprint 03_UI_UX_BLUEPRINT.md section 16:
 * trap focus, close on Escape, restore focus on close, and stop the page behind
 * from scrolling.
 */

/**
 * `tabindex="-1"` is excluded on every entry, not just the generic one. Without this the
 * hidden honeypot input counts as the first focusable element, which puts the Tab cycle's
 * start on a control the customer can never see.
 */
const FOCUSABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useOverlayBehaviour(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  /*
   * `onClose` is almost always a fresh closure on every render of the parent. Reading it
   * through a ref keeps the effect below keyed on `open` alone — otherwise the effect tore
   * down and re-ran on every render, which cancelled the autofocus timer and bounced focus
   * back to the element that opened the dialog. That made the focus trap useless.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    lockScroll();

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const target =
        container.querySelector<HTMLElement>('[data-autofocus]') ??
        container.querySelector<HTMLElement>(FOCUSABLE) ??
        container;
      target.focus({ preventScroll: true });
    }, 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;
      const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // A Tab from outside the dialog (or from the panel itself) re-enters at the edge
      // rather than walking into the page behind.
      if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      unlockScroll();
      restoreFocusTo.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return containerRef;
}

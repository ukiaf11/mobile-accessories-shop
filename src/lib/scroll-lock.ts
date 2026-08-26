/**
 * Page scroll lock for overlays.
 *
 * `body { overflow: hidden }` alone is not enough. When the body's overflow propagates to
 * the viewport, the browser drops the scroll offset, so opening the cart threw the customer
 * back to the top of the page and closing it left them there. Pinning the body with
 * `position: fixed` and a negative `top` keeps the page visually still, then the offset is
 * restored on release.
 *
 * A counter guards the overlap while one overlay animates out and the next animates in.
 */

let depth = 0;
let savedScrollY = 0;
let saved: Partial<CSSStyleDeclaration> = {};

export function lockScroll(): void {
  depth += 1;
  if (depth > 1) return;

  const { body } = document;
  savedScrollY = window.scrollY;

  // Reserve the width the scrollbar was occupying so the layout does not shift sideways.
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;

  saved = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
    overflow: body.style.overflow,
  };

  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

export function unlockScroll(): void {
  depth = Math.max(0, depth - 1);
  if (depth > 0) return;

  const { body } = document;
  body.style.position = saved.position ?? '';
  body.style.top = saved.top ?? '';
  body.style.left = saved.left ?? '';
  body.style.right = saved.right ?? '';
  body.style.width = saved.width ?? '';
  body.style.paddingRight = saved.paddingRight ?? '';
  body.style.overflow = saved.overflow ?? '';

  // `html` has `scroll-behavior: smooth`, which would animate this restore into a
  // visible lurch. `instant` puts the page back exactly where it was.
  window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
}

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const GAP = 9; // breathing room between the element and the bubble
const MARGIN = 8; // minimum distance the bubble keeps from any viewport edge

// Ported verbatim from PortMasters2/PortMasters_online.html initTooltips (lines 4020-4092): one
// shared, viewport-aware bubble. Delegated from `document` (via [data-tip] + closest()), so
// re-rendered phase panels never need re-binding and every current/future data-tip element is
// covered with zero markup churn -- callers just write `data-tip="..."` like the original, no
// hook or wrapper needed. The bubble is portal-rendered to document.body (no transform/filter
// ancestor), so position:fixed is measured against the viewport and nothing can clip it. DOM
// is manipulated directly via the ref, exactly like the original's imperative style.top/left
// writes, rather than routing every pointer move through React state.
export function TooltipProvider({ children }: { children: ReactNode }) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<Element | null>(null);

  useEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    function show(el: Element) {
      const text = el.getAttribute('data-tip');
      if (!text || !bubble) return;
      currentRef.current = el;
      bubble.textContent = text;
      bubble.classList.remove('tip-hidden');

      const a = el.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;

      let placement = 'above';
      let top = a.top - GAP - b.height;
      if (top < MARGIN && a.bottom + GAP + b.height <= vh - MARGIN) {
        placement = 'below';
        top = a.bottom + GAP;
      }
      top = Math.max(MARGIN, Math.min(top, vh - MARGIN - b.height));

      const anchorCenter = a.left + a.width / 2;
      const left = Math.max(MARGIN, Math.min(anchorCenter - b.width / 2, vw - MARGIN - b.width));

      bubble.style.top = `${Math.round(top)}px`;
      bubble.style.left = `${Math.round(left)}px`;
      bubble.dataset.placement = placement;
      const caret = Math.max(11, Math.min(anchorCenter - left, b.width - 11));
      bubble.style.setProperty('--tip-caret', `${Math.round(caret)}px`);

      requestAnimationFrame(() => bubble.classList.add('tip-show'));
    }

    function hide() {
      currentRef.current = null;
      bubble!.classList.remove('tip-show');
      bubble!.classList.add('tip-hidden');
    }

    function onPointerOver(e: PointerEvent) {
      const el = (e.target as Element).closest('[data-tip]');
      if (el && el !== currentRef.current) show(el);
    }
    function onPointerOut(e: PointerEvent) {
      const el = (e.target as Element).closest('[data-tip]');
      if (!el || el !== currentRef.current) return;
      if (e.relatedTarget && el.contains(e.relatedTarget as Node)) return;
      hide();
    }
    function onScroll() {
      if (currentRef.current) hide();
    }
    function onResize() {
      if (currentRef.current) hide();
    }

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {children}
      {createPortal(
        <div className="tip-bubble tip-hidden" role="tooltip" ref={bubbleRef} />,
        document.body,
      )}
    </>
  );
}

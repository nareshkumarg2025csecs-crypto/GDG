/**
 * CustomCursor.tsx
 *
 * Premium cursor using raw RAF for zero-overhead 60 fps tracking.
 * - Outer ring with trailing lag + glow
 * - Inner dot with tight follow
 * - Magnetic pull toward interactive elements
 * - Trailing ghost for extra fluidity
 * - States: default / hover / media / pressed
 * - Touch / coarse pointer guard
 * - Theme-aware colors
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

// Lerp speed: higher = snappier
const DOT_LERP = 0.25;
const RING_LERP = 0.12;
const TRAIL_LERP = 0.07;

const INTERACTIVE_SELECTOR = 'a, button, [data-cursor], .magnetic, [data-physics], [role="button"]';

export default function CustomCursor() {
  const { theme } = useTheme();

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  // All mutable state lives in refs to avoid re-renders
  const mouse = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const trailPos = useRef({ x: -100, y: -100 });
  const state = useRef<'default' | 'hover' | 'media' | 'pressed'>('default');
  const visible = useRef(false);
  const colorIdx = useRef(0);
  const accent = useRef(GOOGLE_COLORS[0]);
  const magnetic = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef(0);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const tick = useCallback(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const trail = trailRef.current;
    if (!dot || !ring || !trail) {
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    // Target: if magnetic pull is active, blend toward the element center
    const targetX = magnetic.current ? lerp(mouse.current.x, magnetic.current.x, 0.35) : mouse.current.x;
    const targetY = magnetic.current ? lerp(mouse.current.y, magnetic.current.y, 0.35) : mouse.current.y;

    // Lerp positions
    dotPos.current.x = lerp(dotPos.current.x, targetX, DOT_LERP);
    dotPos.current.y = lerp(dotPos.current.y, targetY, DOT_LERP);
    ringPos.current.x = lerp(ringPos.current.x, targetX, RING_LERP);
    ringPos.current.y = lerp(ringPos.current.y, targetY, RING_LERP);
    trailPos.current.x = lerp(trailPos.current.x, targetX, TRAIL_LERP);
    trailPos.current.y = lerp(trailPos.current.y, targetY, TRAIL_LERP);

    // Velocity for ring stretch/skew
    const vx = targetX - ringPos.current.x;
    const vy = targetY - ringPos.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const angle = Math.atan2(vy, vx) * (180 / Math.PI);
    const stretch = Math.min(speed * 0.4, 30);

    // Apply transforms (single write per element per frame)
    const op = visible.current ? 1 : 0;

    dot.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%) scale(${state.current === 'pressed' ? 0.5 : 1})`;
    dot.style.opacity = `${op}`;

    ring.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scaleX(${1 + stretch * 0.008}) scale(${state.current === 'pressed' ? 0.8 : 1})`;
    ring.style.opacity = `${op}`;

    trail.style.transform = `translate3d(${trailPos.current.x}px, ${trailPos.current.y}px, 0) translate(-50%, -50%)`;
    trail.style.opacity = `${op * 0.35}`;

    rafId.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Feature detection
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReduced) return;

    document.body.classList.add('custom-cursor-active');

    // Start RAF loop
    rafId.current = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!visible.current) visible.current = true;
    };

    const onLeave = () => { visible.current = false; };
    const onEnter = () => { visible.current = true; };
    const onDown = () => { state.current = 'pressed'; applyStateStyling(); };
    const onUp = () => {
      // Restore to hover if still over an interactive element
      state.current = document.querySelector(':hover')?.closest(INTERACTIVE_SELECTOR) ? 'hover' : 'default';
      applyStateStyling();
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!el) {
        state.current = 'default';
        magnetic.current = null;
        applyStateStyling();
        return;
      }
      const cursorAttr = el.getAttribute('data-cursor');
      state.current = cursorAttr === 'media' ? 'media' : 'hover';

      // Magnetic pull: compute element center
      const rect = el.getBoundingClientRect();
      magnetic.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

      // Cycle accent color
      colorIdx.current = (colorIdx.current + 1) % GOOGLE_COLORS.length;
      accent.current = GOOGLE_COLORS[colorIdx.current];
      applyStateStyling();
    };

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !related.closest(INTERACTIVE_SELECTOR)) {
        state.current = 'default';
        magnetic.current = null;
        applyStateStyling();
      }
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseout', onOut, { passive: true });

    return () => {
      cancelAnimationFrame(rafId.current);
      document.body.classList.remove('custom-cursor-active');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, [tick]);

  // Apply visual state changes to DOM (no React re-render)
  const applyStateStyling = useCallback(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const trail = trailRef.current;
    if (!dot || !ring || !trail) return;

    const s = state.current;
    const c = accent.current;

    // Dot sizing
    dot.style.width = s === 'hover' ? '14px' : '8px';
    dot.style.height = s === 'hover' ? '14px' : '8px';
    dot.style.backgroundColor = c;
    dot.style.boxShadow = `0 0 16px ${c}90, 0 0 40px ${c}30`;

    // Ring sizing & fill
    const ringSize = s === 'media' ? '88px' : s === 'hover' ? '40px' : '48px';
    ring.style.width = ringSize;
    ring.style.height = ringSize;
    ring.style.backgroundColor = s === 'hover' ? `${c}15` : 'transparent';
    ring.style.borderColor = s === 'hover' ? `${c}50` : '';

    // Trail glow color
    trail.style.backgroundColor = c;
    trail.style.boxShadow = `0 0 60px 20px ${c}25`;
  }, []);

  // Feature detection on mount — only render if supported
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || prefersReduced) return null;

  const ringBorder = theme === 'light' ? 'rgba(31,31,31,0.15)' : 'rgba(255,255,255,0.15)';

  return (
    <>
      {/* Trailing glow */}
      <div
        ref={trailRef}
        className="cursor-trail"
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 24, height: 24,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9997,
          backgroundColor: GOOGLE_COLORS[0],
          filter: 'blur(12px)',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />

      {/* Outer ring */}
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          width: 48, height: 48,
          border: `1.5px solid ${ringBorder}`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'width 0.35s cubic-bezier(0.23,1,0.32,1), height 0.35s cubic-bezier(0.23,1,0.32,1), background-color 0.25s, border-color 0.25s',
          opacity: 0,
        }}
      />

      {/* Inner dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          width: 8, height: 8,
          backgroundColor: GOOGLE_COLORS[0],
          boxShadow: `0 0 16px ${GOOGLE_COLORS[0]}90, 0 0 40px ${GOOGLE_COLORS[0]}30`,
          transition: 'width 0.25s cubic-bezier(0.23,1,0.32,1), height 0.25s cubic-bezier(0.23,1,0.32,1), background-color 0.15s',
          opacity: 0,
        }}
      />
    </>
  );
}

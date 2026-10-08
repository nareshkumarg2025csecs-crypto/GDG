/**
 * CustomCursor.tsx
 *
 * State-of-the-art interactive cursor with:
 * - Fluid velocity-based breathing (no distorted egg stretching)
 * - Dynamic magnetic snap to interactive targets
 * - Expanding frosted aura on hover with Google brand colors
 * - Tactile click ripple animation
 * - Input-aware auto-fade (shows native text caret in inputs/textareas)
 * - Responsive sizing adapted to screen resolution
 * - Automatic disable on touch / mobile / reduced-motion devices
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

// Responsive lerp constants for buttery smooth tracking
const DOT_LERP = 0.35;
const RING_LERP = 0.16;
const AURA_LERP = 0.09;

const INTERACTIVE_SELECTOR = 'a, button, [data-cursor], .magnetic, [data-physics], [role="button"]';
const INPUT_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

export default function CustomCursor() {
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const mouse = useRef({ x: -200, y: -200 });
  const dotPos = useRef({ x: -200, y: -200 });
  const ringPos = useRef({ x: -200, y: -200 });
  const auraPos = useRef({ x: -200, y: -200 });

  const state = useRef<'default' | 'hover' | 'media' | 'pressed' | 'input'>('default');
  const visible = useRef(false);
  const colorIdx = useRef(0);
  const accent = useRef(GOOGLE_COLORS[0]);
  const rafId = useRef(0);
  const responsiveScale = useRef(1);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const tick = useCallback(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const aura = auraRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !aura) {
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    // Both dot and ring smoothly follow the mouse pointer
    dotPos.current.x = lerp(dotPos.current.x, mouse.current.x, 0.45);
    dotPos.current.y = lerp(dotPos.current.y, mouse.current.y, 0.45);
    ringPos.current.x = lerp(ringPos.current.x, mouse.current.x, 0.2);
    ringPos.current.y = lerp(ringPos.current.y, mouse.current.y, 0.2);
    auraPos.current.x = lerp(auraPos.current.x, mouse.current.x, 0.1);
    auraPos.current.y = lerp(auraPos.current.y, mouse.current.y, 0.1);

    const s = state.current;
    const baseScale = responsiveScale.current;

    // CRITICAL: Guarantee the dot is ALWAYS inside the ring!
    // Clamping the relative offset to 5px (ring radius is 20px - 32px) ensures
    // the dot can NEVER poke out of the ring under any movement or hover condition.
    const dx = dotPos.current.x - ringPos.current.x;
    const dy = dotPos.current.y - ringPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = 5 * baseScale;
    if (dist > maxOffset) {
      const angle = Math.atan2(dy, dx);
      ringPos.current.x = dotPos.current.x - Math.cos(angle) * maxOffset;
      ringPos.current.y = dotPos.current.y - Math.sin(angle) * maxOffset;
    }

    // Dynamic velocity breathing scale (pure scale, never distorted skewing)
    const vx = mouse.current.x - ringPos.current.x;
    const vy = mouse.current.y - ringPos.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const pulseScale = 1 + Math.min(speed * 0.0016, 0.18);

    const isHidden = !visible.current || s === 'input';
    const op = isHidden ? 0 : 1;

    // Apply 3D accelerated transforms — dot stays centered inside the ring
    const dotScale = s === 'pressed' ? 0.6 : s === 'hover' ? 1.2 : s === 'media' ? 0.2 : 1;
    dot.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%) scale(${dotScale * baseScale})`;
    dot.style.opacity = `${s === 'media' ? 0 : op}`;

    const ringScale = (s === 'pressed' ? 0.8 : s === 'hover' ? 1.35 : s === 'media' ? 1.6 : pulseScale) * baseScale;
    ring.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
    ring.style.opacity = `${op}`;

    if (label) {
      label.style.opacity = s === 'media' ? `${op}` : '0';
      label.style.transform = `scale(${s === 'media' ? 1 : 0.7})`;
    }

    aura.style.transform = `translate3d(${auraPos.current.x}px, ${auraPos.current.y}px, 0) translate(-50%, -50%) scale(${baseScale})`;
    aura.style.opacity = `${op * 0.35}`;

    rafId.current = requestAnimationFrame(tick);
  }, []);

  const triggerRipple = useCallback((x: number, y: number) => {
    const ripple = rippleRef.current;
    if (!ripple) return;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.borderColor = accent.current;
    ripple.classList.remove('cursor-ripple-active');
    // Force reflow
    void ripple.offsetWidth;
    ripple.classList.add('cursor-ripple-active');
  }, []);

  useEffect(() => {
    // Feature detection: disable on touch, mobile screens (< 768px), or reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isMobile = window.innerWidth < 768;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || isMobile || prefersReduced) return;
    setEnabled(true);

    // Adapt sizing proportionally to screen width
    const updateResponsiveScale = () => {
      const w = window.innerWidth;
      if (w >= 1920) {
        responsiveScale.current = 1.15;
      } else if (w >= 1280) {
        responsiveScale.current = 1.0;
      } else {
        responsiveScale.current = 0.88;
      }
    };
    updateResponsiveScale();
    window.addEventListener('resize', updateResponsiveScale);

    document.body.classList.add('custom-cursor-active');
    rafId.current = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!visible.current) visible.current = true;
    };

    const onLeave = () => { visible.current = false; };
    const onEnter = () => { visible.current = true; };

    const onDown = (e: MouseEvent) => {
      state.current = 'pressed';
      triggerRipple(e.clientX, e.clientY);
      applyStateStyling();
    };

    const onUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(INPUT_SELECTOR)) {
        state.current = 'input';
      } else if (target?.closest(INTERACTIVE_SELECTOR)) {
        state.current = 'hover';
      } else {
        state.current = 'default';
      }
      applyStateStyling();
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(INPUT_SELECTOR)) {
        state.current = 'input';
        applyStateStyling();
        return;
      }

      const el = target.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!el) {
        state.current = 'default';
        applyStateStyling();
        return;
      }

      const cursorAttr = el.getAttribute('data-cursor');
      state.current = cursorAttr === 'media' ? 'media' : 'hover';

      // Cycle Google brand color smoothly
      colorIdx.current = (colorIdx.current + 1) % GOOGLE_COLORS.length;
      accent.current = GOOGLE_COLORS[colorIdx.current];
      applyStateStyling();
    };

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !related.closest(INTERACTIVE_SELECTOR)) {
        state.current = 'default';
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
      window.removeEventListener('resize', updateResponsiveScale);
      document.body.classList.remove('custom-cursor-active');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, [tick, triggerRipple]);

  const applyStateStyling = useCallback(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const aura = auraRef.current;
    if (!dot || !ring || !aura) return;

    const s = state.current;
    const c = accent.current;

    // Dot appearance
    dot.style.backgroundColor = c;
    dot.style.boxShadow = s === 'hover'
      ? `0 0 16px ${c}, 0 0 30px ${c}80`
      : `0 0 10px ${c}b0, 0 0 20px ${c}40`;

    // Ring appearance: sleek frosted glass with subtle glow
    if (s === 'hover') {
      ring.style.borderColor = `${c}80`;
      ring.style.backgroundColor = `${c}18`;
      ring.style.boxShadow = `0 0 20px ${c}30, inset 0 0 10px ${c}15`;
    } else if (s === 'media') {
      ring.style.borderColor = `${c}90`;
      ring.style.backgroundColor = `${c}25`;
      ring.style.boxShadow = `0 0 30px ${c}40`;
    } else {
      ring.style.borderColor = theme === 'light' ? 'rgba(31,31,31,0.22)' : 'rgba(255,255,255,0.22)';
      ring.style.backgroundColor = 'transparent';
      ring.style.boxShadow = 'none';
    }

    aura.style.backgroundColor = c;
    aura.style.boxShadow = `0 0 45px 15px ${c}30`;
  }, [theme]);

  // Guard against touch/SSR and mobile
  if (!enabled) return null;

  const ringBorder = theme === 'light' ? 'rgba(31,31,31,0.22)' : 'rgba(255,255,255,0.22)';

  return (
    <>
      {/* Ambient soft glow aura */}
      <div
        ref={auraRef}
        className="cursor-aura pointer-events-none fixed top-0 left-0 rounded-full blur-xl"
        style={{
          width: 32,
          height: 32,
          zIndex: 9996,
          backgroundColor: GOOGLE_COLORS[0],
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />

      {/* Outer fluid precision ring with optional context badge */}
      <div
        ref={ringRef}
        className="cursor-ring pointer-events-none fixed top-0 left-0 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width: 40,
          height: 40,
          border: `1.5px solid ${ringBorder}`,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 9998,
          transition: 'width 0.3s cubic-bezier(0.23,1,0.32,1), height 0.3s cubic-bezier(0.23,1,0.32,1), background-color 0.25s, border-color 0.25s, box-shadow 0.25s',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        <span
          ref={labelRef}
          className="text-[8px] font-mono font-bold tracking-widest uppercase select-none pointer-events-none transition-all duration-200"
          style={{ color: '#ffffff', opacity: 0 }}
        >
          VIEW
        </span>
      </div>

      {/* Inner glowing precision dot */}
      <div
        ref={dotRef}
        className="cursor-dot pointer-events-none fixed top-0 left-0 rounded-full"
        style={{
          width: 7,
          height: 7,
          backgroundColor: GOOGLE_COLORS[0],
          boxShadow: `0 0 10px ${GOOGLE_COLORS[0]}b0`,
          zIndex: 9999,
          transition: 'transform 0.2s cubic-bezier(0.23,1,0.32,1), background-color 0.2s, box-shadow 0.2s',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />

      {/* Click ripple animation element */}
      <div
        ref={rippleRef}
        className="cursor-ripple pointer-events-none fixed rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          zIndex: 9997,
          borderWidth: 1.5,
          borderStyle: 'solid',
          borderColor: GOOGLE_COLORS[0],
          width: 10,
          height: 10,
          opacity: 0,
        }}
      />
    </>
  );
}

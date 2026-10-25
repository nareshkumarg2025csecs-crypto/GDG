import { Component, lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Vec3 } from './GdgCatScene';

// The three.js bundle is only fetched when the mascot is near the viewport.
const GdgCatScene = lazy(() => import('./GdgCatScene'));

export interface GdgCatMascotProps {
  /** URL of the optimised GLB. */
  src?: string;
  /** Static fallback shown while loading, without WebGL, or if loading fails. */
  poster?: string;
  className?: string;
  style?: CSSProperties;
  /** Allow drag-to-rotate (horizontal only). Set false for a decorative hero. Default true. */
  interactive?: boolean;
  /** Idle sway + breathing. Always off when the user prefers reduced motion. Default true. */
  animate?: boolean;
  /** Camera position; default frames the whole kitten from the front. */
  cameraPosition?: Vec3;
  /** Camera look-at point. */
  target?: Vec3;
  fov?: number;
  /** Model scale multiplier. */
  scale?: number;
  /** Light rig intensity multiplier. */
  lightIntensity?: number;
  shadow?: boolean;
  /** Accessible description. */
  alt?: string;
  /** Called once the model is on screen. */
  onLoad?: () => void;
  /** Called if the 3D scene cannot be shown (poster stays visible). */
  onError?: (error: unknown) => void;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const h = () => setReduced(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return reduced;
}

class SceneBoundary extends Component<{ children: ReactNode; onError: (e: unknown) => void; fallback: ReactNode },
  { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { this.props.onError(error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/**
 * Real-time 3D GDG kitten mascot.
 * The page never depends on it: if WebGL or the GLB is unavailable the poster image is shown instead.
 */
export default function GdgCatMascot({
  src = '/models/gdg-cat.glb',
  poster = '/models/gdg-cat-poster.webp',
  className,
  style,
  interactive = true,
  animate = true,
  cameraPosition = [0, 1.15, 5.2],
  target = [0, 0.95, 0],
  fov = 30,
  scale = 1,
  lightIntensity = 1,
  shadow = true,
  alt = 'Orange kitten mascot wearing a black and white Google Developer Groups varsity jacket',
  onLoad,
  onError,
}: GdgCatMascotProps) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [canMountScene, setCanMountScene] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduced = usePrefersReducedMotion();
  const [webgl] = useState(() => (typeof document === 'undefined' ? true : hasWebGL()));

  const [tabVisible, setTabVisible] = useState(() => (typeof document !== 'undefined' ? !document.hidden : true));

  useEffect(() => {
    const handleVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // Pause rendering during rapid scrolling so mobile & desktop keep native 60/120 FPS
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsScrolling(false);
      }, 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Defer mounting heavy 3D WebGL context until after initial paint & animations complete
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        setCanMountScene(true);
      }, { timeout: 600 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => setCanMountScene(true), 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // Lazy-mount when within ~200px of the viewport; pause rendering when scrolled away.
  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (e.isIntersecting) setNear(true);
      setInView(e.isIntersecting);
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleError = (e: unknown) => { setFailed(true); onError?.(e); };
  const showScene = near && canMountScene && webgl && !failed;

  const posterEl = (
    <img src={poster} alt={alt} draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
  );

  return (
    <div
      ref={host}
      className={className}
      style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', touchAction: 'pan-y', ...style }}
      role="img"
      aria-label={alt}
    >
      {/* Poster underneath: visible until the 3D model is ready, and as the fallback. */}
      <div style={{ position: 'absolute', inset: 0, opacity: ready && showScene ? 0 : 1, transition: 'opacity .5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {posterEl}
      </div>
      {showScene && (
        <div style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : 0, transition: 'opacity .5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <SceneBoundary onError={handleError} fallback={null}>
            <Suspense fallback={null}>
              <GdgCatScene
                src={src}
                cameraPosition={cameraPosition}
                target={target}
                fov={fov}
                modelScale={scale}
                interactive={interactive}
                animate={animate && !reduced}
                lightIntensity={lightIntensity}
                shadow={shadow}
                paused={!inView || !tabVisible || isScrolling}
                onReady={() => { setReady(true); onLoad?.(); }}
              />
            </Suspense>
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}

import { Suspense, useState, useEffect, useRef, lazy } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const FluidCanvas = lazy(() => import('./FluidCanvas'));
import GdgCatMascot from '@/components/3d/GdgCatMascot';


const CanvasLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-background">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="flex gap-2"
    >
      {['#4285F4', '#EA4335', '#FBBC04', '#34A853'].map((color, i) => (
        <motion.div
          key={color}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </motion.div>
  </div>
);

const HERO_WORDS = [
  { text: 'GOOGLE', color: '#4285F4' },
  { text: 'DEVELOPER', color: '#EA4335' },
  { text: 'GROUPS', color: '#FBBC04' },
];

const HeroSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : 280]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1 : 0.88]);

  // Per-line parallax offsets (disabled on mobile for zero layout shifts)
  const line0y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -80]);
  const line1y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -50]);
  const line2y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -20]);


  const isDark = theme === 'dark';

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-[100dvh] lg:h-screen flex flex-col overflow-x-clip lg:overflow-hidden bg-background"
    >
      {/* Dynamic Theme-Aware Google Ambient Aurora Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-colors duration-700 overflow-hidden"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse 65% 50% at 20% 25%, rgba(66, 133, 244, 0.18) 0%, transparent 70%),
              radial-gradient(ellipse 60% 45% at 85% 20%, rgba(234, 67, 53, 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 70% 55% at 65% 80%, rgba(251, 188, 4, 0.13) 0%, transparent 70%),
              radial-gradient(ellipse 65% 50% at 20% 80%, rgba(52, 168, 83, 0.15) 0%, transparent 70%),
              #050505
            `
            : `
              radial-gradient(ellipse 65% 50% at 20% 25%, rgba(66, 133, 244, 0.12) 0%, transparent 70%),
              radial-gradient(ellipse 60% 45% at 85% 20%, rgba(234, 67, 53, 0.09) 0%, transparent 70%),
              radial-gradient(ellipse 70% 55% at 65% 80%, rgba(251, 188, 4, 0.09) 0%, transparent 70%),
              radial-gradient(ellipse 65% 50% at 20% 80%, rgba(52, 168, 83, 0.10) 0%, transparent 70%),
              #FAFAFA
            `,
        }}
      >
        {/* Subtle digital tech grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* 3D Floating Particle Constellation (Desktop only for silky 120Hz mobile performance) */}
      {!isMobile && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Suspense fallback={null}>
            <FluidCanvas />
          </Suspense>
        </div>
      )}

      {/* Main content */}
      <motion.div
        style={isMobile ? undefined : { y, opacity, scale }}
        className="relative z-20 flex-1 flex flex-col justify-start lg:justify-center px-5 sm:px-8 md:px-12 lg:px-16 pt-24 sm:pt-28 lg:pt-0 pb-20 lg:pb-0 max-w-[1600px] mx-auto w-full"
      >
        {/* Responsive Hero Layout: Editorial Headline + 3D Mascot Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full">
          {/* Left Column: Editorial giant headline */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-3 mb-4 md:mb-6"
            >
              <span
                className="section-eyebrow"
                style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,31,31,0.5)' }}
              >
                Building Community Together
              </span>
              <span
                className="w-8 h-[1px]"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(31,31,31,0.2)' }}
              />
            </motion.div>

            {/* Semantic primary H1 headline with per-line parallax */}
            <h1
              className="overflow-hidden m-0 p-0 font-normal"
              aria-label="Google Developer Groups On Campus — REC"
            >
              {HERO_WORDS.map((word, i) => (
                <motion.div
                  key={word.text}
                  style={{ y: [line0y, line1y, line2y][i] }}
                  className="overflow-hidden"
                >
                  <motion.span
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: 0.8 + i * 0.14,
                      duration: 0.9,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="font-display leading-none block select-none"
                    style={{
                      fontSize: 'clamp(2.75rem, 9.5vw, 9.5rem)',
                      letterSpacing: '0.02em',
                      WebkitTextStroke: i === 2 ? `2px ${word.color}` : '0',
                      color: i === 2 ? 'transparent' : (isDark ? '#ffffff' : '#1F1F1F'),
                      textShadow: isDark && i < 2 ? '0 0 80px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    {word.text}
                  </motion.span>
                </motion.div>
              ))}
            </h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="mt-6 text-base md:text-lg max-w-lg font-body"
              style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(31,31,31,0.6)' }}
            >
              Connect, learn, and grow with a community of developers passionate about Google technologies.
            </motion.p>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href="#events"
                className="btn-shimmer inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-body font-semibold text-sm transition-all"
                data-cursor="hover"
                style={{
                  background: 'linear-gradient(135deg, #4285F4, #EA4335)',
                  color: '#ffffff',
                  boxShadow: isDark
                    ? '0 0 40px #4285F440, 0 8px 30px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(66,133,244,0.35)',
                }}
              >
                Explore Events
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </a>
              <a
                href="#team"
                className="link-wipe inline-flex items-center gap-2 text-sm font-body font-semibold"
                data-cursor="hover"
                style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(31,31,31,0.65)' }}
              >
                Meet the Team
              </a>
            </motion.div>
          </div>

          {/* Right Column: 3D Mascot Centerpiece (Interactive Drag-to-Rotate on Desktop & Mobile) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center relative mt-6 lg:mt-0"
          >
            <div className="relative w-full max-w-[210px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[420px] xl:max-w-[460px] flex flex-col items-center">
              {/* Dynamic ambient halo aura behind mascot */}
              <div
                className="absolute inset-0 -inset-x-8 -inset-y-8 rounded-full pointer-events-none filter blur-3xl opacity-35 transition-all duration-700"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle, rgba(66,133,244,0.45) 0%, rgba(52,168,83,0.25) 50%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(66,133,244,0.28) 0%, rgba(251,188,4,0.2) 50%, transparent 70%)',
                }}
              />

              {/* 3D GDG Kitten Mascot with drag-to-rotate */}
              <div className="relative z-10 w-full cursor-grab active:cursor-grabbing select-none">
                <GdgCatMascot
                  className="w-full drop-shadow-2xl"
                  interactive={true}
                  animate={true}
                />
              </div>

              {/* Interactive badge / pill indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="relative z-20 -mt-2 sm:-mt-4 flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border backdrop-blur-md shadow-lg"
                style={{
                  backgroundColor: isDark ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                }}
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34A853]" />
                </span>
                <span
                  className="text-xs font-semibold font-body tracking-wide"
                  style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(31,31,31,0.9)' }}
                >
                  Pixel 🐾
                </span>
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: isDark ? 'rgba(66,133,244,0.22)' : 'rgba(66,133,244,0.12)',
                    color: '#4285F4',
                  }}
                >
                  3D Mascot
                </span>
                <span
                  className="text-[11px] font-body"
                  style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(31,31,31,0.55)' }}
                >
                  • {isMobile ? 'Swipe to rotate' : 'Drag to rotate'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Marquee ticker */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 w-full overflow-hidden py-4 backdrop-blur-sm border-t"
        style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.88)',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap items-center"
        >
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="flex items-center mx-8 gap-5">
              {['GDG On Campus', 'Connect', 'Learn', 'Grow'].map((label, j) => (
                <div key={label} className="flex items-center gap-5">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.25em]"
                    style={{ color: ['#4285F4', '#EA4335', '#FBBC04', '#34A853'][j] }}
                  >
                    {label}
                  </span>
                  {j < 3 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: ['#4285F4', '#EA4335', '#FBBC04', '#34A853'][j],
                        boxShadow: isDark ? `0 0 8px ${['#4285F4', '#EA4335', '#FBBC04', '#34A853'][j]}80` : 'none',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator (Desktop only) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="hidden lg:flex absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex-col items-center gap-2"
      >
        <span
          className="section-eyebrow text-[9px]"
          style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(31,31,31,0.4)' }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="p-2.5 rounded-full border backdrop-blur-sm"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(31,31,31,0.15)',
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
          }}
        >
          <ChevronDown
            className="w-4 h-4"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(31,31,31,0.5)' }}
          />
        </motion.div>
      </motion.div>

      {/* Interaction hint (Desktop only) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 3, duration: 3, repeat: 2 }}
        className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(31,31,31,0.25)' }}
        >
          Move your mouse to interact
        </p>
      </motion.div>
    </section>
  );
};

export default HeroSection;

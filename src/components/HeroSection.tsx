import { Suspense, useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import FluidCanvas from './FluidCanvas';
import { useTheme } from '@/contexts/ThemeContext';

const CountUp = ({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

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

  const stats = [
    { value: 50, suffix: '+', label: 'Events Hosted', color: '#4285F4' },
    { value: 1200, suffix: '+', label: 'Members', color: '#EA4335' },
    { value: 20, suffix: '', label: 'Workshops', color: '#FBBC04' },
    { value: 5, suffix: '', label: 'Years Active', color: '#34A853' },
  ];

  const isDark = theme === 'dark';

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-screen lg:h-screen flex flex-col overflow-hidden bg-background"
    >
      {/* SEO title */}
      <h1 className="sr-only">Google Developer Groups</h1>

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

      {/* 3D Floating Particle Constellation & Developer Accents (Desktop only for silky 120Hz mobile performance) */}
      {!isMobile && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Suspense fallback={null}>
            <FluidCanvas />
          </Suspense>
        </div>
      )}

      {/* Main content — editorial split */}
      <motion.div
        style={isMobile ? undefined : { y, opacity, scale }}
        className="relative z-20 flex-1 flex flex-col lg:flex-row items-center lg:items-end px-5 sm:px-8 md:px-12 lg:px-16 pb-24 md:pb-32 pt-24 md:pt-28 max-w-[1600px] mx-auto w-full gap-8 lg:gap-0"
      >
        {/* Left: editorial giant headline (7/12 cols) */}
        <div className="flex-1 min-w-0">
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

          {/* Three headline lines with per-line parallax */}
          <div className="overflow-hidden">
            {HERO_WORDS.map((word, i) => (
              <motion.div
                key={word.text}
                style={{ y: [line0y, line1y, line2y][i] }}
                className="overflow-hidden"
              >
                <motion.h2
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.8 + i * 0.14,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-display leading-none block select-none"
                  style={{
                    fontSize: 'clamp(2.75rem, 11.5vw, 11rem)',
                    letterSpacing: '0.02em',
                    WebkitTextStroke: i === 2 ? `2px ${word.color}` : '0',
                    color: i === 2 ? 'transparent' : (isDark ? '#ffffff' : '#1F1F1F'),
                    textShadow: isDark && i < 2 ? '0 0 80px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {word.text}
                </motion.h2>
              </motion.div>
            ))}
          </div>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mt-6 text-base md:text-lg max-w-md font-body"
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

        {/* Right: vertical stat rail (5/12 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          className="w-full lg:w-auto flex flex-row lg:flex-col gap-3 lg:gap-4 lg:pl-12 lg:border-l shrink-0"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,31,31,0.1)' }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ x: 6 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="flex-1 lg:flex-none group"
              data-physics
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 p-4 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${stat.color}${isDark ? '22' : '18'}`,
                  boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span
                  className="font-display leading-none tabular-nums"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    color: stat.color,
                    textShadow: isDark ? `0 0 30px ${stat.color}60` : 'none',
                  }}
                >
                  <CountUp end={stat.value} suffix={stat.suffix} duration={1.8 + i * 0.15} />
                </span>
                <span
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(31,31,31,0.5)' }}
                >
                  {stat.label}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
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

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
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

      {/* Interaction hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 3, duration: 3, repeat: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
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

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Animated counter – counts up on scroll into view */
const CountUp = ({ end, suffix = '' }: { end: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1800, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const COMMUNITY_TAGS = ['Flutter', 'TensorFlow', 'Firebase', 'Kotlin', 'Angular', 'Go', 'Cloud', 'Web'];
const STATS = [
  { value: 1200, suffix: '+', label: 'Members', color: '#4285F4' },
  { value: 50, suffix: '+', label: 'Events', color: '#EA4335' },
  { value: 20, suffix: '', label: 'Workshops', color: '#FBBC04' },
  { value: 5, suffix: '', label: 'Years', color: '#34A853' },
];

const MessageSection = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement[]>([]);

  const { scrollYProgress: bgProgress } = useScroll({
    target: outerRef,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(bgProgress, [0, 1], [40, -40]);
  const bgRotate = useTransform(bgProgress, [0, 1], [0, 6]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = linesRef.current.filter(Boolean);
      if (!lines.length || !stickyRef.current) return;

      lines.forEach((line, i) => {
        gsap.fromTo(
          line,
          { y: 50, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
          {
            y: 0,
            opacity: 1,
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: stickyRef.current,
              start: `top+=${i * 70}px center`,
              end: `top+=${i * 70 + 180}px center`,
              toggleActions: 'play none none reverse',
              scrub: false,
            },
          },
        );
      });
    }, outerRef);

    return () => ctx.revert();
  }, []);

  const setLineRef = (el: HTMLDivElement | null, i: number) => {
    if (el) linesRef.current[i] = el;
  };

  return (
    <div ref={outerRef} className="relative" style={{ minHeight: '115vh' }}>
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-background"
      >
        {/* Large decorative geometric shapes */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Giant rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-[15%] -right-[15%] w-[50vw] h-[50vw] rounded-full"
            style={{ border: `2px solid ${isDark ? 'rgba(66,133,244,0.08)' : 'rgba(66,133,244,0.06)'}` }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-[20%] -left-[10%] w-[40vw] h-[40vw] rounded-full"
            style={{ border: `2px solid ${isDark ? 'rgba(234,67,53,0.07)' : 'rgba(234,67,53,0.05)'}` }}
          />

          {/* Gradient mesh blobs for visual depth */}
          <div
            className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full blur-[120px]"
            style={{ background: isDark ? 'rgba(66,133,244,0.06)' : 'rgba(66,133,244,0.04)' }}
          />
          <div
            className="absolute bottom-[15%] right-[10%] w-[25vw] h-[25vw] rounded-full blur-[100px]"
            style={{ background: isDark ? 'rgba(52,168,83,0.06)' : 'rgba(52,168,83,0.04)' }}
          />
        </div>

        {/* Background GDG watermark */}
        <motion.div
          style={{ y: bgY, rotate: bgRotate }}
          className="absolute right-[-10%] top-1/2 -translate-y-1/2 select-none pointer-events-none"
        >
          <span
            className="font-display leading-none"
            style={{
              fontSize: 'clamp(10rem, 30vw, 30rem)',
              background: isDark
                ? 'linear-gradient(135deg, #4285F412 0%, #EA433512 50%, #34A85312 100%)'
                : 'linear-gradient(135deg, #4285F408 0%, #EA433508 50%, #34A85308 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            GDG
          </span>
        </motion.div>

        {/* Floating orbs – more varied */}
        {[
          { x: '15%', y: '18%', size: 14, color: '#4285F4', dur: 4, delay: 0 },
          { x: '78%', y: '25%', size: 10, color: '#EA4335', dur: 5, delay: 0.5 },
          { x: '25%', y: '75%', size: 16, color: '#FBBC04', dur: 4.5, delay: 1 },
          { x: '70%', y: '72%', size: 18, color: '#34A853', dur: 5.5, delay: 1.5 },
          { x: '50%', y: '12%', size: 8, color: '#EA4335', dur: 3.5, delay: 0.3 },
          { x: '88%', y: '55%', size: 6, color: '#4285F4', dur: 6, delay: 2 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, i % 2 === 0 ? -25 : 20, 0] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              backgroundColor: orb.color,
              filter: isDark ? `drop-shadow(0 0 ${orb.size * 3}px ${orb.color})` : 'none',
              opacity: isDark ? 1 : 0.6,
            }}
          />
        ))}

        {/* Main Content */}
        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          {/* Eyebrow */}
          <div ref={(el) => setLineRef(el, 0)} className="text-center mb-6" style={{ opacity: 0 }}>
            <p
              className="section-eyebrow"
              style={{ color: '#4285F4', textShadow: isDark ? '0 0 30px #4285F4' : 'none' }}
            >
              Our Mission
            </p>
          </div>

          {/* Headline: line 1 */}
          <div ref={(el) => setLineRef(el, 1)} className="overflow-visible" style={{ opacity: 0 }}>
            <h2
              className="font-display text-center leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 5.5rem)', color: isDark ? '#ffffff' : '#171717' }}
            >
              Empowering developers to{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.08, y: -3 }}
                transition={{ type: 'spring', stiffness: 500 }}
                style={{ color: '#4285F4', textShadow: isDark ? '0 0 40px #4285F480' : 'none' }}
              >
                connect
              </motion.span>
              ,
            </h2>
          </div>

          {/* Headline: line 2 */}
          <div ref={(el) => setLineRef(el, 2)} className="overflow-visible" style={{ opacity: 0 }}>
            <h2
              className="font-display text-center leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 5.5rem)', color: isDark ? '#ffffff' : '#171717' }}
            >
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.08, y: -3 }}
                transition={{ type: 'spring', stiffness: 500 }}
                style={{ color: '#EA4335', textShadow: isDark ? '0 0 40px #EA433580' : 'none' }}
              >
                learn
              </motion.span>
              , and{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.08, y: -3 }}
                transition={{ type: 'spring', stiffness: 500 }}
                style={{ color: '#34A853', textShadow: isDark ? '0 0 40px #34A85380' : 'none' }}
              >
                grow
              </motion.span>{' '}
              together
            </h2>
          </div>

          {/* Headline: line 3 */}
          <div ref={(el) => setLineRef(el, 3)} className="overflow-visible" style={{ opacity: 0 }}>
            <h2
              className="font-display text-center leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 5.5rem)', color: isDark ? '#ffffff' : '#171717' }}
            >
              through{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.08, y: -3 }}
                transition={{ type: 'spring', stiffness: 500 }}
                style={{ color: '#FBBC04', textShadow: isDark ? '0 0 40px #FBBC0480' : 'none' }}
              >
                technology
              </motion.span>
              .
            </h2>
          </div>

          {/* Google gradient line */}
          <div ref={(el) => setLineRef(el, 4)} style={{ opacity: 0 }}>
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="mt-10 h-[2px] max-w-xs mx-auto rounded-full origin-center"
              style={{
                background: 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC04, #34A853)',
                boxShadow: isDark ? '0 0 30px #4285F480, 0 0 60px #EA433540' : 'none',
              }}
            />
          </div>

          {/* Stat counters – stitched below the headline */}
          <div ref={(el) => setLineRef(el, 5)} style={{ opacity: 0 }}>
            <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-10">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, scale: 1.05 }}
                  className="text-center group"
                >
                  <span
                    className="font-display block leading-none tabular-nums"
                    style={{
                      fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                      color: stat.color,
                      textShadow: isDark ? `0 0 20px ${stat.color}50` : 'none',
                    }}
                  >
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold mt-1 block"
                    style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(23,23,23,0.45)' }}
                  >
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Technology tag cloud */}
          <div ref={(el) => setLineRef(el, 6)} style={{ opacity: 0 }}>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {COMMUNITY_TAGS.map((tag, i) => {
                const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
                const c = colors[i % 4];
                return (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.5 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider cursor-default"
                    style={{
                      background: isDark ? `${c}15` : `${c}10`,
                      color: c,
                      border: `1px solid ${c}${isDark ? '30' : '20'}`,
                    }}
                  >
                    {tag}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSection;

import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

      lines.forEach((line) => {
        gsap.fromTo(
          line,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            force3D: true, // Forces GPU acceleration via transform3d
            scrollTrigger: {
              trigger: line,
              start: 'top 88%',
              toggleActions: 'play none none none',
              once: true,
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
    <div ref={outerRef} id="about" className="relative min-h-screen md:min-h-[115vh]">
      <div
        ref={stickyRef}
        className="relative md:sticky top-0 min-h-screen md:h-screen flex flex-col items-center justify-center overflow-hidden bg-background py-16 md:py-0"
      >
        {/* Large decorative geometric shapes (Desktop only for smooth mobile performance) */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden hidden md:block">
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
            className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full blur-[100px]"
            style={{ background: isDark ? 'rgba(66,133,244,0.06)' : 'rgba(66,133,244,0.04)' }}
          />
          <div
            className="absolute bottom-[15%] right-[10%] w-[25vw] h-[25vw] rounded-full blur-[90px]"
            style={{ background: isDark ? 'rgba(52,168,83,0.06)' : 'rgba(52,168,83,0.04)' }}
          />
        </div>

        {/* Background GDG watermark */}
        <motion.div
          style={{ y: bgY, rotate: bgRotate }}
          className="absolute right-[-10%] top-1/2 -translate-y-1/2 select-none pointer-events-none hidden sm:block"
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

        {/* Floating orbs (Desktop only to prevent mobile CPU throttling) */}
        <div className="hidden md:block pointer-events-none">
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
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          {/* Eyebrow */}
          <div ref={(el) => setLineRef(el, 0)} className="text-center mb-6 will-change-transform" style={{ opacity: 0, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
            <p
              className="section-eyebrow"
              style={{ color: '#4285F4', textShadow: isDark ? '0 0 30px #4285F4' : 'none' }}
            >
              Our Mission
            </p>
          </div>

          {/* Headline: line 1 */}
          <div ref={(el) => setLineRef(el, 1)} className="overflow-visible will-change-transform" style={{ opacity: 0, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
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
          <div ref={(el) => setLineRef(el, 2)} className="overflow-visible will-change-transform" style={{ opacity: 0, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
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
          <div ref={(el) => setLineRef(el, 3)} className="overflow-visible will-change-transform" style={{ opacity: 0, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
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
        </div>
      </div>
    </div>
  );
};

export default MessageSection;

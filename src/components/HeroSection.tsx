import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import HelmetCanvas from './HelmetCanvas';

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Organic blob background */}
      <div className="absolute inset-0 blob-bg" />
      
      {/* Circuit track lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <motion.path
          d="M0 400 Q400 300 600 500 T1000 400 T1400 500 T1920 400"
          fill="none"
          stroke="hsl(var(--track-line))"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
        <motion.path
          d="M0 600 Q300 700 500 550 T900 650 T1300 550 T1920 650"
          fill="none"
          stroke="hsl(var(--track-line))"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 0.5, ease: 'easeInOut' }}
        />
        <motion.path
          d="M0 800 Q500 750 700 850 T1100 780 T1500 870 T1920 800"
          fill="none"
          stroke="hsl(var(--track-line))"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 1, ease: 'easeInOut' }}
        />
      </svg>

      {/* Left Info Card */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{ opacity, y }}
        className="absolute left-6 bottom-32 z-20"
      >
        <div className="border border-foreground/20 rounded-xl p-4 bg-background/80 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Next Race</p>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-12 h-8" viewBox="0 0 60 40">
              <path d="M10 30 L25 10 L40 25 L55 5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <p className="font-display text-lg">MELBOURNE</p>
          <p className="text-lime font-display text-sm">GP</p>
          <div className="mt-3 pt-3 border-t border-foreground/10">
            <p className="text-xs text-muted-foreground">MCLAREN F1</p>
            <p className="text-xs text-muted-foreground">SINCE 2019</p>
          </div>
        </div>
      </motion.div>

      {/* 3D Helmet */}
      <motion.div style={{ scale, opacity }} className="absolute inset-0 z-10">
        <HelmetCanvas />
      </motion.div>

      {/* Hero Title */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{ y, opacity }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center z-20"
      >
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display tracking-wider">
          LANDO NORRIS
        </h1>
        <p className="text-lg md:text-xl font-body text-muted-foreground mt-4">
          2025 McLaren Formula 1 Driver
        </p>
      </motion.div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden py-4 border-t border-foreground/10 z-20">
        <motion.div
          animate={{ x: [0, -1920] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap"
        >
          {Array(4).fill(null).map((_, i) => (
            <span key={i} className="text-sm uppercase tracking-[0.3em] text-muted-foreground mx-8">
              mclaren f1 since 2019 • mclaren f1 since 2019 • mclaren f1 since 2019 •
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

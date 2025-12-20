import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import HelmetCanvas from './HelmetCanvas';
import { ChevronDown, Play } from 'lucide-react';

const CountUp = ({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const ySpring = useSpring(y, { stiffness: 100, damping: 30 });
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);

  const stats = [
    { value: 7, suffix: '', label: 'RACE WINS' },
    { value: 24, suffix: '', label: 'PODIUMS' },
    { value: 6, suffix: '', label: 'POLE POSITIONS' },
    { value: 4, suffix: '', label: 'F1 SEASONS' },
  ];

  return (
    <section ref={ref} className="relative min-h-[120vh] overflow-hidden noise">
      {/* Ambient background */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 track-lines opacity-20" />
      
      {/* Radial glow */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(75 100% 50% / 0.1) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Circuit path SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <motion.path
          d="M-100 500 Q200 300 400 450 T800 400 T1200 500 T1600 350 T2020 450"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="2"
          strokeDasharray="10 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
        <motion.path
          d="M-100 600 Q300 750 500 600 T900 700 T1300 580 T1700 680 T2020 600"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="2"
          strokeDasharray="10 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.3, ease: 'easeInOut' }}
        />
        <motion.path
          d="M-100 800 Q400 700 600 800 T1000 750 T1400 850 T1800 780 T2020 820"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.6, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(75 100% 50% / 0.3)" />
            <stop offset="50%" stopColor="hsl(75 100% 50% / 0.8)" />
            <stop offset="100%" stopColor="hsl(75 100% 50% / 0.3)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Left Stats Card */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 1, ease: [0.23, 1, 0.32, 1] }}
        style={{ opacity, y: ySpring }}
        className="absolute left-6 lg:left-12 bottom-40 z-20 hidden md:block"
      >
        <div className="glass rounded-2xl p-6 w-64">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-lime animate-pulse" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Live Stats</p>
          </div>
          
          <div className="space-y-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-end justify-between">
                <span className="font-display text-3xl text-lime">
                  <CountUp end={stat.value} suffix={stat.suffix} duration={2 + i * 0.3} />
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 rounded overflow-hidden bg-papaya flex items-center justify-center">
                <span className="text-[8px] font-bold text-background">MCL</span>
              </div>
              <div>
                <p className="text-xs font-medium">McLaren F1 Team</p>
                <p className="text-xs text-muted-foreground">Since 2019</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Quick Actions */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.7, duration: 1, ease: [0.23, 1, 0.32, 1] }}
        style={{ opacity }}
        className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.1, x: -10 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 glass rounded-xl flex items-center justify-center group"
        >
          <Play className="w-5 h-5 text-muted-foreground group-hover:text-lime transition-colors" />
        </motion.button>
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-border to-transparent mx-auto" />
        <motion.a
          href="#on-track"
          whileHover={{ scale: 1.1, x: -10 }}
          className="text-xs uppercase tracking-widest text-muted-foreground [writing-mode:vertical-lr] hover:text-lime transition-colors"
        >
          Explore
        </motion.a>
      </motion.div>

      {/* 3D Helmet */}
      <motion.div 
        style={{ scale, opacity }} 
        className="absolute inset-0 z-10"
      >
        <HelmetCanvas />
      </motion.div>

      {/* Hero Title */}
      <motion.div
        style={{ y: titleY, opacity }}
        className="absolute bottom-32 left-0 right-0 text-center z-20 px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-sm md:text-base uppercase tracking-[0.4em] text-lime mb-6"
          >
            McLaren Formula 1 Driver
          </motion.p>
          
          <h1 className="text-display-xl font-display relative">
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="block"
            >
              LANDO
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="block text-lime glow-text"
            >
              NORRIS
            </motion.span>
          </h1>
        </motion.div>
      </motion.div>

      {/* Double Marquee */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="overflow-hidden py-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
          <motion.div
            animate={{ x: [0, -1920] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex whitespace-nowrap"
          >
            {Array(6).fill(null).map((_, i) => (
              <span key={i} className="text-sm uppercase tracking-[0.5em] text-muted-foreground mx-12 flex items-center gap-8">
                <span>McLaren F1</span>
                <span className="w-2 h-2 rounded-full bg-lime" />
                <span>Driver #4</span>
                <span className="w-2 h-2 rounded-full bg-papaya" />
                <span>Since 2019</span>
                <span className="w-2 h-2 rounded-full bg-lime" />
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Scroll</span>
          <ChevronDown className="w-5 h-5 text-lime" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

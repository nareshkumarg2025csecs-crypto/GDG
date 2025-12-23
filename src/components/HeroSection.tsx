import { Suspense, useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import FluidCanvas from './FluidCanvas';
import { useTheme } from '@/contexts/ThemeContext';

const CountUp = ({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

// Loading fallback for 3D canvas
const CanvasLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-background">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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

const HeroSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const stats = [
    { value: 50, suffix: '+', label: 'EVENTS HOSTED', color: '#4285F4' },
    { value: 1200, suffix: '+', label: 'MEMBERS', color: '#EA4335' },
    { value: 20, suffix: '', label: 'WORKSHOPS', color: '#FBBC04' },
    { value: 5, suffix: '', label: 'YEARS ACTIVE', color: '#34A853' },
  ];

  return (
    <section ref={containerRef} className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* WebGL Fluid Canvas Background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<CanvasLoader />}>
          <FluidCanvas />
        </Suspense>
      </div>

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none" />

      {/* Content Layer */}
      <motion.div
        style={{ y, opacity, scale }}
        className="container mx-auto px-6 relative z-20 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className={`text-sm md:text-base uppercase tracking-[0.5em] mb-8 font-medium ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-white/80'}`}
          >
            Building Community Together
          </motion.p>

          {/* Title is now rendered in 3D via FluidCanvas, so we show a subtle DOM version for SEO */}
          <h1 className="sr-only">Google Developer Groups</h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className={`text-xl md:text-2xl font-body max-w-2xl mx-auto mb-16 mt-32 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-white/60'}`}
          >
            Connect, learn, and grow with a community of developers passionate about Google technologies.
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border backdrop-blur-md transition-colors"
              style={{
                backgroundColor: theme === 'light' ? `${stat.color}15` : 'rgba(0,0,0,0.3)',
                borderColor: theme === 'light' ? `${stat.color}40` : 'rgba(255,255,255,0.1)',
                boxShadow: theme === 'light'
                  ? `0 4px 20px -5px ${stat.color}30`
                  : `0 0 30px ${stat.color}15, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <span
                className="font-display text-4xl md:text-5xl mb-2"
                style={{
                  color: theme === 'light' ? stat.color : stat.color,
                  textShadow: theme === 'light' ? 'none' : `0 0 40px ${stat.color}80`,
                }}
              >
                <CountUp end={stat.value} suffix={stat.suffix} duration={2 + i * 0.2} />
              </span>
              <span className={`text-xs uppercase tracking-wider font-semibold ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-white/50'}`}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Marquee */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 w-full overflow-hidden py-5 backdrop-blur-sm border-t ${theme === 'light' ? 'bg-black/90 border-white/10' : 'bg-black/50 border-white/5'}`}>
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap items-center"
        >
          {Array(10).fill(null).map((_, i) => (
            <div key={i} className="flex items-center mx-8 gap-6">
              <span className={`text-sm font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-[#4285F4]' : 'text-white/40'}`}>GDG On Campus</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme === 'light' ? '#4285F4' : '#4285F4', boxShadow: `0 0 10px ${theme === 'light' ? 'transparent' : '#4285F4'}` }} />
              <span className={`text-sm font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-[#EA4335]' : 'text-white/40'}`}>Connect</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme === 'light' ? '#EA4335' : '#EA4335', boxShadow: `0 0 10px ${theme === 'light' ? 'transparent' : '#EA4335'}` }} />
              <span className={`text-sm font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-[#FBBC04]' : 'text-white/40'}`}>Learn</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme === 'light' ? '#FBBC04' : '#FBBC04', boxShadow: `0 0 10px ${theme === 'light' ? 'transparent' : '#FBBC04'}` }} />
              <span className={`text-sm font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-[#34A853]' : 'text-white/40'}`}>Grow</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme === 'light' ? '#34A853' : '#34A853', boxShadow: `0 0 10px ${theme === 'light' ? 'transparent' : '#34A853'}` }} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`p-3 rounded-full border backdrop-blur-sm ${theme === 'light' ? 'border-[rgb(var(--text-secondary-raw))]/20 bg-[rgb(var(--creme-200))]' : 'border-white/20 bg-black/30'}`}
        >
          <ChevronDown className={`w-5 h-5 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-white/50'}`} />
        </motion.div>
      </motion.div>

      {/* Interaction hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 3, duration: 3, repeat: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <p className="text-white/30 text-sm uppercase tracking-widest">Move your mouse to interact</p>
      </motion.div>
    </section>
  );
};

export default HeroSection;

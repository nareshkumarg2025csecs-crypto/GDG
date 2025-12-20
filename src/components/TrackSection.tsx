import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const TrackSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const leftX = useTransform(scrollYProgress, [0, 0.5], [-100, 0]);
  const rightX = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  return (
    <section id="on-track" ref={ref} className="py-40 relative overflow-hidden noise">
      <div className="absolute inset-0 track-lines opacity-10" />
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <motion.div style={{ x: leftX }} className="group relative">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden relative bg-gradient-to-br from-forest via-carbon to-background">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="w-48 h-48 rounded-full border border-lime/20 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-lime/10 flex items-center justify-center font-display text-6xl text-lime/30">🏎️</div>
                </motion.div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <h3 className="text-7xl md:text-9xl font-display text-foreground/90">ON</h3>
                <h3 className="text-7xl md:text-9xl font-display text-lime glow-text">TRACK</h3>
              </div>
              <motion.div className="absolute inset-0 bg-lime/10" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} />
            </div>
            <div className="mt-8">
              <p className="text-muted-foreground text-lg">Race results, career stats, and trackside moments.</p>
              <motion.a href="#" whileHover={{ x: 10, color: 'hsl(75 100% 50%)' }} className="inline-flex items-center gap-3 mt-4 text-lime font-medium text-lg">
                Explore <ArrowRight className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>
          <motion.div style={{ x: rightX }} className="group relative md:mt-24">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden relative bg-gradient-to-br from-carbon-light via-carbon to-background">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-40 h-40 rounded-full bg-foreground/5 flex items-center justify-center font-display text-6xl text-foreground/20">👤</motion.div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <h3 className="text-7xl md:text-9xl font-display text-foreground/90">OFF</h3>
                <h3 className="text-7xl md:text-9xl font-display text-papaya">TRACK</h3>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-muted-foreground text-lg">Campaigns, partnerships, and behind the scenes.</p>
              <motion.a href="#" whileHover={{ x: 10, color: 'hsl(25 95% 55%)' }} className="inline-flex items-center gap-3 mt-4 text-papaya font-medium text-lg">
                Discover <ArrowRight className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrackSection;

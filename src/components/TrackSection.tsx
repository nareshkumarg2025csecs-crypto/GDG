import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const TrackSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* On Track */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative"
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-forest to-foreground rounded-2xl overflow-hidden relative">
              {/* Helmet image placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-40 h-40 rounded-full bg-lime/20 flex items-center justify-center"
                >
                  <span className="font-display text-6xl text-lime/40">🏎️</span>
                </motion.div>
              </div>

              {/* Title overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <motion.h3
                  className="text-6xl md:text-8xl font-display text-background leading-none"
                  whileHover={{ scale: 1.02 }}
                >
                  ON
                </motion.h3>
                <motion.h3
                  className="text-6xl md:text-8xl font-display text-lime leading-none"
                  whileHover={{ scale: 1.02 }}
                >
                  TRACK
                </motion.h3>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-muted-foreground font-body">
                Most recent <span className="font-semibold text-foreground">results</span>, 
                career stats and photos from trackside.
              </p>
              <motion.a
                href="#on-track"
                whileHover={{ x: 10 }}
                className="inline-flex items-center gap-2 mt-4 text-lime font-body font-medium group-hover:gap-4 transition-all"
              >
                View On Track
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Off Track */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group relative md:mt-20"
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-cream-dark to-muted rounded-2xl overflow-hidden relative">
              {/* Portrait placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-40 h-40 rounded-full bg-foreground/10 flex items-center justify-center"
                >
                  <span className="font-display text-6xl text-foreground/30">👤</span>
                </motion.div>
              </div>

              {/* Title overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <motion.h3
                  className="text-6xl md:text-8xl font-display text-foreground leading-none"
                  whileHover={{ scale: 1.02 }}
                >
                  OFF
                </motion.h3>
                <motion.h3
                  className="text-6xl md:text-8xl font-display text-forest leading-none"
                  whileHover={{ scale: 1.02 }}
                >
                  TRACK
                </motion.h3>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-muted-foreground font-body">
                <span className="font-semibold text-foreground">Campaigns</span>, shoots and 
                other promotional materials for fans.
              </p>
              <motion.a
                href="#off-track"
                whileHover={{ x: 10 }}
                className="inline-flex items-center gap-2 mt-4 text-forest font-body font-medium group-hover:gap-4 transition-all"
              >
                View Off Track
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrackSection;

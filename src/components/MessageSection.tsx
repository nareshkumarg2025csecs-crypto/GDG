import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const MessageSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Signature background */}
      <motion.div
        style={{ y, opacity }}
        className="absolute right-10 top-1/2 -translate-y-1/2 text-[20rem] font-display text-lime/10 select-none"
      >
        LN
      </motion.div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-lime mb-8">
            Message from Lando
          </p>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-body font-light leading-tight">
            <span className="font-semibold">Redefining</span> limits, fighting for{' '}
            <span className="font-semibold">wins</span>, bringing it all in all ways.
            Defining a <span className="font-semibold">legacy</span> in Formula 1
            on and off the track.
          </h2>

          {/* Signature */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12"
          >
            <svg
              viewBox="0 0 200 80"
              className="w-48 h-20 text-lime"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <motion.path
                d="M10 60 Q30 20 50 40 T90 30 Q100 50 120 35 T160 45 Q180 30 190 50"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MessageSection;

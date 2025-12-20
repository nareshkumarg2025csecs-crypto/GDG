import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const photos = [
  { id: 1, title: 'Qatar GP 2024', subtitle: 'Walking through paddock' },
  { id: 2, title: 'FIA Prize Giving', subtitle: 'Trophy celebration' },
  { id: 3, title: 'Miami GP 2024', subtitle: 'First win celebration' },
  { id: 4, title: 'Monaco 2023', subtitle: 'Race weekend' },
  { id: 5, title: 'Silverstone 2024', subtitle: 'Home crowd' },
  { id: 6, title: 'Singapore Night', subtitle: 'Under the lights' },
];

const PhotoGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -600]);

  return (
    <section ref={containerRef} className="py-32 overflow-hidden noise">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="container mx-auto px-6 mb-16">
        <blockquote className="max-w-4xl text-2xl md:text-4xl font-body font-light text-center mx-auto leading-relaxed">
          "It doesn't matter where you start, it's how you <span className="text-lime font-medium">progress</span> from there."
        </blockquote>
        <motion.svg viewBox="0 0 200 60" className="w-40 h-16 mx-auto mt-8 text-lime" fill="none" stroke="currentColor" strokeWidth="2.5">
          <motion.path d="M10 40 Q40 10 70 35 T130 25 Q150 40 190 30" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
        </motion.svg>
      </motion.div>
      <motion.div style={{ x }} className="flex gap-8 px-6">
        {photos.map((photo, i) => (
          <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.03 }} className="relative flex-shrink-0 w-[450px] md:w-[550px] group cursor-pointer">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative bg-gradient-to-br from-carbon-light to-carbon">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-lime/30 flex items-center justify-center"><span className="font-display text-3xl text-lime/40">{photo.id}</span></div>
              </div>
              <motion.div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} />
              <motion.div className="absolute bottom-6 left-6 right-6" initial={{ y: 20, opacity: 0 }} whileHover={{ y: 0, opacity: 1 }}>
                <p className="text-xs uppercase tracking-widest text-lime mb-2">{photo.title}</p>
                <p className="font-display text-2xl">{photo.subtitle}</p>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default PhotoGallery;

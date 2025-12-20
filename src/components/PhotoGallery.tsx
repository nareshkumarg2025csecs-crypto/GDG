import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const photos = [
  { id: 1, title: 'Qatar, 2024', subtitle: 'Walking through paddock', aspect: 'landscape' },
  { id: 2, title: 'FIA Prize Giving, 2024', subtitle: 'Trophy celebration', aspect: 'landscape' },
  { id: 3, title: 'Miami GP, 2024', subtitle: 'First win celebration', aspect: 'landscape' },
  { id: 4, title: 'Monaco, 2023', subtitle: 'Golf day', aspect: 'landscape' },
  { id: 5, title: 'Britain, 2025', subtitle: 'In the car', aspect: 'landscape' },
  { id: 6, title: 'Battersea, 2024', subtitle: 'With the dog', aspect: 'landscape' },
];

const PhotoGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -500]);

  return (
    <section ref={containerRef} className="py-20 overflow-hidden">
      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-6 mb-16"
      >
        <blockquote className="max-w-3xl text-2xl md:text-3xl font-body font-light text-center mx-auto">
          "It doesn't matter where you start, it's how you progress from there."
        </blockquote>
        <svg
          viewBox="0 0 200 60"
          className="w-36 h-14 mx-auto mt-6 text-lime"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <motion.path
            d="M10 40 Q40 10 70 35 T130 25 Q150 40 190 30"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          />
        </svg>
      </motion.div>

      {/* Horizontal scrolling gallery */}
      <motion.div style={{ x }} className="flex gap-6 px-6">
        {photos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="relative flex-shrink-0 w-[400px] md:w-[500px] group cursor-pointer"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-muted to-cream-dark rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Placeholder pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-2 border-lime/30 rounded-full flex items-center justify-center">
                  <span className="font-display text-2xl text-lime/50">{photo.id}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xs uppercase tracking-wider text-lime mb-1">{photo.title}</p>
              <p className="font-display text-lg">{photo.subtitle}</p>
            </div>

            {/* Corner accent */}
            <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-lime opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-lime opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </motion.div>

      {/* Another quote */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-6 mt-20"
      >
        <blockquote className="max-w-4xl text-xl md:text-2xl font-body font-light">
          "Since I was 7 years old and had my first experience with kart racing, 
          I've worked tirelessly to make that dream come true."
        </blockquote>
      </motion.div>
    </section>
  );
};

export default PhotoGallery;

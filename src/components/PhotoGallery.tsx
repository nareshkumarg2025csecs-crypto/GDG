import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const photos = [
  { id: 1, title: 'DevFest 2024', subtitle: 'Keynote Session', color1: '#4285F4', color2: '#34A853' },
  { id: 2, title: 'I/O Extended', subtitle: 'Live Watch Party', color1: '#EA4335', color2: '#FBBC04' },
  { id: 3, title: 'Cloud Summit', subtitle: 'Workshop Track', color1: '#FBBC04', color2: '#EA4335' },
  { id: 4, title: 'Hackathon', subtitle: 'Team Coding', color1: '#34A853', color2: '#4285F4' },
  { id: 5, title: 'Women Techmakers', subtitle: 'Panel Discussion', color1: '#4285F4', color2: '#EA4335' },
  { id: 6, title: 'Flutter Festival', subtitle: 'App Showcase', color1: '#EA4335', color2: '#34A853' },
];

const PhotoGallery = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-200, 100]);

  return (
    <section ref={containerRef} id="gallery" className="py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p
            className="text-sm uppercase tracking-[0.3em] mb-4 font-bold"
            style={{ color: '#FBBC04', textShadow: '0 0 30px #FBBC04' }}
          >
            Memories
          </p>
          <blockquote className="max-w-4xl text-3xl md:text-4xl font-display text-center mx-auto leading-tight text-white">
            "Innovation happens when we come{' '}
            <span style={{ color: '#4285F4', textShadow: '0 0 30px #4285F480' }}>together</span>
            {' '}to share ideas and build solutions."
          </blockquote>
        </motion.div>
      </div>

      {/* Horizontal Scrolling Gallery Row 1 */}
      <motion.div
        style={{ x }}
        className="flex gap-6 pl-6 mb-6"
      >
        {photos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05, y: -10 }}
            className="relative flex-shrink-0 w-80 h-96 rounded-3xl overflow-hidden cursor-pointer group border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${photo.color1}20 0%, ${photo.color2}20 100%)`,
              boxShadow: `0 0 60px ${photo.color1}15`,
            }}
          >
            {/* Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle at 3px 3px, rgba(255,255,255,0.3) 1px, transparent 0)',
                backgroundSize: '30px 30px'
              }}
            />

            {/* Large Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-display text-[12rem] leading-none"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: `2px ${photo.color1}30`,
                }}
              >
                {photo.id}
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p
                className="text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: photo.color1 }}
              >
                {photo.title}
              </p>
              <p className="font-display text-3xl text-white">{photo.subtitle}</p>
            </div>

            {/* Hover Glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(ellipse at center, ${photo.color1}20 0%, transparent 70%)` }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Second Row - Reverse Direction */}
      <motion.div
        style={{ x: x2 }}
        className="flex gap-6 pl-6"
      >
        {[...photos].reverse().map((photo, i) => (
          <motion.div
            key={`rev-${photo.id}`}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative flex-shrink-0 w-64 h-72 rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${photo.color2}15 0%, ${photo.color1}15 100%)`,
            }}
          >
            {/* Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: photo.color2 }}>{photo.title}</p>
              <p className="font-display text-xl text-white">{photo.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default PhotoGallery;

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GALLERY_ITEMS, type GalleryItem } from './data/galleryData';
import { ArrowRight, MoveRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const PolaroidCard = ({ item, index }: { item: GalleryItem; index: number }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const randomRotation = (index % 2 === 0 ? 3 : -3) + (index % 3);
  const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
  const cardColor = colors[index % 4];
  const isYellow = cardColor === '#FBBC04';
  const textColor = isDark ? 'text-black' : isYellow ? 'text-black' : 'text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: randomRotation + 5 }}
      whileInView={{ opacity: 1, y: 0, rotate: randomRotation }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link
        to="/gallery"
        className="block group relative w-[20rem] flex-shrink-0"
        style={{ transform: `rotate(${randomRotation}deg)` }}
        data-physics
        data-cursor="media"
      >
        <div
          className="p-3 pb-8 transition-all duration-500 transform group-hover:scale-105 group-hover:rotate-0"
          style={{
            backgroundColor: isDark ? '#ffffff' : cardColor,
            boxShadow: isDark
              ? '0 10px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)'
              : `0 10px 40px ${cardColor}30, 0 2px 8px ${cardColor}20`,
          }}
        >
        {/* Image Area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
          <div
            className="absolute inset-0 opacity-[0.05] z-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
          <img
            src={item.artifactImage || item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-2 right-2 z-20">
            <span className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 uppercase tracking-widest">
              {item.category}
            </span>
          </div>
        </div>

        {/* Caption */}
        <div className="text-center font-handwriting">
          <h3 className={`font-display text-xl leading-none mb-1 ${textColor}`}>{item.title}</h3>
          <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : isYellow ? 'text-black/60' : 'text-white/80'}`}>
            {item.date}
          </p>
          <div className="h-0 group-hover:h-6 transition-all duration-300 overflow-hidden">
            <span
              className={`block mt-2 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity delay-100 ${
                isDark ? 'text-[#4285F4]' : isYellow ? 'text-black' : 'text-white'
              }`}
            >
              View Artifact →
            </span>
          </div>
        </div>
      </div>
      </Link>
    </motion.div>
  );
};

const MiniGallery = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Enhanced parallax range
  const x = useTransform(scrollYProgress, [0, 1], ['5%', '-30%']);

  const featuredItems = GALLERY_ITEMS.filter(item => item.featured).slice(0, 5);

  return (
    <section
      ref={containerRef}
      className="py-20 overflow-hidden relative border-t transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#050505' : '#FAFAFA',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(31,31,31,0.08)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full blur-[140px] pointer-events-none"
        style={{ backgroundColor: isDark ? 'rgba(66,133,244,0.04)' : 'rgba(66,133,244,0.03)' }} />

      {/* Header */}
      <div className="container mx-auto px-6 mb-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <p
            className="section-eyebrow mb-4"
            style={{ color: '#EA4335' }}
          >
            // Visual_Archive
          </p>
          <h2
            className="font-display mb-8"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              color: 'rgb(var(--foreground))',
              lineHeight: 1,
            }}
          >
            CAPTURED{' '}
            <span
              className="italic"
              style={{
                background: 'linear-gradient(90deg, #4285F4, #EA4335)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                paddingRight: '0.05em',
              }}
            >
              MOMENTS
            </span>
          </h2>

          <Link
            to="/gallery"
            className="btn-shimmer group inline-flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-300 border font-body font-semibold text-sm"
            style={{
              backgroundColor: isDark ? 'rgb(var(--card-bg))' : '#1F1F1F',
              color: isDark ? 'rgb(var(--foreground))' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,31,31,0.15)',
            }}
          >
            <span className="font-mono text-xs tracking-wider uppercase">Museum of Memories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      {/* Parallax slider */}
      <div className="w-full overflow-visible">
        <motion.div
          style={{ x }}
          className="flex gap-12 w-max px-6 md:px-[10vw] py-10"
        >
          {featuredItems.map((item, i) => (
            <PolaroidCard key={item.id} item={item} index={i} />
          ))}

          {/* "See More" card */}
          <Link
            to="/gallery"
            className="group relative w-[20rem] flex-shrink-0 flex items-center justify-center rounded-sm transition-all aspect-[4/5]"
            data-physics
            style={{
              border: `2px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,31,31,0.15)'}`,
            }}
          >
            <div className="text-center group-hover:scale-110 transition-transform duration-300">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,31,31,0.06)',
                  color: isDark ? '#ffffff' : '#1F1F1F',
                }}
              >
                <MoveRight className="w-5 h-5" />
              </div>
              <span
                className="font-display text-xl"
                style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(31,31,31,0.6)' }}
              >
                Full Archive
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default MiniGallery;

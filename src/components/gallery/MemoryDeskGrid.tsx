import { useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { GalleryItem } from './data/galleryData';
import gsap from 'gsap';
import { Flip } from 'gsap/all';

gsap.registerPlugin(Flip);

interface MemoryDeskGridProps {
    items: GalleryItem[];
    onItemClick: (item: GalleryItem) => void;
}

const MemoryCard = ({ item, onClick, index }: { item: GalleryItem; onClick: () => void; index: number }) => {
    const { theme } = useTheme();
    const ref = useRef<HTMLDivElement>(null);

    const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
    const cardColor = colors[index % 4];
    const isYellow = cardColor === '#FBBC04';
    const textColor = theme === 'light' ? (isYellow ? 'text-black' : 'text-white') : 'text-black';

    // Random initial transforms (deterministic based on ID/index to prevent jumping on re-renders)
    const rotation = useMemo(() => (index % 2 === 0 ? 1 : -1) * ((index * 7) % 5 + 2), [index]); // -7deg to 7deg
    const yOffset = useMemo(() => ((index * 13) % 40) - 20, [index]); // -20px to 20px

    // Mouse position mechanism for magnetic effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from center
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        // Magnetic pull - simplified direct set without spring for stability
        x.set(distanceX * 0.1);
        y.set(distanceY * 0.1);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            className={`gallery-item relative cursor-pointer group w-full mb-12 sm:mb-24 break-inside-avoid`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            data-physics
            style={{
                x: x,
                y: y,
                rotate: rotation,
                marginTop: `${yOffset}px`
            }}
        >
            <motion.div
                className={`relative p-3 pb-8 shadow-lg transform transition-all duration-500 ease-out group-hover:scale-105 group-hover:rotate-0 group-hover:z-10 group-hover:shadow-2xl ${theme === 'light' ? '' : 'bg-white'}`}
                style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                    backgroundColor: theme === 'light' ? cardColor : undefined
                }}
            >
                {/* Artifact Image (The "Polaroid") */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {/* Texture overlay for paper feel */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-20"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }}
                    />

                    <img
                        src={item.artifactImage || item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />

                    {/* Category Badge Sticker */}
                    <div className="absolute top-2 right-2 z-10">
                        <span
                            className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white shadow-sm"
                            style={{ backgroundColor: item.backgroundColor || '#000', transform: 'rotate(2deg)' }}
                        >
                            {item.category}
                        </span>
                    </div>
                </div>

                {/* Caption */}
                <div className="mt-4 px-1 text-center font-handwriting">
                    <div className="flex justify-between items-end">
                        <h3 className={`font-display text-xl leading-none ${textColor}`}>{item.title}</h3>
                        <span className={`font-mono text-[10px] ${theme === 'light' ? (isYellow ? 'text-black/60' : 'text-white/80') : 'text-gray-400'}`}>{item.date}</span>
                    </div>

                    {/* Hidden "Read Story" hint appearing on hover */}
                    <div className="h-0 group-hover:h-6 transition-all duration-300 overflow-hidden">
                        <p className={`text-xs font-bold mt-2 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-100 ${theme === 'light' ? (isYellow ? 'text-black' : 'text-white') : 'text-[#4285F4]'}`}>
                            Read Story →
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const MemoryDeskGrid = ({ items, onItemClick }: MemoryDeskGridProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // GSAP Flip Integration for filtering
    useEffect(() => {
        // This hook runs whenever 'items' changes (filtering)
        // In a real implementation with Flip, we'd capture state before items change in the parent,
        // but React's rendering model makes that part tricky without lifting state up significantly.
        // For now, we'll rely on Framer Motion's layout animations for the filtering movements
        // or standard re-renders since we're replacing the grid completely.

        // If we were using pure GSAP Flip for layout:
        // const state = Flip.getState(".gallery-item");
        // Flip.from(state, { ...options });

        // Since we are using Framer Motion for the cards, we can let AnimatePresence handle it or just simple re-renders.
        // However, the "Scattered" layout is best achieved with CSS constraints.
    }, [items]);

    return (
        <div ref={containerRef} className="w-full py-20 px-4 md:px-0">
            {/* 
        Masonry-ish layout using CSS Columns 
        This is simple and robust for scattered polaroids
      */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-16 space-y-16 mx-auto max-w-7xl perspective-[2000px]">
                {items.map((item, index) => (
                    <MemoryCard
                        key={item.id}
                        item={item}
                        index={index}
                        onClick={() => onItemClick(item)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MemoryDeskGrid;

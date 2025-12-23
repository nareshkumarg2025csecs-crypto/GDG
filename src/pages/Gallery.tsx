import { useState, useLayoutEffect, useRef, useMemo, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Flip } from 'gsap/all';
import gsap from 'gsap';
import MemoryDeskGrid from '@/components/gallery/MemoryDeskGrid';
import { GALLERY_ITEMS, GalleryCategory, GALLERY_CATEGORIES, GalleryItem } from '@/components/gallery/data/galleryData';
import { motion } from 'framer-motion';
import StoryDetailView from '@/components/gallery/StoryDetailView';
import Header from '@/components/Header';

gsap.registerPlugin(Flip);

const Gallery = () => {
    const { theme } = useTheme();
    const [filter, setFilter] = useState<GalleryCategory | 'All'>('All');
    const [items, setItems] = useState(GALLERY_ITEMS);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Filter items based on selection
    const filteredItems = useMemo(() => {
        if (filter === 'All') return GALLERY_ITEMS;
        return GALLERY_ITEMS.filter(item => item.category === filter);
    }, [filter]);

    const handleFilterChange = (category: GalleryCategory | 'All') => {
        // 1. CAPTURE STATE (Current items positions)
        const state = Flip.getState(".gallery-item");

        // 2. UPDATE STATE (React removes/adds items)
        setFilter(category);

        // 3. Store state for layout effect
        (window as any).galleryFlipState = state;
    };

    useLayoutEffect(() => {
        const state = (window as any).galleryFlipState;
        if (!state) return;

        // Cleanup global
        (window as any).galleryFlipState = null;

        // Animate
        Flip.from(state, {
            targets: ".gallery-item",
            duration: 0.6,
            ease: "power2.inOut",
            stagger: 0.05,
            absolute: true, // Crucial for masonry
            onEnter: elements => {
                gsap.fromTo(elements,
                    { opacity: 0, scale: 0.8 },
                    { opacity: 1, scale: 1, duration: 0.4, delay: 0.2 }
                );
            },
            onLeave: elements => {
                gsap.to(elements, { opacity: 0, scale: 0.8, duration: 0.4 });
            }
        });

    }, [filteredItems]);

    // Parallax logic
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowH = window.innerHeight;
            const progress = Math.min(scrollY / windowH, 1);
            setScrollProgress(progress);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const heroItem = useMemo(() => items.find(i => i.featured) || items[0], [items]);

    const handleItemClick = (item: GalleryItem) => {
        setSelectedItem(item);
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen text-[rgb(var(--foreground))] transition-colors duration-300"
            style={{ backgroundColor: theme === 'light' ? '#FAF6E8' : '#050505' }}
        >
            <Header transparent={true} />
            <StoryDetailView item={selectedItem} onClose={() => setSelectedItem(null)} />

            {/* HERO SECTION */}
            <div className="fixed inset-0 h-[100vh] w-full z-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-100 ease-out will-change-transform"
                    style={{
                        backgroundImage: `url(${heroItem.image})`,
                        transform: `scale(${1 + scrollProgress * 0.2}) translateY(${scrollProgress * 50}px)`,
                        opacity: 1 - scrollProgress * 1.5,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050505]" />
                <div className="absolute inset-0 bg-black/20" />

                <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                    style={{
                        opacity: 1 - scrollProgress * 2,
                        transform: `translateY(${scrollProgress * -100}px)`
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <p className="text-[#4285F4] font-mono text-xs tracking-[0.5em] uppercase mb-4 backdrop-blur-md bg-black/30 px-4 py-2 rounded-full inline-block border border-white/10">
                            // Museum_of_Memories
                        </p>
                        <h1 className="text-6xl md:text-8xl font-display text-white mb-6 drop-shadow-2xl">
                            GALLERY
                        </h1>
                        <p className="text-gray-300 max-w-lg mx-auto text-sm md:text-base font-light leading-relaxed">
                            Every event is a story waiting to be told. Explore the artifacts of our journey.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* CONTENT LAYER */}
            <div className="relative z-10 pt-[100vh]">
                <div
                    className="min-h-screen rounded-t-[3rem] border-t border-white/10 dark:border-white/10 border-gray-200 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-colors duration-300"
                    style={{ backgroundColor: theme === 'light' ? '#FAF6E8' : '#050505' }}
                >

                    {/* Sticky Filters */}
                    <div
                        className="sticky top-24 z-40 py-8 backdrop-blur-xl border-b border-white/5 dark:border-white/5 border-gray-200 transition-all duration-300"
                        style={{ backgroundColor: theme === 'light' ? 'rgba(250, 246, 232, 0.8)' : 'rgba(5, 5, 5, 0.8)' }}
                    >
                        <div className="container mx-auto px-6 flex justify-center">
                            <div className="flex flex-wrap gap-2 justify-center bg-white/5 p-1 rounded-full border border-white/10">
                                <button
                                    onClick={() => handleFilterChange('All')}
                                    className={`px-6 py-2 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${filter === 'All'
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105'
                                        : 'bg-transparent text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                                        }`}
                                >
                                    ALL
                                </button>
                                {GALLERY_CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleFilterChange(cat)}
                                        className={`px-6 py-2 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${filter === cat
                                            ? 'bg-white text-black shadow-lg scale-105'
                                            : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {cat.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Memory Desk Grid */}
                    <div className="container mx-auto pb-32 pt-12">
                        <MemoryDeskGrid items={filteredItems} onItemClick={handleItemClick} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gallery;

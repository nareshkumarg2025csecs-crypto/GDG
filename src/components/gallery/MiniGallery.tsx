import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GALLERY_ITEMS } from './data/galleryData';
import { ArrowRight, MoveRight } from 'lucide-react';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const PolaroidCard = ({ item, index }: { item: any; index: number }) => {
    const { theme } = useTheme();
    // Random rotation for the natural "scattered" look
    const randomRotation = (index % 2 === 0 ? 3 : -3) + (index % 3);
    const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
    const cardColor = colors[index % 4];
    const isYellow = cardColor === '#FBBC04';
    const textColor = theme === 'light' ? (isYellow ? 'text-black' : 'text-white') : 'text-black';

    return (
        <Link
            to="/gallery"
            className="block group relative w-[20rem] flex-shrink-0"
            style={{ transform: `rotate(${randomRotation}deg)` }}
        >
            <div
                className={`p-3 pb-8 shadow-xl transition-all duration-500 transform group-hover:scale-105 group-hover:rotate-0 group-hover:shadow-2xl ${theme === 'light' ? '' : 'bg-white'}`}
                style={{ backgroundColor: theme === 'light' ? cardColor : undefined }}
            >
                {/* Image Area */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />

                    <img
                        src={item.artifactImage || item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Badge */}
                    <div className="absolute top-2 right-2">
                        <span className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 uppercase tracking-widest">
                            {item.category}
                        </span>
                    </div>
                </div>

                {/* Caption */}
                <div className="text-center font-handwriting">
                    <h3 className={`font-display text-xl leading-none mb-1 ${textColor}`}>{item.title}</h3>
                    <p className={`text-xs font-mono ${theme === 'light' ? (isYellow ? 'text-black/60' : 'text-white/80') : 'text-gray-400'}`}>{item.date}</p>
                    <div className="h-0 group-hover:h-6 transition-all duration-300 overflow-hidden">
                        <span className={`block mt-2 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity delay-100 ${theme === 'light' ? (isYellow ? 'text-black' : 'text-white') : 'text-[#4285F4]'}`}>
                            View Artifact →
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const MiniGallery = () => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);

    // Select items
    const featuredItems = GALLERY_ITEMS.filter(item => item.featured).slice(0, 5);

    return (
        <section
            ref={containerRef}
            className="py-32 overflow-hidden relative border-t border-white/5 transition-colors duration-300"
            style={{ backgroundColor: theme === 'light' ? '#FAF6E8' : '#050505' }}
        >

            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#4285F4]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 mb-20 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <p className="text-[#EA4335] font-mono text-xs tracking-[0.4em] uppercase mb-4">
                        // Visual_Archive
                    </p>
                    <h2 className="text-5xl md:text-7xl font-display text-[rgb(var(--foreground))] mb-6 transition-colors duration-300">
                        CAPTURED <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] to-[#EA4335] italic pr-2">MOMENTS</span>
                    </h2>
                    <Link
                        to="/gallery"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-[rgb(var(--card-bg))] hover:bg-[rgb(var(--foreground))] text-[rgb(var(--foreground))] hover:text-[rgb(var(--background))] rounded-full transition-all duration-300 border border-white/10"
                    >
                        <span className="font-mono text-xs tracking-wider uppercase">Museum of Memories</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>

            {/* Cinematic Slider */}
            <div className="w-full overflow-visible">
                <motion.div
                    style={{ x }}
                    className="flex gap-12 w-max px-6 md:px-[10vw] py-10"
                >
                    {featuredItems.map((item, i) => (
                        <PolaroidCard key={item.id} item={item} index={i} />
                    ))}

                    {/* "See More" Card */}
                    <Link
                        to="/gallery"
                        className="group relative w-[20rem] flex-shrink-0 flex items-center justify-center rounded-sm border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all aspect-[4/5]"
                    >
                        <div className="text-center group-hover:scale-110 transition-transform duration-300">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                                <MoveRight className="w-6 h-6" />
                            </div>
                            <span className="font-display text-xl text-white">Full Archive</span>
                        </div>
                    </Link>
                </motion.div>
            </div>

        </section>
    );
};

export default MiniGallery;

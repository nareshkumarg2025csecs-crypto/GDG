import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GalleryItem } from './data/galleryData';
import { X, Clock, Users, Star, ArrowRight } from 'lucide-react';
import ScatteredGallery from './ScatteredGallery';
import gsap from 'gsap';

interface StoryDetailViewProps {
    item: GalleryItem | null;
    onClose: () => void;
}

import { useTheme } from '@/contexts/ThemeContext';

const StoryDetailView = ({ item, onClose }: StoryDetailViewProps) => {
    const { theme } = useTheme();
    const [isFlipped, setIsFlipped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: containerRef });

    // Parallax for the hero image
    const imageY = useTransform(scrollY, [0, 500], [0, 150]);

    // Reset flip state when opening new item
    useEffect(() => {
        if (item) {
            setIsFlipped(false);
            // Auto flip after a delay for dramatic effect
            const timer = setTimeout(() => setIsFlipped(true), 800);
            return () => clearanceTimeout(timer);
        }
    }, [item]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (item) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [item]);

    function clearanceTimeout(timer: NodeJS.Timeout) {
        clearTimeout(timer);
    }

    if (!item) return null;

    return (
        <AnimatePresence>
            {item && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-xl"
                    style={{ backgroundColor: theme === 'light' ? 'rgba(255, 249, 230, 0.95)' : 'rgba(0, 0, 0, 0.95)' }}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`absolute top-6 right-6 z-50 p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-[rgb(var(--yellow-400))]/20 hover:bg-[rgb(var(--yellow-400))]/40 text-[rgb(var(--text-primary-raw))]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                        <X size={24} />
                    </button>

                    {/* Scrollable Container */}
                    <div
                        ref={containerRef}
                        className="w-full h-full overflow-y-auto overflow-x-hidden"
                    >
                        <div className="min-h-screen flex flex-col items-center pb-20">

                            {/* HERO / FLIP SECTION */}
                            <div className="w-full h-[60vh] md:h-[70vh] relative perspective-[1500px] flex items-center justify-center pt-20">

                                {/* The Card Container */}
                                <motion.div
                                    className="relative w-[90%] md:w-[600px] aspect-[4/3] preserve-3d"
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    {/* FRONT: Artifact / Polaroid */}
                                    <div
                                        className="absolute inset-0 backface-hidden bg-white p-4 shadow-2xl rounded-sm will-change-transform"
                                        style={{ backfaceVisibility: 'hidden' }}
                                    >
                                        <div className="w-full h-[85%] bg-gray-100 overflow-hidden relative">
                                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }}
                                            />
                                            <img src={item.artifactImage || item.image} alt="Artifact" className="w-full h-full object-cover" />
                                            <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded">
                                                EVIDENCE #{item.id}
                                            </div>
                                        </div>
                                        <div className="mt-4 text-center font-handwriting">
                                            <h2 className="text-3xl text-black font-display">{item.title}</h2>
                                        </div>
                                    </div>

                                    {/* BACK: Real Event Image */}
                                    <div
                                        className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl border"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)',
                                            backgroundColor: theme === 'light' ? '#FFF9E6' : '#0a0a0a',
                                            borderColor: theme === 'light' ? 'rgba(var(--yellow-400), 0.5)' : 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <img src={item.realImage || item.image} alt={item.title} className="w-full h-full object-cover opacity-60" />
                                        <div className="absolute inset-0"
                                            style={{ background: theme === 'light' ? 'linear-gradient(to top, rgba(var(--yellow-50), 0.9), transparent)' : 'linear-gradient(to top, #0a0a0a, transparent)' }}
                                        />

                                        <div className="absolute bottom-0 left-0 w-full p-8">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <h2 className="text-4xl md:text-5xl font-display mb-2" style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : 'white' }}>{item.title}</h2>
                                                <div className="flex items-center gap-4 text-sm font-mono" style={{ color: theme === 'light' ? 'rgba(var(--text-primary-raw), 0.6)' : '#9CA3AF' }}>
                                                    <span>{item.date}</span>
                                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme === 'light' ? 'rgb(var(--yellow-600))' : '#9CA3AF' }} />
                                                    <span style={{ color: theme === 'light' ? 'rgb(var(--yellow-600))' : 'inherit' }}>{item.category.toUpperCase()}</span>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* NARRATIVE SECTION */}
                            <motion.div
                                className="w-full max-w-4xl px-6 md:px-0 grid grid-cols-1 md:grid-cols-3 gap-12 mt-12"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                {/* Left Column: Metrics & Sticky Note */}
                                <div className="space-y-8">
                                    {/* Sticky Note Quote */}
                                    {item.story?.quote && (
                                        <div className="bg-[#fef9c3] text-black p-6 shadow-lg rotate-[-2deg] transform hover:rotate-0 transition-transform duration-300 relative group">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/10 blur-sm rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
                                            <p className="font-handwriting text-xl leading-relaxed mb-4">
                                                "{item.story.quote.text}"
                                            </p>
                                            <div className="text-xs font-mono opacity-60 text-right">
                                                — {item.story.quote.author}
                                            </div>
                                        </div>
                                    )}

                                    {/* Metrics Grid */}
                                    {item.metrics && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {item.metrics.attendees && (
                                                <div className={`p-4 rounded-lg text-center border ${theme === 'light' ? 'bg-[rgb(var(--yellow-200))] border-[rgb(var(--yellow-400))]' : 'bg-white/5 border-white/10'}`}>
                                                    <Users className={`w-5 h-5 mx-auto mb-2 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-[#4285F4]'}`} />
                                                    <div className={`text-2xl font-display ${theme === 'light' ? 'text-[rgb(var(--text-primary-raw))]' : 'text-white'}`}>{item.metrics.attendees}</div>
                                                    <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-gray-500'}`}>Attendees</div>
                                                </div>
                                            )}
                                            {item.metrics.satisfaction && (
                                                <div className={`p-4 rounded-lg text-center border ${theme === 'light' ? 'bg-[rgb(var(--yellow-200))] border-[rgb(var(--yellow-400))]' : 'bg-white/5 border-white/10'}`}>
                                                    <Star className={`w-5 h-5 mx-auto mb-2 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-[#FBBC04]'}`} />
                                                    <div className={`text-2xl font-display ${theme === 'light' ? 'text-[rgb(var(--text-primary-raw))]' : 'text-white'}`}>{item.metrics.satisfaction}</div>
                                                    <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-gray-500'}`}>Rating</div>
                                                </div>
                                            )}
                                            {item.metrics.duration && (
                                                <div className={`p-4 rounded-lg text-center border ${theme === 'light' ? 'bg-[rgb(var(--yellow-200))] border-[rgb(var(--yellow-400))]' : 'bg-white/5 border-white/10'}`}>
                                                    <Clock className={`w-5 h-5 mx-auto mb-2 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-[#EA4335]'}`} />
                                                    <div className={`text-xl font-display ${theme === 'light' ? 'text-[rgb(var(--text-primary-raw))]' : 'text-white'}`}>{item.metrics.duration}</div>
                                                    <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-gray-500'}`}>Duration</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Narrative */}
                                <div className="md:col-span-2 space-y-8">
                                    <div className="prose prose-invert lg:prose-xl">
                                        <h3 className="font-display text-2xl mb-4" style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : '#4285F4' }}>
                                            {item.story?.intro}
                                        </h3>
                                        <p className="leading-relaxed whitespace-pre-line font-light text-lg" style={{ color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : '#D1D5DB' }}>
                                            {item.story?.narrative}
                                        </p>

                                        <div className={`mt-8 p-6 border-l-4 rounded-r-lg ${theme === 'light' ? 'bg-[rgb(var(--yellow-100))] border-[rgb(var(--text-secondary-raw))]' : 'bg-white/5 border-[#34A853]'}`}>
                                            <h4 className={`text-sm font-mono uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-[#34A853]'}`}>Impact</h4>
                                            <p className={`font-medium italic ${theme === 'light' ? 'text-[rgb(var(--text-primary-raw))]' : 'text-white'}`}>
                                                {item.story?.impact}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Participants */}
                                    {item.participants && item.participants.length > 0 && (
                                        <div className="pt-8 border-t border-white/10">
                                            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500 mb-6">Featuring</h4>
                                            <div className="flex flex-wrap gap-8">
                                                {item.participants.map((person, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold border border-white/10">
                                                            {person.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{person.name}</div>
                                                            <div className="text-xs text-gray-400">{person.role}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* SCATTERED GALLERY ("VISUAL MASTERPIECE" UPGRADE) */}
                            {item.gallery && item.gallery.length > 0 && (
                                <div className="w-full mt-24 relative z-10">
                                    <div className="max-w-4xl mx-auto mb-16 px-6 md:px-0 flex items-center gap-4">
                                        <div className="h-px bg-white/20 flex-grow" />
                                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#4285F4]">Visual_Archives_V1</span>
                                        <div className="h-px bg-white/20 flex-grow" />
                                    </div>
                                    <ScatteredGallery images={item.gallery} />
                                </div>
                            )}

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StoryDetailView;

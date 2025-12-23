import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BookOpen, Code, Terminal, Video } from 'lucide-react';

const resources = [
    { id: 1, name: 'Codelabs', icon: Code, color: '#4285F4', description: 'Step-by-step tutorials' },
    { id: 2, name: 'Video Library', icon: Video, color: '#EA4335', description: 'Recorded sessions' },
    { id: 3, name: 'GitHub Repos', icon: Terminal, color: '#34A853', description: 'Open source projects' },
    { id: 4, name: 'Study Guides', icon: BookOpen, color: '#FBBC04', description: 'Learning paths' },
];

const ResourcesSection = () => {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const x = useTransform(scrollYProgress, [0, 1], [-50, 50]);

    return (
        <section ref={containerRef} id="resources" className="py-32 relative overflow-hidden bg-background">
            {/* Grid Background */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(52, 168, 83, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(52, 168, 83, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Floating Dots */}
            <motion.div
                style={{ x, backgroundColor: '#4285F4', boxShadow: '0 0 20px #4285F4' }}
                className="absolute top-40 left-10 w-3 h-3 rounded-full"
            />
            <motion.div
                style={{ x: useTransform(scrollYProgress, [0, 1], [50, -50]), backgroundColor: '#EA4335', boxShadow: '0 0 20px #EA4335' }}
                className="absolute top-60 right-20 w-4 h-4 rounded-full"
            />
            <motion.div
                style={{ x, backgroundColor: '#FBBC04', boxShadow: '0 0 15px #FBBC04' }}
                className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full"
            />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-20 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="lg:w-1/2"
                    >
                        <p
                            className="text-sm uppercase tracking-[0.3em] mb-4 font-bold"
                            style={{ color: '#34A853', textShadow: '0 0 30px #34A853' }}
                        >
                            Knowledge Hub
                        </p>
                        <h2 className="text-display-md font-display leading-[0.9] mb-8 text-[rgb(var(--foreground))] transition-colors duration-300">
                            LEARN & <br />
                            <span style={{ color: '#34A853', textShadow: '0 0 60px #34A85380' }}>GROW</span>
                        </h2>
                        <p className="text-[rgb(var(--foreground))]/50 text-xl mb-10 leading-relaxed transition-colors duration-300">
                            Access a wealth of knowledge. From interactive codelabs to recorded sessions, we provide the tools you need to master new technologies.
                        </p>
                        <motion.a
                            href="#"
                            whileHover={{ scale: 1.05, x: 10 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-4 text-white px-10 py-5 rounded-full font-body font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #34A853, #4285F4)',
                                boxShadow: '0 0 40px #34A85340, 0 10px 30px rgba(0,0,0,0.3)',
                            }}
                        >
                            <BookOpen className="w-6 h-6" /> Browse Resources <ArrowRight className="w-6 h-6" />
                        </motion.a>
                    </motion.div>

                    <div className="lg:w-1/2 grid grid-cols-2 gap-6">
                        {resources.map((res, i) => (
                            <motion.div
                                key={res.id}
                                initial={{ opacity: 0, y: 50, rotate: -3 }}
                                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                whileHover={{ y: -10, scale: 1.03, rotate: 1 }}
                                className="group cursor-pointer p-8 rounded-3xl border border-white/10"
                                style={{
                                    background: `linear-gradient(135deg, ${res.color}10 0%, transparent 100%)`,
                                    boxShadow: `0 0 40px ${res.color}10`,
                                }}
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-white/10"
                                    style={{
                                        background: `${res.color}20`,
                                        boxShadow: `0 0 30px ${res.color}30`,
                                    }}
                                >
                                    <res.icon className="w-8 h-8" style={{ color: res.color }} />
                                </div>
                                <h4
                                    className="font-display text-2xl mb-2"
                                    style={{ color: res.color }}
                                >
                                    {res.name}
                                </h4>
                                <p className="text-sm text-[rgb(var(--foreground))]/40 transition-colors duration-300">{res.description}</p>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ResourcesSection;

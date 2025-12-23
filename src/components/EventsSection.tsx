import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Calendar, History } from 'lucide-react';

const EventsSection = () => {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);

    return (
        <section ref={containerRef} id="events" className="py-32 relative overflow-hidden bg-background">
            {/* Grid Background */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(234, 67, 53, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(234, 67, 53, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Floating Orbs */}
            <motion.div
                style={{ y: y1, background: 'radial-gradient(circle, #4285F440 0%, transparent 70%)' }}
                className="absolute top-20 left-10 w-[300px] h-[300px] rounded-full blur-[100px]"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
                style={{ y: y2, background: 'radial-gradient(circle, #EA433530 0%, transparent 70%)' }}
                className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full blur-[120px]"
            />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-col md:flex-row items-center justify-between mb-20"
                >
                    <div>
                        <p
                            className="text-sm uppercase tracking-[0.3em] mb-3 font-bold"
                            style={{ color: '#EA4335', textShadow: '0 0 30px #EA4335' }}
                        >
                            What's Happening
                        </p>
                        <h2 className="text-display-md font-display text-white">EVENTS</h2>
                    </div>
                    <p className="text-white/40 max-w-md text-lg mt-4 md:mt-0">
                        Stay updated with our latest workshops, hackathons, and tech talks.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Upcoming Events Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        className="group relative rounded-3xl overflow-hidden border border-white/10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1) 0%, rgba(52, 168, 83, 0.1) 100%)',
                            boxShadow: '0 0 60px rgba(66, 133, 244, 0.1)',
                        }}
                    >
                        <div className="relative p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10"
                                    style={{
                                        background: 'rgba(66, 133, 244, 0.2)',
                                        boxShadow: '0 0 30px #4285F430',
                                    }}
                                >
                                    <Calendar className="w-8 h-8" style={{ color: '#4285F4' }} />
                                </div>
                                <div>
                                    <h3
                                        className="text-4xl md:text-5xl font-display"
                                        style={{ color: '#4285F4', textShadow: '0 0 40px #4285F480' }}
                                    >
                                        UPCOMING
                                    </h3>
                                    <p className="text-white/50 font-medium">WORKSHOPS & TALKS</p>
                                </div>
                            </div>
                            <p className="text-white/50 text-lg mb-8 leading-relaxed">
                                Join us for hands-on codelabs, tech talks by industry experts, and networking sessions that will level up your skills.
                            </p>
                            <motion.a
                                href="#"
                                whileHover={{ x: 10 }}
                                className="inline-flex items-center gap-3 font-bold text-lg"
                                style={{ color: '#4285F4' }}
                            >
                                View Calendar <ArrowRight className="w-5 h-5" />
                            </motion.a>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, #4285F420 0%, transparent 70%)' }} />
                    </motion.div>

                    {/* Past Events Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        className="group relative rounded-3xl overflow-hidden border border-white/10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(234, 67, 53, 0.1) 0%, rgba(251, 188, 4, 0.1) 100%)',
                            boxShadow: '0 0 60px rgba(234, 67, 53, 0.1)',
                        }}
                    >
                        <div className="relative p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10"
                                    style={{
                                        background: 'rgba(234, 67, 53, 0.2)',
                                        boxShadow: '0 0 30px #EA433530',
                                    }}
                                >
                                    <History className="w-8 h-8" style={{ color: '#EA4335' }} />
                                </div>
                                <div>
                                    <h3
                                        className="text-4xl md:text-5xl font-display"
                                        style={{ color: '#EA4335', textShadow: '0 0 40px #EA433580' }}
                                    >
                                        PAST
                                    </h3>
                                    <p className="text-white/50 font-medium">EVENTS ARCHIVE</p>
                                </div>
                            </div>
                            <p className="text-white/50 text-lg mb-8 leading-relaxed">
                                Missed an event? Browse through our archive of recordings, slide decks, and photo galleries from previous sessions.
                            </p>
                            <motion.a
                                href="#"
                                whileHover={{ x: 10 }}
                                className="inline-flex items-center gap-3 font-bold text-lg"
                                style={{ color: '#EA4335' }}
                            >
                                Explore Archive <ArrowRight className="w-5 h-5" />
                            </motion.a>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, #EA433520 0%, transparent 70%)' }} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default EventsSection;

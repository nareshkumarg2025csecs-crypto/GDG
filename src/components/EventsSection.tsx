import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Tag, Clock, ChevronRight } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formatEventDate, formatEventTimeRange, stripMarkdown, type ClubEvent } from '@/lib/formUtils';

const THEME_COLORS = ['#4285F4', '#34A853', '#EA4335', '#FBBC04'];

const EventsSection = () => {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);

    const [liveEvents, setLiveEvents] = useState<ClubEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { events } = await eventService.listEvents();
                const published = (events || []).filter(
                    (e) => e.details?.status === 'published' || e.details?.published === true
                );
                setLiveEvents(published.slice(0, 6)); // max 6 on homepage
            } catch {
                // silently fail — no events shown
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <section ref={containerRef} id="events" className="py-24 relative overflow-hidden bg-background">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(234, 67, 53, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(234, 67, 53, 0.3) 1px, transparent 1px)
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
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6"
                >
                    <div>
                        <p
                            className="text-sm uppercase tracking-[0.3em] mb-3 font-bold"
                            style={{ color: '#EA4335', textShadow: '0 0 30px #EA4335' }}
                        >
                            What's Happening
                        </p>
                        <h2 className="text-display-md font-display text-foreground">EVENTS</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="text-muted-foreground max-w-xs text-base leading-relaxed hidden md:block">
                            Stay updated with our latest workshops, hackathons, and tech talks.
                        </p>
                        <Link
                            to="/events"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 text-sm font-semibold text-foreground hover:bg-white/10 transition-all whitespace-nowrap"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>

                {/* Live Event Cards */}
                {isLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
                        ))}
                    </div>
                ) : liveEvents.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveEvents.map((event, i) => {
                            const details = event.details || {};
                            const accentColor = details.theme_color || THEME_COLORS[i % THEME_COLORS.length];
                            const banner = details.banner_url || details.coverImage || details.cover_image;
                            const category = details.category || 'Event';
                            const description = stripMarkdown(
                                details.description ||
                                details.custom_sections?.[0]?.content ||
                                'Join this GDG community session.'
                            );

                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                >
                                    <Link
                                        to={`/events/${event.id}`}
                                        className="block group relative rounded-3xl overflow-hidden border transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                        style={{
                                            borderColor: `${accentColor}25`,
                                            boxShadow: `0 4px 40px ${accentColor}10`,
                                            // @ts-ignore
                                            '--tw-ring-color': accentColor,
                                        }}
                                    >
                                        {/* Card Background */}
                                        {banner ? (
                                            <div className="relative h-44 bg-black overflow-hidden">
                                                <img
                                                    src={banner}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                                {/* Category badge over banner */}
                                                <div className="absolute top-4 left-4">
                                                    <span
                                                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                                                        style={{ background: `${accentColor}30`, color: accentColor, border: `1px solid ${accentColor}50` }}
                                                    >
                                                        {category}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="relative h-32 overflow-hidden"
                                                style={{
                                                    background: `radial-gradient(circle at 30% 40%, ${accentColor}40 0%, #050505 70%)`,
                                                }}
                                            >
                                                {/* Large accent number */}
                                                <div
                                                    className="absolute top-0 right-3 font-display leading-none opacity-[0.12] select-none"
                                                    style={{ fontSize: '6rem', color: accentColor }}
                                                >
                                                    {String(i + 1).padStart(2, '0')}
                                                </div>
                                                {/* Category badge */}
                                                <div className="absolute top-4 left-4">
                                                    <span
                                                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                                                        style={{ background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}45` }}
                                                    >
                                                        {category}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Card Body */}
                                        <div
                                            className="p-5 space-y-3"
                                            style={{
                                                background: banner
                                                    ? `linear-gradient(to bottom, #080808, #0d0d0d)`
                                                    : `linear-gradient(to bottom, rgba(${parseInt(accentColor.slice(1, 3), 16)},${parseInt(accentColor.slice(3, 5), 16)},${parseInt(accentColor.slice(5, 7), 16)},0.06) 0%, #080808 60%)`,
                                            }}
                                        >
                                            <h3 className="font-display text-white text-xl leading-tight line-clamp-2 group-hover:opacity-90 transition-opacity">
                                                {event.title}
                                            </h3>

                                            <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
                                                {description}
                                            </p>

                                            {/* Meta row */}
                                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                                {(details.startTime || details.start_time) && (
                                                    <div className="flex items-center gap-1 text-[11px] text-white/40">
                                                        <Calendar className="w-3 h-3" style={{ color: accentColor }} />
                                                        <span>{formatEventDate(details.startTime || details.start_time)}</span>
                                                    </div>
                                                )}
                                                {(details.location || details.venue) && (
                                                    <div className="flex items-center gap-1 text-[11px] text-white/40">
                                                        <MapPin className="w-3 h-3" style={{ color: accentColor }} />
                                                        <span className="truncate max-w-[100px]">{details.location || details.venue}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom CTA */}
                                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                                <span className="text-xs font-semibold" style={{ color: accentColor }}>
                                                    View Event
                                                </span>
                                                <ChevronRight
                                                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                                    style={{ color: accentColor }}
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom accent line */}
                                        <div
                                            className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
                                            style={{ backgroundColor: accentColor }}
                                        />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    /* Fallback: Static teaser cards when no published events */
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
                                        style={{ background: 'rgba(66, 133, 244, 0.2)', boxShadow: '0 0 30px #4285F430' }}
                                    >
                                        <Calendar className="w-8 h-8" style={{ color: '#4285F4' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl md:text-5xl font-display" style={{ color: '#4285F4', textShadow: '0 0 40px #4285F480' }}>
                                            UPCOMING
                                        </h3>
                                        <p className="text-white/50 font-medium">WORKSHOPS &amp; TALKS</p>
                                    </div>
                                </div>
                                <p className="text-white/50 text-lg mb-8 leading-relaxed">
                                    Join us for hands-on codelabs, tech talks by industry experts, and networking sessions.
                                </p>
                                <Link
                                    to="/events"
                                    className="inline-flex items-center gap-3 font-bold text-lg"
                                    style={{ color: '#4285F4' }}
                                >
                                    View Events <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
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
                                        style={{ background: 'rgba(234, 67, 53, 0.2)', boxShadow: '0 0 30px #EA433530' }}
                                    >
                                        <Clock className="w-8 h-8" style={{ color: '#EA4335' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl md:text-5xl font-display" style={{ color: '#EA4335', textShadow: '0 0 40px #EA433580' }}>
                                            BROWSE
                                        </h3>
                                        <p className="text-white/50 font-medium">ALL EVENTS</p>
                                    </div>
                                </div>
                                <p className="text-white/50 text-lg mb-8 leading-relaxed">
                                    Explore all events — open registrations, upcoming sessions, and hackathons.
                                </p>
                                <Link
                                    to="/events"
                                    className="inline-flex items-center gap-3 font-bold text-lg"
                                    style={{ color: '#EA4335' }}
                                >
                                    Explore All <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, #EA433520 0%, transparent 70%)' }} />
                        </motion.div>
                    </div>
                )}

                {/* View All link when live events are shown */}
                {liveEvents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mt-10 flex justify-center"
                    >
                        <Link
                            to="/events"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/15 text-sm font-bold text-white hover:bg-white/10 transition-all"
                        >
                            View All Events <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default EventsSection;

/**
 * EventsHorizontal.tsx
 * 
 * Horizontal Scroll Timeline using GSAP ScrollTrigger.
 * Vertical scroll is converted to horizontal movement.
 * 
 * Simple, reliable, looks premium.
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '@/contexts/ThemeContext'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// ================================
// TYPES & DATA
// ================================

interface EventItem {
    id: number
    title: string
    type: string
    date: string
    color: string
    description: string
    descriptionColor?: string
    badgeColor?: string
    badgeTextColor?: string
    borderColor?: string
}

const events: EventItem[] = [
    { id: 1, title: 'DevFest 2025', type: 'Conference', date: 'Jan 15', color: '#4285F4', description: 'Annual flagship developer conference with keynotes, workshops, and networking.' },
    { id: 2, title: 'Flutter Workshop', type: 'Workshop', date: 'Jan 28', color: '#34A853', description: 'Hands-on session to build your first cross-platform Flutter application.' },
    { id: 3, title: 'AI ML Study Jam', type: 'Study Jam', date: 'Feb 10', color: '#EA4335', description: 'Collaborative learning session on TensorFlow and machine learning basics.' },
    { id: 4, title: 'Cloud Summit', type: 'Summit', date: 'Feb 25', color: '#FBBC04', description: 'Deep dive into Google Cloud Platform services and best practices.' },
    { id: 5, title: 'Hackathon 2025', type: 'Hackathon', date: 'Mar 8-9', color: '#4285F4', description: '48-hour coding marathon to build innovative solutions.' },
    { id: 6, title: 'Firebase Workshop', type: 'Workshop', date: 'Mar 22', color: '#EA4335', description: 'Learn backend-as-a-service with Firebase for web and mobile apps.' },
    { id: 7, title: 'Women Techmakers', type: 'Panel', date: 'Apr 5', color: '#FBBC04', description: 'Panel discussion celebrating women in technology.' },
    { id: 8, title: 'I/O Extended', type: 'Watch Party', date: 'May 14', color: '#34A853', description: 'Live watch party for Google I/O with local networking.' },
]

// ================================
// EVENT CARD COMPONENT
// ================================

interface EventCardProps {
    event: EventItem
    index: number
}

function EventCard({ event, index }: EventCardProps) {
    return (
        <div
            className="event-card flex-shrink-0 w-[350px] md:w-[450px] h-[400px] md:h-[500px] mx-4 md:mx-8 rounded-3xl relative overflow-hidden group"
            style={{
                background: event.color.includes('rgb') ? event.color : `linear-gradient(135deg, ${event.color}15, ${event.color}05)`,
                border: `1px solid ${event.borderColor || event.color + '40'}`,
                boxShadow: event.borderColor ? 'var(--shadow-md)' : `0 0 40px ${event.color}15`,
            }}
        >
            {/* Glow effect on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${event.color}20, transparent 70%)`,
                }}
            />

            {/* Card content */}
            <div className="relative z-10 h-full flex flex-col p-6 md:p-10">
                {/* Event number */}
                <div
                    className="text-[120px] md:text-[180px] font-display absolute top-0 right-4 opacity-10"
                    style={{ color: event.color }}
                >
                    {String(index + 1).padStart(2, '0')}
                </div>

                {/* Type badge */}
                <div
                    className="inline-block w-fit px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                    style={{
                        background: `${event.color}25`,
                        color: event.color,
                        border: `1px solid ${event.color}50`,
                    }}
                >
                    {event.type}
                </div>

                {/* Date */}
                <p
                    className="text-sm font-semibold tracking-widest uppercase mb-3"
                    style={{ color: event.color }}
                >
                    {event.date}
                </p>

                {/* Title */}
                <h3 className="text-3xl md:text-4xl font-display mb-4 leading-tight" style={{ color: event.descriptionColor || '#FFFFFF' }}>
                    {event.title}
                </h3>

                {/* Description */}
                <p className="text-sm md:text-base leading-relaxed mt-auto" style={{ color: event.descriptionColor ? 'rgba(var(--text-secondary-raw), 0.8)' : 'rgba(255,255,255,0.5)' }}>
                    {event.description}
                </p>

                {/* Decorative line */}
                <div
                    className="w-16 h-1 rounded-full mt-6"
                    style={{ background: event.badgeTextColor || event.color }}
                />
            </div>

            {/* Border glow animation */}
            <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    boxShadow: `inset 0 0 30px ${event.color}30, 0 0 30px ${event.color}20`,
                }}
            />
        </div>
    )
}

// ================================
// MAIN COMPONENT
// ================================

export function EventsHorizontal() {
    const containerRef = useRef<HTMLElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()

    const themeEvents = events.map(e => {
        if (theme === 'light') {
            return {
                ...e,
                descriptionColor: 'rgb(var(--text-primary-raw))', // Dark Neutral Text
                // We typically remove the color override to let the Google Colors show through
                // as tinted gradients (handled by EventCard logic).
                // However, we ensure the text is dark for readability.
            }
        }
        // Dark mode: replace yellow with Google Yellow, keep others
        return {
            ...e,
            color: e.color === '#FBBC04' ? '#FBBC04' : e.color
        }
    })

    useEffect(() => {
        const container = containerRef.current
        const track = trackRef.current
        const progress = progressRef.current

        if (!container || !track || !progress) return

        // Calculate how far to scroll (track width minus viewport)
        const getScrollDistance = () => -(track.scrollWidth - window.innerWidth)

        // Create the horizontal scroll animation
        const scrollTween = gsap.to(track, {
            x: getScrollDistance,
            ease: 'none',
            scrollTrigger: {
                trigger: container,
                pin: true,
                scrub: 1, // Smooth scrubbing
                end: () => "+=3000", // Fixed scroll distance to ensure stability
                invalidateOnRefresh: true,
            },
        })

        // Animate progress bar
        gsap.to(progress, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: container,
                start: 'top top',
                end: () => "+=3000",
                scrub: 1,
            },
        })

        // Cleanup
        return () => {
            scrollTween.kill()
            ScrollTrigger.getAll().forEach(st => st.kill())
        }
    }, [])

    return (
        <section
            ref={containerRef}
            id="events"
            className="relative bg-background overflow-hidden transition-colors duration-300"
        >
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(rgb(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, rgb(var(--foreground)) 1px, transparent 1px)
          `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Ambient glow */}
            {/* Ambient glow - Dark mode only */}
            {theme === 'dark' && (
                <>
                    <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
                        style={{ background: 'radial-gradient(circle, #4285F4, transparent)' }}
                    />
                    <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
                        style={{ background: 'radial-gradient(circle, #EA4335, transparent)' }}
                    />
                </>
            )}

            {/* Main container */}
            <div className="h-screen flex flex-col justify-center">
                {/* Header */}
                <div className="absolute top-16 left-0 right-0 z-20 px-8 md:px-16">
                    <p
                        className="text-xs uppercase tracking-[0.4em] font-semibold mb-2"
                        // use 'rgb(var(--text-secondary-raw))' in light mode for the label
                        style={{
                            color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : '#EA4335',
                            textShadow: theme === 'light' ? 'none' : '0 0 20px rgba(234,67,53,0.5)'
                        }}
                    >
                        What's Happening
                    </p>
                    <h2 className="text-5xl md:text-7xl font-display text-[rgb(var(--foreground))] transition-colors duration-300">
                        EVENTS
                    </h2>
                </div>

                {/* Horizontal track */}
                <div
                    ref={trackRef}
                    className="flex items-center pl-8 md:pl-16 pt-24"
                >
                    {/* Intro text */}
                    <div className="flex-shrink-0 w-[300px] md:w-[400px] mr-8 md:mr-16">
                        <p className="text-[rgb(var(--foreground))]/50 text-lg md:text-xl leading-relaxed transition-colors duration-300">
                            Journey through our semester's
                            <span className="text-[rgb(var(--foreground))] font-semibold"> upcoming events</span>.
                            Workshops, hackathons, and tech talks await.
                        </p>
                        <div className={`flex items-center gap-2 mt-6 text-sm ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-white/30'}`}>
                            <span>Scroll to explore</span>
                            <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>

                    {/* Event cards */}
                    {themeEvents.map((event, index) => (
                        <EventCard key={event.id} event={event} index={index} />
                    ))}

                    {/* End spacer */}
                    <div className="flex-shrink-0 w-[200px] md:w-[400px] flex items-center justify-center">
                        <p className="text-white/20 text-lg">More coming soon...</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-8 left-8 right-8 md:left-16 md:right-16 z-20">
                    <div className={`h-1 rounded-full overflow-hidden ${theme === 'light' ? 'bg-black/10' : 'bg-white/10'}`}>
                        <div
                            ref={progressRef}
                            className="h-full rounded-full origin-left"
                            style={{
                                transform: 'scaleX(0)',
                                background: theme === 'light'
                                    ? 'rgb(var(--text-primary-raw))'
                                    : `linear-gradient(90deg, #4285F4, #EA4335, #FBBC04, #34A853)`,
                            }}
                        />
                    </div>
                    <div className={`flex justify-between text-xs mt-2 ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))]' : 'text-white/30'}`}>
                        <span>January</span>
                        <span>May</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default EventsHorizontal

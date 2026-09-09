/**
 * EventsHorizontal.tsx
 *
 * Horizontal Scroll Timeline using GSAP ScrollTrigger.
 * CRITICAL FIX: Uses gsap.context() scoping — never kills foreign ScrollTriggers.
 * Enhanced: poster-style cards with gradient mesh tops + hover lift/glow.
 * Mobile: native horizontal scroll with scroll-snap fallback.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTheme } from '@/contexts/ThemeContext';
import { eventService } from '@/services/eventService';
import { formatEventDate, formatEventDateRange, stripMarkdown } from '@/lib/formUtils';

gsap.registerPlugin(ScrollTrigger);

// ================================
// TYPES & DATA
// ================================

interface EventItem {
  id: string | number;
  eventId?: string;
  title: string;
  type: string;
  date: string;
  color: string;
  description: string;
  bannerUrl?: string;
  colorB?: string;
  descriptionColor?: string;
}

const events: EventItem[] = [
  { id: 1, title: 'DevFest 2025',       type: 'Conference',  date: 'Jan 15',  color: '#4285F4', colorB: '#0a2a6e', description: 'Annual flagship developer conference with keynotes, workshops, and networking.' },
  { id: 2, title: 'Flutter Workshop',   type: 'Workshop',    date: 'Jan 28',  color: '#34A853', colorB: '#0a3320', description: 'Hands-on session to build your first cross-platform Flutter application.' },
  { id: 3, title: 'AI ML Study Jam',    type: 'Study Jam',   date: 'Feb 10',  color: '#EA4335', colorB: '#5c0a05', description: 'Collaborative learning session on TensorFlow and machine learning basics.' },
  { id: 4, title: 'Cloud Summit',       type: 'Summit',      date: 'Feb 25',  color: '#FBBC04', colorB: '#5c3d00', description: 'Deep dive into Google Cloud Platform services and best practices.' },
  { id: 5, title: 'Hackathon 2025',     type: 'Hackathon',   date: 'Mar 8–9', color: '#4285F4', colorB: '#0a1f5c', description: '48-hour coding marathon to build innovative solutions with your team.' },
  { id: 6, title: 'Firebase Workshop',  type: 'Workshop',    date: 'Mar 22',  color: '#EA4335', colorB: '#3d0a07', description: 'Learn backend-as-a-service with Firebase for web and mobile apps.' },
  { id: 7, title: 'Women Techmakers',   type: 'Panel',       date: 'Apr 5',   color: '#FBBC04', colorB: '#3d2800', description: 'Panel discussion celebrating women in technology and inclusive leadership.' },
  { id: 8, title: 'I/O Extended',       type: 'Watch Party', date: 'May 14',  color: '#34A853', colorB: '#073d1a', description: 'Live watch party for Google I/O with local networking and demos.' },
];

// ================================
// EVENT CARD — poster style
// ================================

function EventCard({ event, index, isDark }: { event: EventItem; index: number; isDark: boolean }) {
  const cardContent = (
    <div
      className="event-card flex-shrink-0 w-[300px] md:w-[380px] h-[440px] md:h-[520px] mx-3 md:mx-6 rounded-3xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 will-change-transform cursor-pointer"
      data-physics
      data-cursor="media"
      role="article"
      tabIndex={0}
      style={{
        border: `1px solid ${event.color}35`,
        boxShadow: `0 4px 40px ${event.color}15`,
        transform: 'translateZ(0)',
        // @ts-ignore
        '--tw-ring-color': event.color,
      }}
    >
      {/* Banner Backdrop (if present) or Poster mesh gradient */}
      {event.bannerUrl ? (
        <div className="absolute inset-0 bg-black">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-65"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Heavy gradient scrim ensuring text at bottom is ALWAYS 100% crisp & readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? `radial-gradient(circle at 30% 20%, ${event.color}70 0%, ${event.colorB || '#000'}cc 55%, #050505 100%)`
              : `radial-gradient(circle at 30% 20%, ${event.color}90 0%, ${event.colorB || '#1a1a2e'}dd 55%, #111 100%)`,
          }}
        />
      )}

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{ boxShadow: `inset 0 0 0 1px ${event.color}80, 0 0 50px ${event.color}30` }}
      />

      {/* Large background number */}
      <div
        className="absolute top-[-10px] right-2 font-display leading-none opacity-[0.12] pointer-events-none select-none"
        style={{ fontSize: 'clamp(7rem, 14vw, 14rem)', color: event.color }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col p-5 md:p-7 justify-between">
        {/* Type badge */}
        <div
          className="inline-flex w-fit items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            color: event.color,
            border: `1px solid ${event.color}60`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {event.type}
        </div>

        {/* Bottom content block with backdrop protection */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 shadow-2xl space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: event.color }}>
            {event.date}
          </p>

          <h3
            className="font-display leading-tight line-clamp-2 text-white drop-shadow-sm"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
          >
            {event.title}
          </h3>

          <p className="text-xs md:text-sm leading-relaxed line-clamp-2 text-white/80 font-normal">
            {event.description}
          </p>

          {/* Expanding accent line on hover */}
          <div className="mt-3 h-[1.5px] bg-white/15 relative overflow-hidden rounded">
            <div
              className="absolute inset-y-0 left-0 w-0 group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ backgroundColor: event.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (event.eventId) {
    return <Link to={`/events/${event.eventId}`}>{cardContent}</Link>;
  }

  return <Link to="/events">{cardContent}</Link>;
}

// ================================
// MAIN COMPONENT
// ================================

export function EventsHorizontal() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [liveEvents, setLiveEvents] = useState<EventItem[]>(events);

  // Fetch live published events from backend
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const { events: fetched } = await eventService.listEvents();
        const published = (fetched || []).filter(
          (e) => e.details?.status === 'published' || e.details?.published === true
        );

        if (published.length > 0) {
          const colors = ['#4285F4', '#34A853', '#EA4335', '#FBBC04'];
          const mapped: EventItem[] = published.map((e, idx) => {
            const details = e.details || {};
            const col = details.theme_color || colors[idx % colors.length];
            return {
              id: e.id,
              eventId: e.id,
              title: e.title,
              type: details.category || 'Workshop',
              date: formatEventDateRange(
                details.startTime || details.start_time,
                details.endTime || details.end_time
              ),
              color: col,
              bannerUrl: details.banner_url || details.coverImage || details.cover_image,
              description: stripMarkdown(
                details.description ||
                (details.custom_sections && details.custom_sections[0]?.content) ||
                'Join this Google Developer Group community session.'
              ),
            };
          });
          setLiveEvents(mapped);
        }
      } catch {
        // Fallback to initial events
      }
    };

    fetchLiveEvents();
  }, []);

  const themeEvents = liveEvents.map((e) =>
    theme === 'light'
      ? { ...e, descriptionColor: 'rgba(255,255,255,0.75)' }
      : { ...e }
  );

  // CRITICAL: scoped gsap.context() — never touches foreign ScrollTriggers
  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const progress = progressRef.current;
      if (!track || !progress) return;

      const getDistance = () => -(track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: getDistance,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: true,
          end: '+=3200',
          invalidateOnRefresh: true,
        },
      });

      gsap.to(progress, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=3200',
          scrub: true,
        },
      });
    }, sectionRef); // <-- scope to this component only

    return () => ctx.revert(); // cleans ONLY this component's triggers
  }, [liveEvents]);

  return (
    <section
      ref={sectionRef}
      id="events"
      className="relative bg-background overflow-hidden transition-colors duration-300"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgb(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, rgb(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: isDark ? 0.025 : 0.035,
        }}
      />

      {/* Ambient glows — dark only */}
      {isDark && (
        <>
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.15] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #4285F4, transparent)' }} />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-[130px] opacity-[0.12] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #EA4335, transparent)' }} />
        </>
      )}

      {/* Desktop layout */}
      <div className="h-screen flex-col justify-center hidden md:flex">
        {/* Section header */}
        <div className="absolute top-16 left-0 right-0 z-20 px-8 md:px-16">
          <p
            className="section-eyebrow mb-2"
            style={{
              color: isDark ? '#EA4335' : 'rgb(var(--text-secondary-raw))',
              textShadow: isDark ? '0 0 20px rgba(234,67,53,0.5)' : 'none',
            }}
          >
            What's Happening
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              color: 'rgb(var(--foreground))',
              lineHeight: 1,
            }}
          >
            EVENTS
          </h2>
        </div>

        {/* Horizontal track */}
        <div ref={trackRef} className="flex items-center pl-8 md:pl-16 pt-28">
          {/* Intro text block */}
          <div className="flex-shrink-0 w-[260px] md:w-[360px] mr-8 md:mr-14">
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,31,31,0.55)' }}
            >
              Journey through our semester's{' '}
              <span style={{ color: 'rgb(var(--foreground))', fontWeight: 600 }}>upcoming events</span>.
              Workshops, hackathons, and tech talks await.
            </p>
            <div
              className="flex items-center gap-2 mt-5 text-xs uppercase tracking-widest"
              style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(31,31,31,0.4)' }}
            >
              <span>Scroll to explore</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Cards */}
          {themeEvents.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} isDark={isDark} />
          ))}

          {/* End spacer */}
          <div className="flex-shrink-0 w-[200px] md:w-[320px] flex items-center justify-center">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(31,31,31,0.3)' }}
            >
              More coming soon
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-8 left-8 right-8 md:left-16 md:right-16 z-20">
          <div className="h-[2px] rounded-full overflow-hidden"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,31,31,0.1)' }}>
            <div
              ref={progressRef}
              className="h-full rounded-full origin-left"
              style={{
                transform: 'scaleX(0)',
                background: isDark
                  ? 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC04, #34A853)'
                  : '#1F1F1F',
              }}
            />
          </div>
          <div
            className="flex justify-between text-[10px] uppercase tracking-widest mt-1.5"
            style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(31,31,31,0.35)' }}
          >
            <span>January</span>
            <span>May</span>
          </div>
        </div>
      </div>

      {/* Mobile: native scroll-snap */}
      <div className="md:hidden py-20 px-4">
        <div className="mb-10 px-2">
          <p className="section-eyebrow mb-2" style={{ color: '#EA4335' }}>What's Happening</p>
          <h2 className="font-display text-5xl" style={{ color: 'rgb(var(--foreground))' }}>EVENTS</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {themeEvents.map((event, i) => (
            <div key={event.id} className="snap-start">
              <EventCard event={event} index={i} isDark={isDark} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EventsHorizontal;

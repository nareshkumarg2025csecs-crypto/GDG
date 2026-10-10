import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  CalendarPlus,
  X as XIcon,
  RotateCcw,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { eventService, EVENT_QUERY_KEYS } from '@/services/eventService';
import { formService, FORM_QUERY_KEYS } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { EventQrModal } from '@/components/EventQrModal';
import {
  type ClubEvent,
  parseEventDate,
} from '@/lib/formUtils';

import { EventsHero } from '@/components/events/EventsHero';
import {
  EventsDiscoveryBar,
  type TimeframeFilter,
  type SortOption,
} from '@/components/events/EventsDiscoveryBar';
import { EventCard } from '@/components/events/EventCard';
import { EventSkeletons } from '@/components/events/EventSkeletons';

export const EventsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Filters State - Default: Upcoming Events first!
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');

  const [calendarProcessingId, setCalendarProcessingId] = useState<string | null>(null);
  const [showCalendarConnectModal, setShowCalendarConnectModal] = useState(false);
  const [calendarConnectUrl, setCalendarConnectUrl] = useState<string | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<{ title: string; url: string } | null>(null);
  const [localAddedCalendarEventIds, setLocalAddedCalendarEventIds] = useState<string[]>([]);

  // 1. Cached Events Query (5-minute staleTime)
  const {
    data: eventsRes,
    isLoading: isEventsLoading,
  } = useQuery({
    queryKey: EVENT_QUERY_KEYS.list(),
    queryFn: () => eventService.listEvents(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 2. Cached Forms Summary Query (1 batch request, shared across cards)
  const { data: formsSummaryRes } = useQuery({
    queryKey: FORM_QUERY_KEYS.summary(),
    queryFn: () => formService.getFormsSummary(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 3. User Submissions Query (only when authenticated, cached)
  const { data: subsRes } = useQuery({
    queryKey: FORM_QUERY_KEYS.mySubmissions(),
    queryFn: () => formService.getMySubmissions().catch(() => ({ message: 'ok', count: 0, submissions: [] })),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 4. Calendar Reminders Query (only when authenticated, cached)
  const { data: calRes } = useQuery({
    queryKey: EVENT_QUERY_KEYS.calendar(),
    queryFn: () => eventService.getMyCalendarEvents().catch(() => ({ event_ids: [], count: 0 })),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const isLoading = isEventsLoading;

  // Filter to published events only
  const publishedEvents = useMemo(() => {
    const all = eventsRes?.events || [];
    return all.filter(
      (e) => e.details?.status === 'published' || e.details?.published === true
    );
  }, [eventsRes]);

  const formsByEvent = useMemo(() => {
    return formsSummaryRes?.formsByEvent || {};
  }, [formsSummaryRes]);

  const mySubmissions = useMemo(() => {
    return subsRes?.submissions || [];
  }, [subsRes]);

  const addedCalendarEventIds = useMemo(() => {
    const fetched = calRes?.event_ids || [];
    return Array.from(new Set([...fetched, ...localAddedCalendarEventIds]));
  }, [calRes, localAddedCalendarEventIds]);

  const registeredFormIds = useMemo(() => {
    return new Set(mySubmissions.map((s) => s.form_id));
  }, [mySubmissions]);

  // Total community registrations count
  const totalRegistrationsCount = useMemo(() => {
    let sum = 0;
    Object.values(formsByEvent).forEach((form) => {
      if (typeof form?.submission_count === 'number') {
        sum += form.submission_count;
      }
    });
    return sum;
  }, [formsByEvent]);

  // Page title
  useEffect(() => {
    document.title = 'Events & Workshops | Google Developer Groups on Campus';
  }, []);

  // Restore scroll position after returning from event details
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('gdg_events_scroll_y');
    if (savedScroll && !isLoading && publishedEvents.length > 0) {
      const scrollY = parseInt(savedScroll, 10);
      sessionStorage.removeItem('gdg_events_scroll_y');
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      });
    }
  }, [isLoading, publishedEvents.length]);

  const handleEventCardNavigate = () => {
    sessionStorage.setItem('gdg_events_scroll_y', String(window.scrollY));
  };

  // Helper: check if event has concluded
  const isEventPast = (e: ClubEvent) => {
    const end = e.details?.endTime || e.details?.end_time;
    const start = e.details?.startTime || e.details?.start_time;
    const target = end ? parseEventDate(end) : (start ? parseEventDate(start) : null);
    if (!target) return false;
    return new Date() > target;
  };

  // Counts by timeframe
  const timeframeCounts = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    publishedEvents.forEach((e) => {
      if (isEventPast(e)) {
        past++;
      } else {
        upcoming++;
      }
    });
    return {
      upcoming,
      past,
      all: publishedEvents.length,
    };
  }, [publishedEvents]);

  // Distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    publishedEvents.forEach((e) => {
      if (e.details?.category) cats.add(e.details.category);
    });
    return ['all', ...Array.from(cats)];
  }, [publishedEvents]);

  // Dynamic category counts (scoped to current timeframe)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    categories.forEach((cat) => {
      counts[cat] = 0;
    });

    publishedEvents.forEach((e) => {
      const past = isEventPast(e);
      if (timeframe === 'upcoming' && past) return;
      if (timeframe === 'past' && !past) return;

      counts.all = (counts.all || 0) + 1;
      const cat = e.details?.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [publishedEvents, categories, timeframe]);

  // Filtered & Sorted Events - Prioritize Upcoming First!
  const filteredEvents = useMemo(() => {
    const filtered = publishedEvents.filter((event) => {
      const details = event.details || {};
      const past = isEventPast(event);

      // 1. Timeframe filter
      if (timeframe === 'upcoming' && past) return false;
      if (timeframe === 'past' && !past) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && details.category !== selectedCategory) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = event.title.toLowerCase().includes(q);
        const descMatch = (details.description || '').toLowerCase().includes(q);
        const venueMatch = (details.location || details.venue || '').toLowerCase().includes(q);
        const sectionsMatch = (details.custom_sections || [])
          .map((s) => `${s.title} ${s.content}`)
          .join(' ')
          .toLowerCase()
          .includes(q);
        return titleMatch || descMatch || venueMatch || sectionsMatch;
      }

      return true;
    });

    // Sort events
    return filtered.slice().sort((a, b) => {
      if (sortOption === 'title-asc') {
        return a.title.localeCompare(b.title);
      }

      const pastA = isEventPast(a);
      const pastB = isEventPast(b);

      // When "all" is selected, always show upcoming events first!
      if (timeframe === 'all' && pastA !== pastB) {
        return pastA ? 1 : -1;
      }

      const dateA = parseEventDate(a.details?.startTime || a.details?.start_time)?.getTime() || 0;
      const dateB = parseEventDate(b.details?.startTime || b.details?.start_time)?.getTime() || 0;

      // For past events, default to most recent first
      if (timeframe === 'past') {
        return sortOption === 'date-desc' ? dateA - dateB : dateB - dateA;
      }

      // For upcoming events: closest date first
      if (sortOption === 'date-asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }, [publishedEvents, timeframe, selectedCategory, searchQuery, sortOption]);

  // Google Calendar Integration
  const handleAddToCalendar = async (eventId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to sync this event with your Google Calendar.',
      });
      navigate(`/login?redirect=${encodeURIComponent('/events')}`);
      return;
    }

    setCalendarProcessingId(eventId);
    try {
      const res = await eventService.createCalendarReminder(eventId);

      if (
        res.action_required === 'CONNECT_GOOGLE_CALENDAR' ||
        res.action_required === 'RECONNECT_GOOGLE_CALENDAR'
      ) {
        try {
          const linkRes = await eventService.getGoogleLinkUrl();
          setCalendarConnectUrl(linkRes.url || null);
        } catch {
          setCalendarConnectUrl(null);
        }
        setShowCalendarConnectModal(true);
        return;
      }

      if (res.success || res.calendar_event_id) {
        setLocalAddedCalendarEventIds((prev) => [...prev, eventId]);
        toast({
          title: 'Event Synced to Google Calendar',
          description: res.message || 'Check your primary Google Calendar.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calendar Sync Error',
        description: 'Could not sync event. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setCalendarProcessingId(null);
    }
  };

  const handleResetFilters = () => {
    setTimeframe('upcoming');
    setSearchQuery('');
    setSelectedCategory('all');
    setSortOption('date-asc');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/30">
      <Header />

      <main id="main-content" className="flex-1 pt-24 sm:pt-28 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div
          className="fixed inset-0 opacity-[0.08] pointer-events-none -z-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(66, 133, 244, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(66, 133, 244, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Hero Section */}
          <EventsHero
            totalEvents={publishedEvents.length}
            upcomingCount={timeframeCounts.upcoming}
            pastCount={timeframeCounts.past}
            totalRegistrations={totalRegistrationsCount}
          />

          {/* Discovery Control Center: Prominent Upcoming / Past filters */}
          <EventsDiscoveryBar
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            categoryCounts={categoryCounts}
            timeframeCounts={timeframeCounts}
            sortOption={sortOption}
            onSortChange={setSortOption}
            filteredCount={filteredEvents.length}
            totalEventsCount={publishedEvents.length}
            onResetFilters={handleResetFilters}
          />

          {/* Events Listings Grid (Upcoming First by Default) */}
          {isLoading ? (
            <EventSkeletons count={6} />
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 px-4 border border-dashed border-border rounded-3xl bg-card/40 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto mb-4 border border-border">
                <Calendar className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">
                No events found
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                {searchQuery || selectedCategory !== 'all' || timeframe !== 'upcoming'
                  ? 'No sessions match your active filters or search query.'
                  : 'There are currently no sessions scheduled in this section.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, idx) => {
                const attachedForm = formsByEvent[event.id];
                const isRegistered = attachedForm ? registeredFormIds.has(attachedForm.id) : false;
                const isAddedToCal = addedCalendarEventIds.includes(event.id);

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={idx}
                    attachedForm={attachedForm}
                    isRegistered={isRegistered}
                    isAddedToCal={isAddedToCal}
                    isCalendarProcessing={calendarProcessingId === event.id}
                    isAuthenticated={isAuthenticated}
                    onAddToCalendar={handleAddToCalendar}
                    onShareQr={setQrModalEvent}
                    onNavigate={handleEventCardNavigate}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Google Calendar Connect Modal ── */}
        <AnimatePresence>
          {showCalendarConnectModal && (
            <motion.div
              key="cal-connect-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
              onClick={() => setShowCalendarConnectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-7 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-google-blue/10 border border-google-blue/20 flex items-center justify-center shrink-0">
                      <CalendarPlus className="w-5 h-5 text-google-blue" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Connect Google Calendar</h3>
                      <p className="text-xs text-muted-foreground font-mono">1-Click Reminders</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCalendarConnectModal(false)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Connecting Google Calendar allows you to sync GDG campus event reminders straight to your personal Google Calendar with automatic meeting details and notifications.
                  </p>
                  <p>
                    Your login session will remain active throughout.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {calendarConnectUrl ? (
                    <a
                      href={calendarConnectUrl}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-google-blue text-white text-sm font-semibold shadow-md hover:bg-google-blue/90 transition-all"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Connect Google Calendar
                    </a>
                  ) : (
                    <div className="flex-1 text-xs text-muted-foreground text-center py-2.5 rounded-xl bg-muted border border-border">
                      Generating authorization link...
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCalendarConnectModal(false)}
                    className="h-11 px-5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Share Modal */}
        {qrModalEvent && (
          <EventQrModal
            isOpen={Boolean(qrModalEvent)}
            onClose={() => setQrModalEvent(null)}
            eventTitle={qrModalEvent.title}
            eventUrl={qrModalEvent.url}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventsPage;

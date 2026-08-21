import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  ArrowLeft,
  Home,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import {
  type ClubEvent,
  type EventForm,
  type FormSubmission,
  getEventRegistrationState,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/formUtils';

const DEFAULT_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

export const EventsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [formsByEvent, setFormsByEvent] = useState<Record<string, EventForm>>({});
  const [mySubmissions, setMySubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [calendarProcessingId, setCalendarProcessingId] = useState<string | null>(null);

  // Load published events, attached forms, and student's submissions
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, subsRes] = await Promise.all([
        eventService.listEvents(),
        isAuthenticated
          ? formService.getMySubmissions().catch(() => ({ submissions: [] }))
          : Promise.resolve({ submissions: [] }),
      ]);

      const allEvents = eventsRes.events || [];
      const publishedEvents = allEvents.filter(
        (e) => e.details?.status === 'published' || e.details?.published === true
      );
      setEvents(publishedEvents);
      setMySubmissions(subsRes.submissions || []);

      // Fetch attached forms for each published event
      const formMap: Record<string, EventForm> = {};
      await Promise.all(
        publishedEvents.map(async (ev) => {
          try {
            const { forms } = await formService.getFormsByEvent(ev.id);
            if (forms && forms.length > 0) {
              formMap[ev.id] = forms[0];
            }
          } catch {
            // Ignore single form failure
          }
        })
      );
      setFormsByEvent(formMap);
    } catch (err: any) {
      toast({
        title: 'Error loading events',
        description: err.message || 'Could not fetch events from server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const registeredFormIds = useMemo(() => {
    return new Set(mySubmissions.map((s) => s.form_id));
  }, [mySubmissions]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    events.forEach((e) => {
      if (e.details?.category) cats.add(e.details.category);
    });
    return ['all', ...Array.from(cats)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const details = event.details || {};
      if (selectedCategory !== 'all' && details.category !== selectedCategory) {
        return false;
      }
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
  }, [events, searchQuery, selectedCategory]);

  const handleAddToCalendar = async (eventId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add this event reminder to your Google Calendar.',
      });
      return;
    }

    setCalendarProcessingId(eventId);
    try {
      const res = await eventService.createCalendarReminder(eventId);

      if (
        res.action_required === 'CONNECT_GOOGLE_CALENDAR' ||
        res.action_required === 'RECONNECT_GOOGLE_CALENDAR'
      ) {
        toast({
          title: 'Google Calendar Authorization',
          description: 'Redirecting to connect your Google Calendar...',
        });
        const { url } = await eventService.getGoogleLinkUrl();
        if (url) window.location.href = url;
        return;
      }

      if (res.success) {
        toast({
          title: 'Added to Google Calendar! 📅',
          description: res.message || 'Event is synced with your primary calendar.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calendar Sync Error',
        description: err.message || 'Could not sync event.',
        variant: 'destructive',
      });
    } finally {
      setCalendarProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Ambient */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(66, 133, 244, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(66, 133, 244, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-google-blue" />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/"
            className="p-2 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Go to Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-blue/10 text-google-blue border border-google-blue/20 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GDG Events & Workshops</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-sans tracking-tight text-foreground">
            Explore Upcoming Tech Events
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Discover workshops, hackathons, and tech sessions. Register in seconds and sync reminders straight to your Google Calendar.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events, topics, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-google-blue text-white shadow-sm'
                    : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat === 'all' ? 'All Events' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Display Grid (Poster-Style Design) */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading GDG events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed rounded-3xl bg-card/40">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No events found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or category filter.'
                : 'No published events at the moment. Stay tuned!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, idx) => {
              const details = event.details || {};
              const attachedForm = formsByEvent[event.id];
              const isRegistered = attachedForm ? registeredFormIds.has(attachedForm.id) : false;
              const regState = attachedForm
                ? getEventRegistrationState({
                    isRegistered,
                    expiresAt: attachedForm.expires_at || attachedForm.schema?.expires_at,
                  })
                : 'hidden';

              const accentColor = details.theme_color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
              const banner = details.banner_url || details.coverImage || details.cover_image;

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col justify-between rounded-3xl border bg-card text-card-foreground shadow-md hover:shadow-xl transition-all overflow-hidden group relative"
                  style={{
                    borderColor: `${accentColor}30`,
                  }}
                >
                  {/* Event Banner Image (if added by Admin) or Gradient Header */}
                  {banner ? (
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-black">
                      <img
                        src={banner}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      {/* Top Overlay Badge */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase backdrop-blur-md"
                          style={{
                            backgroundColor: `${accentColor}dd`,
                            color: '#ffffff',
                          }}
                        >
                          {details.category || 'Workshop'}
                        </span>

                        {regState === 'registered' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-google-green text-white font-mono shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Registered</span>
                          </span>
                        )}

                        {regState === 'closed' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-google-yellow text-black font-mono shadow-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Closed</span>
                          </span>
                        )}
                      </div>

                      {/* Title on Banner */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <Link
                          to={`/events/${event.id}`}
                          className="text-lg sm:text-xl font-bold font-sans text-white hover:underline line-clamp-1"
                        >
                          {event.title}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* Gradient Mesh Poster Header if no banner provided */
                    <div
                      className="p-6 pb-4 relative overflow-hidden"
                      style={{
                        background: `radial-gradient(circle at 80% 20%, ${accentColor}40 0%, transparent 70%)`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase"
                          style={{
                            backgroundColor: `${accentColor}20`,
                            color: accentColor,
                            border: `1px solid ${accentColor}40`,
                          }}
                        >
                          {details.category || 'Workshop'}
                        </span>

                        {regState === 'registered' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-google-green/10 text-google-green border border-google-green/30 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Registered</span>
                          </span>
                        )}

                        {regState === 'closed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-google-yellow/10 text-google-yellow border border-google-yellow/30 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>Closed</span>
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-xl font-bold font-sans text-foreground hover:text-google-blue transition-colors line-clamp-1"
                      >
                        {event.title}
                      </Link>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-6 pt-3 space-y-4">
                    {/* Description snippet */}
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {details.description ||
                        (details.custom_sections && details.custom_sections[0]?.content) ||
                        'Join us for this exciting Google Developer Group event.'}
                    </p>

                    {/* Metadata items */}
                    <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-google-blue shrink-0" />
                        <span>{formatEventDate(details.startTime || details.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-google-yellow shrink-0" />
                        <span>
                          {formatEventTimeRange(
                            details.startTime || details.start_time,
                            details.endTime || details.end_time
                          )}
                        </span>
                      </div>
                      {(details.location || details.venue) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-google-red shrink-0" />
                          <span className="truncate">{details.location || details.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={calendarProcessingId === event.id}
                      onClick={() => handleAddToCalendar(event.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-sm"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-google-yellow" />
                      <span>{calendarProcessingId === event.id ? 'Adding...' : 'Add to Cal'}</span>
                    </button>

                    {regState === 'open' && attachedForm ? (
                      <Link
                        to={`/events/${event.id}/form`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <span>Register</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to={`/events/${event.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;

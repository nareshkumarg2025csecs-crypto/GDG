import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarPlus,
  CalendarCheck,
  ArrowLeft,
  FileText,
  Share2,
  QrCode,
  Sparkles,
  ZoomIn,
  X as XIcon,
  Loader2,
  User,
  Users,
  ExternalLink,
  ShieldCheck,
  Flame,
  Timer,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService, EVENT_QUERY_KEYS, type EventsResponse } from '@/services/eventService';
import { formService, FORM_QUERY_KEYS } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { EventQrModal } from '@/components/EventQrModal';
import {
  type ClubEvent,
  type EventForm,
  getEventRegistrationState,
  formatEventDateRange,
  formatEventTimeRange,
  calculateRemainingTime,
  parseEventDate,
} from '@/lib/formUtils';
import EventTicketPass from '@/components/events/EventTicketPass';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const queryClient = useQueryClient();

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [bannerZoomOpen, setBannerZoomOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCalendarConnectModal, setShowCalendarConnectModal] = useState(false);
  const [calendarConnectUrl, setCalendarConnectUrl] = useState<string | null>(null);

  // Close lightbox on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setBannerZoomOpen(false);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = bannerZoomOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [bannerZoomOpen]);

  // 1. Instant cache lookup from existing events list (zero spinner when navigating from /events or home)
  const cachedList = queryClient.getQueryData<EventsResponse>(EVENT_QUERY_KEYS.list());
  const initialEvent = useMemo(() => {
    return cachedList?.events?.find((e) => e.id === id);
  }, [cachedList, id]);

  // 2. Event detail query with instant initialData
  const {
    data: eventRes,
    isLoading: isEventLoading,
  } = useQuery({
    queryKey: EVENT_QUERY_KEYS.detail(id || ''),
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
    initialData: initialEvent ? { message: 'Cached list item', event: initialEvent } : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const event = eventRes?.event || null;

  // 3. Form for this event (cached 5 min)
  const { data: formsRes } = useQuery({
    queryKey: FORM_QUERY_KEYS.byEvent(id || ''),
    queryFn: () => formService.getFormsByEvent(id!).catch(() => ({ message: 'ok', count: 0, forms: [] })),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const form = useMemo(() => {
    return formsRes?.forms && formsRes.forms.length > 0 ? formsRes.forms[0] : null;
  }, [formsRes]);

  // 4. User submissions query
  const { data: subsRes } = useQuery({
    queryKey: FORM_QUERY_KEYS.mySubmissions(),
    queryFn: () => formService.getMySubmissions().catch(() => ({ message: 'ok', count: 0, submissions: [] })),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 5. Calendar reminders query
  const { data: calRes } = useQuery({
    queryKey: EVENT_QUERY_KEYS.calendar(),
    queryFn: () => eventService.getMyCalendarEvents().catch(() => ({ event_ids: [], count: 0 })),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const userSubmission = useMemo(() => {
    if (!form || !subsRes?.submissions) return null;
    return subsRes.submissions.find((s) => s.form_id === form.id) || null;
  }, [form, subsRes]);

  const isRegistered = Boolean(userSubmission);

  const [localCalendarAdded, setLocalCalendarAdded] = useState(() => {
    return id ? localStorage.getItem(`gdg_calendar_added_${id}`) === 'true' : false;
  });

  const calendarAdded = useMemo(() => {
    if (localCalendarAdded) return true;
    if (id && calRes?.event_ids?.includes(id)) return true;
    return false;
  }, [localCalendarAdded, id, calRes]);

  const isLoading = isEventLoading && !initialEvent;

  const details = event?.details || {};
  const banner = details.banner_url || details.coverImage || details.cover_image || details.thumbnail_url;
  const accentColor = details.theme_color || '#4285F4';

  // Deduplicate About section if admin added it as custom section or primary description
  const primaryDescription = useMemo(() => {
    if (details.description?.trim()) return details.description;
    const aboutSec = (details.custom_sections || []).find(
      (s: any) => s.id === 'sec_about' || /about\s+(this|the)\s+event/i.test(s.title || '')
    );
    return aboutSec?.content || '';
  }, [details]);

  const filteredCustomSections = useMemo(() => {
    const rawSections = details.custom_sections || [];
    return rawSections.filter((section: any) => {
      if (!section.content && !section.url) return false;
      const title = (section.title || '').trim().toLowerCase();
      const isAboutTitle = title === 'about the event' || title === 'about this event' || title === 'about';
      const isSameContent = primaryDescription && section.content?.trim() === primaryDescription.trim();
      if (section.id === 'sec_about' && (isSameContent || isAboutTitle)) return false;
      if (isSameContent) return false;
      if (isAboutTitle && primaryDescription) return false;
      return true;
    });
  }, [details, primaryDescription]);

  // Live ticker for accurate real-time countdown
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const regState = useMemo(() => {
    if (!form) return 'hidden';
    const opensAt = form.opens_at || form.schema?.opens_at;
    return getEventRegistrationState({
      isRegistered,
      isOpen: form.schema?.is_open !== false && details.is_registration_open !== false,
      opensAt,
      expiresAt: form.expires_at || form.schema?.expires_at,
      isFull: form.is_full,
      submissionLimit: form.submission_limit ?? form.schema?.submission_limit,
      submissionCount: form.submission_count,
      now,
    });
  }, [form, isRegistered, details, now]);

  const handleAddToCalendar = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign In Required',
        description: 'Please log in to add events to your Google Calendar.',
      });
      navigate(`/login?redirect=${encodeURIComponent(`/events/${id}`)}`);
      return;
    }

    if (!id) return;
    setIsCalendarLoading(true);

    try {
      const res = await eventService.createCalendarReminder(id);

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
        setLocalCalendarAdded(true);
        try {
          localStorage.setItem(`gdg_calendar_added_${id}`, 'true');
        } catch (_) {}
        toast({
          title: 'Event Synced to Google Calendar',
          description: res.message || 'Check your primary Google Calendar.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calendar Sync Failed',
        description: 'Could not sync event. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'GDG Event',
        text: 'Check out this event on GDG on Campus!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied', description: 'Event link copied to your clipboard.' });
    }
  };

  // Determine event timing, countdown & conclusion state
  const eventStartTime = useMemo(() => {
    const st = details?.startTime || details?.start_time;
    if (!st) return null;
    return parseEventDate(st);
  }, [details]);

  const eventEndTime = useMemo(() => {
    const et = details?.endTime || details?.end_time || details?.startTime || details?.start_time;
    if (!et) return null;
    return parseEventDate(et);
  }, [details]);

  const eventEnded = useMemo(() => {
    if (!eventEndTime) return false;
    return now > eventEndTime;
  }, [eventEndTime, now]);

  const isUpcomingStart = useMemo(() => {
    if (!eventStartTime || eventEnded) return false;
    return eventStartTime.getTime() > now.getTime();
  }, [eventStartTime, eventEnded, now]);

  const isLiveNow = useMemo(() => {
    if (!eventStartTime || eventEnded) return false;
    const nowMs = now.getTime();
    const startMs = eventStartTime.getTime();
    const endMs = eventEndTime ? eventEndTime.getTime() : startMs + 3 * 3600 * 1000;
    return nowMs >= startMs && nowMs <= endMs;
  }, [eventStartTime, eventEndTime, eventEnded, now]);

  const startCountdown = useMemo(() => {
    if (!eventStartTime || !isUpcomingStart) return null;
    const diffMs = Math.max(0, eventStartTime.getTime() - now.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, totalSeconds };
  }, [eventStartTime, isUpcomingStart, now]);

  // Show Added to Calendar badge only while event hasn't ended
  const showCalendarAddedBadge = calendarAdded && !eventEnded;

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/30">
      <Header />

      <main id="main-content" className="flex-1 pt-24 sm:pt-28 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 pointer-events-none -z-10 opacity-20 blur-3xl">
          <div className="w-full h-full bg-gradient-to-r from-google-blue/20 via-google-red/15 to-google-green/20 rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Top Breadcrumb Navigation & Quick Actions */}
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3.5 py-2 rounded-xl hover:bg-muted/80 border border-border/60 shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Events</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                aria-label="Share as QR Code"
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR Pass</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Single Unified Event Master Card: Banner -> Details -> About -> Forms */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden divide-y divide-border/60">
            {/* 1. TOP BANNER */}
            <div className="relative w-full overflow-hidden bg-black">
              {banner ? (
                <div
                  className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-black group cursor-zoom-in"
                  onClick={() => setBannerZoomOpen(true)}
                >
                  <img
                    src={banner}
                    alt={event.title}
                    loading="eager"
                    decoding="async"
                    {...({ fetchpriority: 'high' })}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Zoom Hint Badge */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Click to expand</span>
                  </div>

                  {/* Category overlay */}
                  <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold font-mono uppercase backdrop-blur-md text-white shadow-sm"
                      style={{ backgroundColor: `${accentColor}dd` }}
                    >
                      {details.category || 'Workshop'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="aspect-[16/9] sm:aspect-[21/9] w-full p-6 sm:p-10 flex flex-col justify-between"
                  style={{
                    background: `radial-gradient(circle at 80% 20%, ${accentColor}35 0%, #111111 85%)`,
                  }}
                >
                  <div className="flex justify-end">
                    <span className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
                      <Sparkles className="w-5 h-5 text-white/90" />
                    </span>
                  </div>
                  <div>
                    <span
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase text-white inline-block mb-2"
                      style={{ backgroundColor: `${accentColor}dd` }}
                    >
                      {details.category || 'Workshop'}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                      {event.title}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            {/* 2. EVENT DETAILS SECTION */}
            <div className="p-6 sm:p-8 md:p-10 space-y-6">
              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  {details.category || 'Workshop'}
                </span>

                {details.participation_type && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-muted text-foreground border border-border">
                    {details.participation_type.toLowerCase() === 'team' ? (
                      <>
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>Team Event</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-google-blue" />
                        <span>Individual</span>
                      </>
                    )}
                  </span>
                )}

                {form && regState === 'registered' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-green text-white font-mono shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registration Confirmed</span>
                  </span>
                )}

                {form && regState === 'upcoming' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white font-mono shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Opens in {calculateRemainingTime(form?.opens_at || form?.schema?.opens_at, now).formattedShort}</span>
                  </span>
                )}

                {form && regState === 'full' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white font-mono shadow-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>Slots Full</span>
                  </span>
                )}

                {eventEnded && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground font-mono border border-border">
                    <span>Event Concluded</span>
                  </span>
                )}

                {form && !eventEnded && regState === 'closed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-yellow text-black font-mono shadow-xs">
                    <span>Closed</span>
                  </span>
                )}
              </div>

              {/* Event Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-foreground leading-tight">
                {event.title}
              </h1>

              {/* Live Countdown to Event Start */}
              {isUpcomingStart && startCountdown && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-google-blue/10 via-card to-google-blue/5 border border-google-blue/20 shadow-xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-google-blue">
                      <span className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                      <Timer className="w-3.5 h-3.5" />
                      <span>Event Starts In</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Live Ticker</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                    <div className="p-2 sm:p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
                      <span className="block text-xl sm:text-2xl md:text-3xl font-mono font-black text-foreground tabular-nums">
                        {startCountdown.days}
                      </span>
                      <span className="block text-[10px] font-mono text-muted-foreground uppercase">Days</span>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
                      <span className="block text-xl sm:text-2xl md:text-3xl font-mono font-black text-foreground tabular-nums">
                        {String(startCountdown.hours).padStart(2, '0')}
                      </span>
                      <span className="block text-[10px] font-mono text-muted-foreground uppercase">Hours</span>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
                      <span className="block text-xl sm:text-2xl md:text-3xl font-mono font-black text-foreground tabular-nums">
                        {String(startCountdown.minutes).padStart(2, '0')}
                      </span>
                      <span className="block text-[10px] font-mono text-muted-foreground uppercase">Mins</span>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
                      <span className="block text-xl sm:text-2xl md:text-3xl font-mono font-black text-google-blue tabular-nums">
                        {String(startCountdown.seconds).padStart(2, '0')}
                      </span>
                      <span className="block text-[10px] font-mono text-muted-foreground uppercase">Secs</span>
                    </div>
                  </div>
                </div>
              )}

              {isLiveNow && (
                <div className="p-3.5 rounded-2xl bg-google-green/10 border border-google-green/30 flex items-center gap-2.5 text-google-green">
                  <span className="w-2.5 h-2.5 rounded-full bg-google-green animate-ping" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Event is Live Right Now!</span>
                </div>
              )}

              {/* Key Event Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-sm">
                {/* Date Block */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="w-9 h-9 rounded-xl bg-google-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-google-blue" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono uppercase font-bold text-muted-foreground">
                      Event Date
                    </span>
                    <span className="font-semibold text-foreground text-xs sm:text-sm">
                      {formatEventDateRange(
                        details.startTime || details.start_time,
                        details.endTime || details.end_time
                      )}
                    </span>
                  </div>
                </div>

                {/* Time Block */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="w-9 h-9 rounded-xl bg-google-yellow/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-google-yellow" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono uppercase font-bold text-muted-foreground">
                      Time Schedule
                    </span>
                    <span className="font-semibold text-foreground text-xs sm:text-sm">
                      {formatEventTimeRange(
                        details.startTime || details.start_time,
                        details.endTime || details.end_time
                      )}
                    </span>
                  </div>
                </div>

                {/* Location / Venue Block */}
                {(details.location || details.venue) && (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/60 sm:col-span-2 md:col-span-1">
                    <div className="w-9 h-9 rounded-xl bg-google-red/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-google-red" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono uppercase font-bold text-muted-foreground">
                        Venue / Location
                      </span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm">
                        {details.location || details.venue}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sync to Google Calendar & Telemetry Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div>
                  {showCalendarAddedBadge ? (
                    <div className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-google-green/30 bg-google-green/10 text-google-green text-xs font-semibold">
                      <CalendarCheck className="w-4 h-4" />
                      <span>Added to Google Calendar</span>
                    </div>
                  ) : eventEnded ? null : (
                    <button
                      type="button"
                      disabled={isCalendarLoading}
                      onClick={handleAddToCalendar}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isCalendarLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-google-blue" />
                          <span>Adding to Google Calendar...</span>
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="w-4 h-4 text-google-yellow" />
                          <span>Sync to Google Calendar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Spots Telemetry */}
                {form && (form.show_submission_count !== false && form.schema?.show_submission_count !== false) && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Capacity: </span>
                    <span className="font-bold text-foreground font-mono">
                      {form.submission_count ?? 0} {form.submission_limit ? `/ ${form.submission_limit} seats` : 'registered'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ABOUT THIS EVENT & CONTENT SECTION */}
            <div className="p-6 sm:p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-google-blue" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">About this Event</h2>
              </div>

              <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {primaryDescription ? (
                  <MarkdownRenderer content={primaryDescription} />
                ) : (
                  <p>Join us for this exciting Google Developer Group campus event. Connect with community peers, learn practical skills, and build projects together.</p>
                )}
              </div>

              {/* Seamless Custom Sections (Speakers, Agenda, Resources, Guidelines) */}
              {filteredCustomSections.length > 0 && (
                <div className="pt-6 border-t border-border/60 space-y-6">
                  {filteredCustomSections.map((section: any, idx: number) => (
                    <div key={section.id || idx} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-google-green" />
                        <h3 className="text-lg font-display font-bold text-foreground">{section.title}</h3>
                      </div>

                      {section.type === 'link' ? (
                        <a
                          href={section.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-google-blue hover:underline font-semibold"
                        >
                          <span>{section.content || section.url || 'Open Resource'}</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2 border-border/70">
                          <MarkdownRenderer content={section.content} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. REGISTRATION & FORMS SECTION (Only shown when an event form is included) */}
            {form && (
              <div className="p-6 sm:p-8 md:p-10 bg-muted/20 space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-google-green" />
                  <h3 className="text-xl font-display font-bold text-foreground">Registration &amp; Participation</h3>
                </div>

                <div className="space-y-3">
                  {/* Form registration states */}
                  {regState === 'open' && !eventEnded && (
                    <div className="space-y-3">
                      {isAuthenticated ? (
                        <Link
                          to={`/events/${id}/form`}
                          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Fill Registration Form</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/events/${id}/form`)}`)}
                          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Sign in to Register</span>
                        </button>
                      )}
                      <p className="text-[11px] text-muted-foreground text-center">
                        Includes instant check-in QR pass &amp; email confirmation
                      </p>
                    </div>
                  )}

                  {regState === 'registered' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowTicketModal(true)}
                        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-google-green hover:bg-google-green/90 text-white font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View Check-in Ticket Pass</span>
                      </button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        You have secured your spot for this session
                      </p>
                    </div>
                  )}

                  {regState === 'upcoming' && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase">
                        <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                        <span>Registration Opens Soon</span>
                      </div>
                      <p className="text-xs text-foreground font-mono font-bold">
                        {calculateRemainingTime(form.opens_at || form.schema?.opens_at, now).formatted}
                      </p>
                    </div>
                  )}

                  {regState === 'full' && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase">
                        <Users className="w-3.5 h-3.5" />
                        <span>Event Capacity Reached</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All allocated slots for this event have been filled.
                      </p>
                    </div>
                  )}

                  {!eventEnded && regState === 'closed' && (
                    <div className="p-4 rounded-xl bg-google-yellow/10 border border-google-yellow/30 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase text-google-yellow">
                        <span>Registration Closed</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Registrations for this session are currently closed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Share Modal */}
        <EventQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          eventTitle={event?.title || 'Event'}
          eventUrl={window.location.href}
        />

        {/* Ticket Pass QR Modal */}
        {showTicketModal && event && (
          <EventTicketPass
            isModal
            onClose={() => setShowTicketModal(false)}
            event={event}
            submissionId={userSubmission?.id}
            submittedAt={userSubmission?.submitted_at}
            answers={userSubmission?.answers || {}}
            fields={form?.schema?.fields || []}
            attendeeName={profile?.full_name}
            attendeeEmail={profile?.email}
          />
        )}

        {/* Full-screen Image Lightbox */}
        <AnimatePresence>
          {bannerZoomOpen && banner && (
            <motion.div
              key="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4"
              onClick={() => setBannerZoomOpen(false)}
            >
              <button
                type="button"
                onClick={() => setBannerZoomOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors backdrop-blur-sm z-10 cursor-pointer"
                aria-label="Close image"
              >
                <XIcon className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-mono bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                Press <kbd className="bg-white/10 rounded px-1.5 py-0.5 font-bold">Esc</kbd> or click anywhere to close
              </div>
              <motion.img
                key="lightbox-img"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                src={banner}
                alt={event.title}
                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain border border-white/10 cursor-zoom-out"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Calendar Connect Modal */}
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
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0 cursor-pointer"
                    aria-label="Close modal"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Your <span className="font-semibold text-foreground">email &amp; password login is kept</span> — connecting Google only grants calendar access.
                  </p>
                  <p>
                    You'll be redirected to Google to approve calendar permissions. Once done, you'll return here.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {calendarConnectUrl ? (
                    <a
                      href={calendarConnectUrl}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-google-blue text-white text-sm font-semibold shadow-md hover:bg-google-blue/90 transition-all cursor-pointer"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Connect Google Calendar
                    </a>
                  ) : (
                    <div className="flex-1 text-xs text-muted-foreground text-center py-2.5 rounded-xl bg-muted border border-border">
                      Could not generate connect URL. Please try again.
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
      </main>

      <Footer />
    </div>
  );
};

export default EventDetailPage;
